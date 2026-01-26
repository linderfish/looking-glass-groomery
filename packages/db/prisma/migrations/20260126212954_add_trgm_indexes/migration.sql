-- Enable pg_trgm extension for fuzzy text search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add GIN indexes for trigram-based fuzzy search on Client names
CREATE INDEX IF NOT EXISTS idx_client_fname_trgm ON "Client" USING GIN (LOWER("firstName") gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_client_lname_trgm ON "Client" USING GIN (LOWER("lastName") gin_trgm_ops);
