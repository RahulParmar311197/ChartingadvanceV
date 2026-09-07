-- Durable position snapshot used to rebuild paper portfolios after restart.
ALTER TABLE paper_accounts ADD COLUMN IF NOT EXISTS positions JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS paper_accounts_updated_idx ON paper_accounts(updated_at DESC);
