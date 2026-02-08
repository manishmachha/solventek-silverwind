package com.solventek.silverwind.chat;

import java.util.*;
import java.util.stream.Collectors;

import org.springframework.ai.chat.client.ChatClient;
import org.springframework.ai.chat.prompt.Prompt;
import org.springframework.ai.chat.prompt.PromptTemplate;
import org.springframework.ai.document.Document;
import org.springframework.ai.vectorstore.SearchRequest;
import org.springframework.ai.vectorstore.VectorStore;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

/**
 * RAG Service for Policy Intent.
 * Uses hybrid search (vector similarity + keyword) to find relevant handbook chunks.
 * Works identically for local-dev and prod-S3 since it only uses database.
 */
@Service
@Slf4j
public class RagService {

    private final ChatClient chatClient;
    private final VectorStore vectorStore;
    private final JdbcTemplate jdbcTemplate;

    private static final String SOURCE = "handbook";

    // Tune these parameters
    private static final int VECTOR_TOPK = 8;
    private static final int KEYWORD_TOPK = 8;
    private static final int FINAL_CONTEXT_CHUNKS = 4;

    private static final String PROMPT_TEMPLATE = """
            You are a helpful assistant for the Solventek Employee Portal.
            Answer ONLY using the provided handbook context.
            If the answer is not present, say you don't know.

            Rules:
            - Provide the most relevant policy/rule and keep it exact.
            - **Summarize** the answer concisely (3-5 sentences) where possible.
            - Include page references like (Pages 12-13).
            - **STRUCTURED DATA MUST BE A MARKDOWN TABLE:** If the answer involves roles, timelines, or tabular data, you MUST use Markdown pipes (|) and headers.
            - Example Table:
            | Column 1 | Column 2 |
            |----------|----------|
            | Data A   | Data B   |
            - If multiple policies apply, list them as bullets.

            Context:
            {context}

            Question: {question}

            Answer:
            """;

    public RagService(ChatClient.Builder chatClientBuilder, VectorStore vectorStore, JdbcTemplate jdbcTemplate) {
        this.chatClient = chatClientBuilder.defaultSystem("You are a helpful assistant.").build();
        this.vectorStore = vectorStore;
        this.jdbcTemplate = jdbcTemplate;
    }

    public String chat(String question) {
        if (question == null || question.isBlank()) {
            return "Please ask a valid question.";
        }

        // 1) Vector candidates
        List<Document> vectorDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(VECTOR_TOPK)
                        .build());

        // chunkId -> vector rank score (simple decreasing score by rank)
        Map<UUID, Double> vectorScore = new HashMap<>();
        for (int i = 0; i < vectorDocs.size(); i++) {
            UUID chunkId = getChunkId(vectorDocs.get(i));
            if (chunkId == null)
                continue;
            vectorScore.put(chunkId, 1.0 - (i * 0.08)); // 1.0, 0.92, 0.84...
        }

        // 2) Keyword candidates (Postgres full-text)
        List<KeywordHit> keywordHits = keywordSearch(question, KEYWORD_TOPK);

        Map<UUID, Double> keywordScore = new HashMap<>();
        for (int i = 0; i < keywordHits.size(); i++) {
            KeywordHit h = keywordHits.get(i);
            // combine ts_rank + rank position bonus
            keywordScore.put(h.chunkId(), h.rank() + (1.0 - i * 0.08));
        }

        // 3) Merge candidates
        LinkedHashSet<UUID> candidates = new LinkedHashSet<>();
        candidates.addAll(vectorScore.keySet());
        candidates.addAll(keywordScore.keySet());

        if (candidates.isEmpty()) {
            return "I don't know based on the handbook.";
        }

        // 4) Fetch raw chunks for candidates
        Map<UUID, RawChunk> rawChunks = fetchRawChunks(candidates);

        // 5) Rerank (hybrid)
        List<ScoredChunk> scored = candidates.stream()
                .map(id -> {
                    RawChunk rc = rawChunks.get(id);
                    if (rc == null)
                        return null;

                    double v = vectorScore.getOrDefault(id, 0.0);
                    double k = keywordScore.getOrDefault(id, 0.0);

                    // Bonus if both sources agree
                    double bothBonus = (v > 0 && k > 0) ? 0.35 : 0.0;

                    // Bonus if numeric/date/id tokens overlap
                    double literalBonus = literalOverlapBonus(question, rc.rawContent());

                    double finalScore = (0.60 * v) + (0.40 * k) + bothBonus + literalBonus;
                    return new ScoredChunk(id, finalScore, rc);
                })
                .filter(Objects::nonNull)
                .sorted(Comparator.comparingDouble(ScoredChunk::score).reversed())
                .limit(FINAL_CONTEXT_CHUNKS)
                .toList();

        if (scored.isEmpty()) {
            return "I don't know based on the handbook.";
        }

        // 6) Build context using RAW detailed chunks
        String context = scored.stream()
                .map(sc -> {
                    RawChunk rc = sc.raw();
                    return "[Chunk " + sc.chunkId() + " | Pages " + rc.pageStart() + "-" + rc.pageEnd() + "]\n"
                            + rc.rawContent();
                })
                .collect(Collectors.joining("\n\n---\n\n"));

        PromptTemplate promptTemplate = new PromptTemplate(PROMPT_TEMPLATE);
        Prompt prompt = promptTemplate.create(Map.of("context", context, "question", question));

        return chatClient.prompt(prompt).call().content();
    }

    /**
     * Checks if there are any relevant matches in the Vector DB or Keyword search
     * that would justify classifying this as a POLICY intent.
     */
    public boolean hasMatches(String question) {
        if (question == null || question.isBlank()) {
            return false;
        }

        // 1) Vector candidates
        List<Document> vectorDocs = vectorStore.similaritySearch(
                SearchRequest.builder()
                        .query(question)
                        .topK(VECTOR_TOPK)
                        .build());

        // 2) Keyword candidates
        List<KeywordHit> keywordHits = keywordSearch(question, KEYWORD_TOPK);

        return !vectorDocs.isEmpty() || !keywordHits.isEmpty();
    }

    private UUID getChunkId(Document d) {
        Object v = d.getMetadata().get("chunkId");
        if (v == null)
            return null;
        try {
            return UUID.fromString(String.valueOf(v));
        } catch (Exception e) {
            return null;
        }
    }

    private List<KeywordHit> keywordSearch(String question, int topK) {
        // plainto_tsquery is safe for normal user input
        return jdbcTemplate.query("""
                SELECT chunk_id, ts_rank(search_tsv, plainto_tsquery('english', ?)) AS r
                FROM handbook_chunks
                WHERE source = ?
                  AND search_tsv @@ plainto_tsquery('english', ?)
                ORDER BY r DESC
                LIMIT ?
                """,
                (rs, rowNum) -> new KeywordHit(
                        UUID.fromString(rs.getString("chunk_id")),
                        rs.getDouble("r")),
                question, SOURCE, question, topK);
    }

    private Map<UUID, RawChunk> fetchRawChunks(Set<UUID> ids) {
        if (ids == null || ids.isEmpty())
            return Map.of();

        String placeholders = ids.stream().map(x -> "?").collect(Collectors.joining(","));
        List<Object> params = new ArrayList<>(ids);

        String sql = "SELECT chunk_id, page_start, page_end, raw_content " +
                "FROM handbook_chunks " +
                "WHERE chunk_id IN (" + placeholders + ")";

        return jdbcTemplate.query(sql, rs -> {
            Map<UUID, RawChunk> map = new HashMap<>();
            while (rs.next()) {
                UUID id = UUID.fromString(rs.getString("chunk_id"));
                map.put(id, new RawChunk(
                        id,
                        rs.getInt("page_start"),
                        rs.getInt("page_end"),
                        rs.getString("raw_content")));
            }
            return map;
        }, params.toArray());
    }

    /**
     * If question includes numeric/date/id tokens and chunk contains them -> bonus.
     */
    private double literalOverlapBonus(String q, String text) {
        if (q == null || text == null)
            return 0.0;

        List<String> tokens = Arrays.stream(q.split("\\s+"))
                .map(t -> t.replaceAll("[^a-zA-Z0-9\\-_/]", ""))
                .filter(t -> t.length() >= 3)
                .filter(t -> t.matches(".*\\d.*")) // contains digit
                .distinct()
                .toList();

        if (tokens.isEmpty())
            return 0.0;

        int hits = 0;
        String hay = text.toLowerCase();
        for (String t : tokens) {
            if (hay.contains(t.toLowerCase()))
                hits++;
        }

        if (hits == 0)
            return 0.0;
        return Math.min(0.35, hits * 0.12);
    }

    // --- records (no custom accessors needed) ---
    private record KeywordHit(UUID chunkId, double rank) {
    }

    private record RawChunk(UUID chunkId, int pageStart, int pageEnd, String rawContent) {
    }

    private record ScoredChunk(UUID chunkId, double score, RawChunk raw) {
    }
}
