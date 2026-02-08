-- Drop vector_store to allow recreation with new dimensions (3072)
DROP TABLE IF EXISTS vector_store;

-- Truncate handbook_chunks to force re-indexing
TRUNCATE TABLE handbook_chunks;
