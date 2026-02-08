-- V4__add_doc_hash_to_handbook_chunks.sql
-- Add doc_hash column for tracking indexed document versions

ALTER TABLE handbook_chunks ADD COLUMN IF NOT EXISTS doc_hash TEXT;

-- Create composite index for source + doc_hash
CREATE INDEX IF NOT EXISTS idx_handbook_chunks_source_hash ON handbook_chunks(source, doc_hash);
