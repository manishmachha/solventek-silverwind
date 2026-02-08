package com.solventek.silverwind.chat;

import java.io.IOException;
import java.security.MessageDigest;
import java.util.*;
import java.util.regex.Pattern;

import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class VectorStoreConfig {

    private static final Logger log = LoggerFactory.getLogger(VectorStoreConfig.class);

    @Value("classpath:documents/SolventekHandBook_recognized.pdf")
    private Resource pdfResource;

    private static final String SOURCE = "handbook";

    // BIG chunks (detailed). Tune safely for your embedding model limits.
    // Rule of thumb: 4 chars ~ 1 token (rough).
    private static final int TARGET_CHUNK_CHARS = 16000; // ~4000 tokens-ish
    private static final int MAX_CHUNK_CHARS = 22000; // safety cap
    private static final int OVERLAP_PAGES = 1; // overlap last page for continuity

    // If you want even more detail, increase TARGET_CHUNK_CHARS, but keep within
    // embedding input limits.
    // If embeddings fail due to size, lower this.

    private static final String INDEX_SYSTEM = """
            You are an expert policy indexer.
            Create a retrieval-optimized index note from the given handbook chunk.
            Do not invent anything. Keep meaning accurate.
            Output concise: Title, KeyTopics, Keywords.
            """;

    private static final String INDEX_USER_TEMPLATE = """
            Create an index note for this handbook chunk.

            Output EXACTLY:
            Title: <short title>
            KeyTopics:
            - <bullet>
            - <bullet>
            Keywords: <comma separated>

            Pages: %s
            Content:
            %s
            """;

    // Simple table-ish detection
    private static final Pattern MULTISPACE_COLS = Pattern.compile(".*\\S\\s{2,}\\S.*"); // "A B" style columns
    private static final Pattern PIPE_TABLE = Pattern.compile(".*\\|.*\\|.*"); // markdown-like
    private static final Pattern DASH_ROW = Pattern.compile("^[\\-\\s]{6,}$"); // separator row

    @Bean
    CommandLineRunner initVectorStore(VectorStore vectorStore,
            JdbcTemplate jdbcTemplate,
            ChatClient.Builder chatClientBuilder) {

        return args -> {
            try {
                jdbcTemplate.execute("CREATE EXTENSION IF NOT EXISTS vector");

                // Table and indexes are managed by Flyway migrations (V3, V4)

                if (!pdfResource.exists()) {
                    log.warn("PDF not found: {}", pdfResource.getDescription());
                    return;
                }

                byte[] pdfBytes = pdfResource.getInputStream().readAllBytes();
                String docHash = sha256Hex(pdfBytes);

                // If already indexed this exact pdf version, skip
                Integer existing = jdbcTemplate.queryForObject(
                        "SELECT COUNT(*) FROM handbook_chunks WHERE source=? AND doc_hash=?",
                        Integer.class, SOURCE, docHash);
                if (existing != null && existing > 0) {
                    log.info("Handbook already indexed (docHash={}). Skipping.", docHash);
                    return;
                }

                // Replace older versions
                jdbcTemplate.update("DELETE FROM handbook_chunks WHERE source=?", SOURCE);
                try {
                    jdbcTemplate.update("DELETE FROM vector_store WHERE (metadata->>'source')=?", SOURCE);
                } catch (Exception e) {
                    log.info("Could not delete from vector_store by metadata (schema may differ). Continuing...");
                }

                log.info("Extracting text pages from PDF...");
                List<PageText> pages = extractPages(pdfBytes);
                if (pages.isEmpty()) {
                    log.warn("No text extracted from PDF.");
                    return;
                }

                log.info("Building LARGE chunks (target chars ~{}) with overlap pages={}", TARGET_CHUNK_CHARS,
                        OVERLAP_PAGES);
                List<Chunk> chunks = buildLargeChunks(pages);

                ChatClient chatClient = chatClientBuilder.build();
                List<Document> vectorDocs = new ArrayList<>();

                for (int i = 0; i < chunks.size(); i++) {
                    Chunk c = chunks.get(i);

                    // Raw detailed chunk (table-aware formatted)
                    String raw = c.content;

                    // Create a small index note (helps retrieval quality a lot)
                    String indexNote = chatClient.prompt()
                            .system(s -> s.text(INDEX_SYSTEM))
                            .user(u -> u.text(String.format(INDEX_USER_TEMPLATE, c.pageStart + "-" + c.pageEnd,
                                    safeTrunc(raw, 12000))))
                            .call()
                            .content();

                    if (indexNote == null)
                        indexNote = "";

                    // Embedding text: still detailed, but prefixed with index note for better
                    // matching
                    String embeddingText = """
                            === INDEX NOTE ===
                            %s

                            === DETAILED CONTENT (verbatim-ish) ===
                            %s
                            """.formatted(indexNote.trim(), raw);

                    // Hard cap to avoid embedding model input errors
                    embeddingText = safeTrunc(embeddingText, MAX_CHUNK_CHARS);

                    UUID chunkId = UUID.randomUUID();

                    // Store raw for keyword matching (FTS)
                    // Note: search_tsv is a GENERATED column in Flyway migration, no need to insert it
                    jdbcTemplate.update(
                            """
                                        INSERT INTO handbook_chunks(chunk_id, source, doc_hash, page_start, page_end, raw_content)
                                        VALUES (?, ?, ?, ?, ?, ?)
                                    """,
                            chunkId, SOURCE, docHash, c.pageStart, c.pageEnd, raw);

                    // Store in vector store
                    Map<String, Object> meta = new HashMap<>();
                    meta.put("source", SOURCE);
                    meta.put("docHash", docHash);
                    meta.put("chunkId", chunkId.toString());
                    meta.put("pageStart", c.pageStart);
                    meta.put("pageEnd", c.pageEnd);

                    vectorDocs.add(new Document(embeddingText, meta));

                    log.info("Prepared chunk {}/{} pages {}-{}", i + 1, chunks.size(), c.pageStart, c.pageEnd);
                }

                vectorStore.add(vectorDocs);
                log.info("Indexed {} large chunks into vector store + handbook_chunks (docHash={})", vectorDocs.size(),
                        docHash);

            } catch (Exception e) {
                log.error("VectorStore init failed: {}", e.getMessage(), e);
            }
        };
    }

    // -------- Extraction --------

    private List<PageText> extractPages(byte[] pdfBytes) throws IOException {
        List<PageText> pages = new ArrayList<>();
        try (PDDocument pd = Loader.loadPDF(pdfBytes)) {

            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            int total = pd.getNumberOfPages();
            for (int p = 1; p <= total; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);

                String text = stripper.getText(pd);
                text = normalize(text);

                if (text == null || text.isBlank())
                    continue;

                // Table-aware formatting
                text = protectTables(text);

                pages.add(new PageText(p, text));
            }
        }
        return pages;
    }

    private String normalize(String s) {
        if (s == null)
            return "";
        String out = s.replace("\r", "");
        // Join hyphenated line breaks: "appro-\nval" => "approval"
        out = out.replaceAll("-\\n", "");
        // Collapse excessive blank lines
        out = out.replaceAll("\\n{3,}", "\n\n");
        // Trim trailing spaces per line
        out = out.replaceAll("[ \\t]+\\n", "\n");
        return out.trim();
    }

    /**
     * Preserves table-ish layouts by wrapping them into a fenced block.
     * This helps the LLM read tables correctly and keeps columns aligned.
     */
    private String protectTables(String pageText) {
        String[] lines = pageText.split("\\n");
        StringBuilder out = new StringBuilder();

        boolean inTable = false;
        StringBuilder tableBuf = new StringBuilder();

        for (String line : lines) {
            boolean looksLikeTable = looksLikeTableRow(line);

            if (looksLikeTable) {
                if (!inTable) {
                    inTable = true;
                    tableBuf.setLength(0);
                }
                tableBuf.append(line).append("\n");
            } else {
                if (inTable) {
                    // close table block
                    out.append("\n```text\n").append(tableBuf).append("```\n\n");
                    inTable = false;
                }
                out.append(line).append("\n");
            }
        }

        if (inTable) {
            out.append("\n```text\n").append(tableBuf).append("```\n\n");
        }

        return out.toString().trim();
    }

    private boolean looksLikeTableRow(String line) {
        String l = line.trim();
        if (l.isBlank())
            return false;
        if (PIPE_TABLE.matcher(l).matches())
            return true;
        if (DASH_ROW.matcher(l).matches())
            return true;
        return MULTISPACE_COLS.matcher(line).matches();
    }

    // -------- Chunking --------

    private List<Chunk> buildLargeChunks(List<PageText> pages) {
        List<Chunk> chunks = new ArrayList<>();

        int i = 0;
        while (i < pages.size()) {
            int startPage = pages.get(i).page;
            int endPage = startPage;

            StringBuilder buf = new StringBuilder();
            buf.append("=== PAGE ").append(startPage).append(" ===\n")
                    .append(pages.get(i).text).append("\n\n");

            int j = i + 1;
            while (j < pages.size()) {
                String next = "\n=== PAGE " + pages.get(j).page + " ===\n" + pages.get(j).text + "\n\n";
                if (buf.length() + next.length() > TARGET_CHUNK_CHARS)
                    break;
                buf.append(next);
                endPage = pages.get(j).page;
                j++;
            }

            String content = buf.toString().trim();
            chunks.add(new Chunk(startPage, endPage, content));

            // advance with overlap pages
            int nextIndex = j - OVERLAP_PAGES;
            if (nextIndex <= i)
                nextIndex = i + 1;
            i = nextIndex;
        }

        return chunks;
    }

    // -------- Utils --------

    private static String safeTrunc(String s, int maxChars) {
        if (s == null)
            return "";
        s = s.trim();
        if (s.length() <= maxChars)
            return s;
        return s.substring(0, maxChars) + "\n\n[TRUNCATED]";
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] digest = md.digest(bytes);
            return HexFormat.of().formatHex(digest);
        } catch (Exception e) {
            return "unknown";
        }
    }

    private record PageText(int page, String text) {
    }

    private record Chunk(int pageStart, int pageEnd, String content) {
    }
}
