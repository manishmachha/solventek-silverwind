package com.solventek.silverwind.org;

import com.solventek.silverwind.storage.StorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.text.PDFTextStripper;
import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.*;
import java.util.regex.Pattern;

/**
 * Service to manage the Employee Handbook.
 * Handles storage (S3/Local) and Indexing (RAG).
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class HandbookService {

    private final StorageService storageService;
    private final VectorStore vectorStore;
    private final JdbcTemplate jdbcTemplate;
    private final ChatClient.Builder chatClientBuilder;

    @Value("classpath:documents/SolventekHandBook_recognized.pdf")
    private Resource defaultPdfResource;

    private static final String STORAGE_KEY = "handbook/handbook.pdf";
    private static final String SOURCE = "handbook";

    // Chunking settings (same as VectorStoreConfig)
    private static final int TARGET_CHUNK_CHARS = 16000;
    private static final int MAX_CHUNK_CHARS = 22000;
    private static final int OVERLAP_PAGES = 1;

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
    private static final Pattern MULTISPACE_COLS = Pattern.compile(".*\\S\\s{2,}\\S.*");
    private static final Pattern PIPE_TABLE = Pattern.compile(".*\\|.*\\|.*");
    private static final Pattern DASH_ROW = Pattern.compile("^[\\-\\s]{6,}$");

    /**
     * Upload and index a new handbook.
     */
    public void uploadHandbook(MultipartFile file) {
        log.info("Uploading new handbook: {}", file.getOriginalFilename());

        // 1. Store file (overwrite existing)
        try {
            storageService.uploadWithKey(file, STORAGE_KEY);
        } catch (Exception e) {
            log.error("Failed to upload handbook to storage", e);
            throw new RuntimeException("Failed to upload handbook", e);
        }

        // 2. Re-index
        try (InputStream is = file.getInputStream()) {
            byte[] bytes = is.readAllBytes();
            reindex(bytes);
        } catch (IOException e) {
            log.error("Failed to read uploaded handbook for indexing", e);
            throw new RuntimeException("Failed to process handbook for indexing", e);
        }
    }

    /**
     * Get download URL.
     */
    public String getHandbookUrl() {
        if (!storageService.exists(STORAGE_KEY)) {
            // Fallback: If not in storage but we have default resource, return null or handle gracefully
            // Ideally we upload default to storage on init if missing.
            return null;
        }
        // Generate presigned URL valid for 1 hour
        return storageService.getPresignedUrl(STORAGE_KEY, Duration.ofHours(1));
    }

    /**
     * Initialize defaults if needed.
     * Called by CommandLineRunner on startup.
     */
    public void initDefaultIfMissing() {
        // Check if we have any chunks indexed
        Integer count = jdbcTemplate.queryForObject("SELECT COUNT(*) FROM handbook_chunks WHERE source=?", Integer.class, SOURCE);
        if (count != null && count > 0) {
            log.info("Handbook already indexed. Skipping default init.");
            return;
        }

        log.info("No handbook found. Indexing default from classpath...");
        try {
            if (defaultPdfResource.exists()) {
                byte[] bytes = defaultPdfResource.getInputStream().readAllBytes();
                
                // Also upload to storage so it can be downloaded
                try {
                    // Create a MultipartFile adapter or just upload bytes?
                    // StorageService accepts MultipartFile. Let's skip storage upload for default for now
                    // OR implementing a simple MockMultipartFile is complex here without spring-test.
                    // We will just index it. The download might fail until first upload.
                    // BETTER: If we want download to work for default, we should upload it.
                    // But StorageService interface takes MultipartFile. 
                    // Let's defer storage upload for the default classpath item to keep it simple.
                    // Users are expected to upload a fresh one if they want to manage it.
                } catch (Exception e) {
                    log.warn("Could not upload default handbook to storage", e);
                }

                reindex(bytes);
            }
        } catch (IOException e) {
            log.error("Failed to index default handbook", e);
        }
    }

    private synchronized void reindex(byte[] pdfBytes) {
        String docHash = sha256Hex(pdfBytes);
        log.info("Re-indexing handbook (docHash={})...", docHash);

        // Clear existing
        jdbcTemplate.update("DELETE FROM handbook_chunks WHERE source=?", SOURCE);
        try {
            jdbcTemplate.update("DELETE FROM vector_store WHERE (metadata->>'source')=?", SOURCE);
        } catch (Exception e) {
            log.warn("Could not delete from vector_store by metadata. Continuing...");
        }

        try {
            List<PageText> pages = extractPages(pdfBytes);
            if (pages.isEmpty()) {
                log.warn("No text extracted from PDF.");
                return;
            }

            List<Chunk> chunks = buildLargeChunks(pages);
            ChatClient chatClient = chatClientBuilder.build();
            List<Document> vectorDocs = new ArrayList<>();

            for (int i = 0; i < chunks.size(); i++) {
                Chunk c = chunks.get(i);
                String raw = c.content();

                // Index Note
                String indexNote = chatClient.prompt()
                        .system(s -> s.text(INDEX_SYSTEM))
                        .user(u -> u.text(String.format(INDEX_USER_TEMPLATE, c.pageStart() + "-" + c.pageEnd(), safeTrunc(raw, 12000))))
                        .call()
                        .content();
                
                if (indexNote == null) indexNote = "";

                String embeddingText = """
                        === INDEX NOTE ===
                        %s

                        === DETAILED CONTENT (verbatim-ish) ===
                        %s
                        """.formatted(indexNote.trim(), raw);

                embeddingText = safeTrunc(embeddingText, MAX_CHUNK_CHARS);
                UUID chunkId = UUID.randomUUID();

                // DB Store
                jdbcTemplate.update(
                        "INSERT INTO handbook_chunks(chunk_id, source, doc_hash, page_start, page_end, raw_content) VALUES (?, ?, ?, ?, ?, ?)",
                        chunkId, SOURCE, docHash, c.pageStart(), c.pageEnd(), raw);

                // Vector Store
                Map<String, Object> meta = new HashMap<>();
                meta.put("source", SOURCE);
                meta.put("docHash", docHash);
                meta.put("chunkId", chunkId.toString());
                meta.put("pageStart", c.pageStart());
                meta.put("pageEnd", c.pageEnd());

                vectorDocs.add(new Document(embeddingText, meta));

                log.info("Prepared chunk {}/{} pages {}-{}", i + 1, chunks.size(), c.pageStart(), c.pageEnd());
            }

            if (!vectorDocs.isEmpty()) {
                vectorStore.add(vectorDocs);
                log.info("Indexed {} chunks.", vectorDocs.size());
            }

        } catch (Exception e) {
            log.error("Indexing failed", e);
            throw new RuntimeException("Indexing failed", e);
        }
    }

    // --- Private Helpers (Copied & Adapted from VectorStoreConfig) ---

    private List<PageText> extractPages(byte[] pdfBytes) throws IOException {
        List<PageText> pages = new ArrayList<>();
        try (PDDocument pd = Loader.loadPDF(pdfBytes)) {
            PDFTextStripper stripper = new PDFTextStripper();
            stripper.setSortByPosition(true);

            int total = pd.getNumberOfPages();
            for (int p = 1; p <= total; p++) {
                stripper.setStartPage(p);
                stripper.setEndPage(p);
                String text = normalize(stripper.getText(pd));
                if (text != null && !text.isBlank()) {
                    text = protectTables(text);
                    pages.add(new PageText(p, text));
                }
            }
        }
        return pages;
    }

    private String normalize(String s) {
        if (s == null) return "";
        String out = s.replace("\r", "");
        out = out.replaceAll("-\\n", "");
        out = out.replaceAll("\\n{3,}", "\n\n");
        out = out.replaceAll("[ \\t]+\\n", "\n");
        return out.trim();
    }

    private String protectTables(String pageText) {
        String[] lines = pageText.split("\\n");
        StringBuilder out = new StringBuilder();
        boolean inTable = false;
        StringBuilder tableBuf = new StringBuilder();

        for (String line : lines) {
            if (looksLikeTableRow(line)) {
                if (!inTable) {
                    inTable = true;
                    tableBuf.setLength(0);
                }
                tableBuf.append(line).append("\n");
            } else {
                if (inTable) {
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
        return !l.isBlank() && (PIPE_TABLE.matcher(l).matches() || DASH_ROW.matcher(l).matches() || MULTISPACE_COLS.matcher(l).matches());
    }

    private List<Chunk> buildLargeChunks(List<PageText> pages) {
        List<Chunk> chunks = new ArrayList<>();
        int i = 0;
        while (i < pages.size()) {
            int startPage = pages.get(i).page();
            int endPage = startPage;
            StringBuilder buf = new StringBuilder();
            buf.append("=== PAGE ").append(startPage).append(" ===\n").append(pages.get(i).text()).append("\n\n");

            int j = i + 1;
            while (j < pages.size()) {
                String next = "\n=== PAGE " + pages.get(j).page() + " ===\n" + pages.get(j).text() + "\n\n";
                if (buf.length() + next.length() > TARGET_CHUNK_CHARS) break;
                buf.append(next);
                endPage = pages.get(j).page();
                j++;
            }
            chunks.add(new Chunk(startPage, endPage, buf.toString().trim()));
            int nextIndex = j - OVERLAP_PAGES;
            i = (nextIndex <= i) ? i + 1 : nextIndex;
        }
        return chunks;
    }

    private static String safeTrunc(String s, int maxChars) {
        if (s == null) return "";
        s = s.trim();
        return s.length() <= maxChars ? s : s.substring(0, maxChars) + "\n\n[TRUNCATED]";
    }

    private static String sha256Hex(byte[] bytes) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(bytes));
        } catch (Exception e) {
            return "unknown";
        }
    }

    private record PageText(int page, String text) {}
    private record Chunk(int pageStart, int pageEnd, String content) {}
}
