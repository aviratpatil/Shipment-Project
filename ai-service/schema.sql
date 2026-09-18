-- =============================================================================
-- AI Assistant Module — Vector Store Schema
-- (Note: ingest.py automatically applies this schema if run with Python!)
-- =============================================================================

DO $$
BEGIN
    -- Attempt to enable pgvector extension if installed
    BEGIN
        CREATE EXTENSION IF NOT EXISTS vector;
    EXCEPTION WHEN feature_not_supported OR undefined_file THEN
        RAISE NOTICE 'pgvector extension not installed on system; using native DOUBLE PRECISION[] array fallback.';
    END;
END $$;

-- Vector store table — supports either pgvector vector(1536) or DOUBLE PRECISION[]
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'vector') THEN
        CREATE TABLE IF NOT EXISTS document_chunks (
            id          SERIAL PRIMARY KEY,
            content     TEXT            NOT NULL,
            source      TEXT            NOT NULL,
            embedding   vector(1536),
            created_at  TIMESTAMPTZ     DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS document_chunks_embedding_idx
            ON document_chunks
            USING ivfflat (embedding vector_cosine_ops)
            WITH (lists = 50);
    ELSE
        CREATE TABLE IF NOT EXISTS document_chunks (
            id          SERIAL PRIMARY KEY,
            content     TEXT                NOT NULL,
            source      TEXT                NOT NULL,
            embedding   DOUBLE PRECISION[]  DEFAULT '{}',
            created_at  TIMESTAMPTZ         DEFAULT NOW()
        );
    END IF;
END $$;
