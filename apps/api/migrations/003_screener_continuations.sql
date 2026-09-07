-- Durable screener continuation state. The application token is the only cursor exposed to clients;
-- provider_cursor remains an infrastructure-only value and must never be serialized into API responses/logs.
CREATE TABLE IF NOT EXISTS screener_continuations (
  continuation_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  request_fingerprint TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_cursor TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX IF NOT EXISTS screener_continuations_owner_expiry_idx
  ON screener_continuations(owner_id, expires_at);
CREATE INDEX IF NOT EXISTS screener_continuations_expiry_idx
  ON screener_continuations(expires_at);
