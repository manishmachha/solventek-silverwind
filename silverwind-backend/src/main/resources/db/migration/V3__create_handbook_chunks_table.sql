-- V3__create_handbook_chunks_table.sql
-- Table for storing handbook PDF chunks for RAG-based Policy intent

CREATE TABLE IF NOT EXISTS handbook_chunks (
    chunk_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source VARCHAR(255) NOT NULL DEFAULT 'handbook',
    page_start INTEGER NOT NULL DEFAULT 1,
    page_end INTEGER NOT NULL DEFAULT 1,
    raw_content TEXT NOT NULL,
    search_tsv TSVECTOR GENERATED ALWAYS AS (to_tsvector('english', raw_content)) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for source filtering
CREATE INDEX IF NOT EXISTS idx_handbook_chunks_source ON handbook_chunks(source);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_handbook_chunks_search ON handbook_chunks USING GIN(search_tsv);

-- Note: Vector embeddings are stored separately in the 'vector_store' table managed by Spring AI PGVector
-- This table stores the raw text chunks for keyword search (hybrid retrieval)
