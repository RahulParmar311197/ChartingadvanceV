-- PostgreSQL reference schema. Application repository transactions must treat order/fill/account mutations as one unit.

CREATE TABLE IF NOT EXISTS paper_accounts (
  account_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  currency TEXT NOT NULL,
  cash NUMERIC(30, 10) NOT NULL,
  buying_power NUMERIC(30, 10) NOT NULL,
  equity NUMERIC(30, 10) NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS paper_orders (
  account_id TEXT NOT NULL REFERENCES paper_accounts(account_id),
  order_id TEXT NOT NULL,
  symbol_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop', 'stop_limit')),
  quantity NUMERIC(30, 10) NOT NULL CHECK (quantity > 0),
  limit_price NUMERIC(30, 10),
  stop_price NUMERIC(30, 10),
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'filled', 'cancelled', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  version BIGINT NOT NULL DEFAULT 0,
  replacement_of TEXT,
  PRIMARY KEY (account_id, order_id),
  CONSTRAINT paper_orders_replacement_fk FOREIGN KEY (account_id, replacement_of) REFERENCES paper_orders(account_id, order_id)
);
CREATE INDEX IF NOT EXISTS paper_orders_account_status_idx ON paper_orders(account_id, status, updated_at DESC);

CREATE TABLE IF NOT EXISTS paper_fills (
  fill_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES paper_accounts(account_id),
  order_id TEXT NOT NULL,
  symbol_id TEXT NOT NULL,
  side TEXT NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity NUMERIC(30, 10) NOT NULL CHECK (quantity > 0),
  price NUMERIC(30, 10) NOT NULL CHECK (price >= 0),
  fee NUMERIC(30, 10) NOT NULL DEFAULT 0 CHECK (fee >= 0),
  timestamp TIMESTAMPTZ NOT NULL,
  UNIQUE (account_id, order_id, fill_id)
);
CREATE INDEX IF NOT EXISTS paper_fills_account_time_idx ON paper_fills(account_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS paper_ledger_entries (
  ledger_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES paper_accounts(account_id),
  entry_type TEXT NOT NULL CHECK (entry_type IN ('deposit', 'withdrawal', 'fee', 'fill')),
  amount NUMERIC(30, 10) NOT NULL,
  currency TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  reference_id TEXT
);
CREATE INDEX IF NOT EXISTS paper_ledger_account_time_idx ON paper_ledger_entries(account_id, timestamp DESC);

CREATE TABLE IF NOT EXISTS paper_audit_events (
  event_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES paper_accounts(account_id),
  order_id TEXT,
  action TEXT NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  reason TEXT,
  correlation_id TEXT
);
CREATE INDEX IF NOT EXISTS paper_audit_account_time_idx ON paper_audit_events(account_id, timestamp DESC, event_id);

CREATE TABLE IF NOT EXISTS workspaces (
  workspace_id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  revision BIGINT NOT NULL DEFAULT 0,
  state JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL,
  UNIQUE (workspace_id, owner_id)
);
CREATE INDEX IF NOT EXISTS workspaces_owner_idx ON workspaces(owner_id, updated_at DESC);

-- Required mutation pattern for optimistic concurrency:
-- UPDATE paper_accounts SET ..., version = version + 1, updated_at = $now
-- WHERE account_id = $id AND version = $expected_version;
-- A zero-row update is a version conflict and must abort the transaction.
--
-- Required order mutation pattern:
-- UPDATE paper_orders SET status = $next_status, version = version + 1, updated_at = $now
-- WHERE account_id = $account_id AND order_id = $order_id AND status = $expected_status;
-- A zero-row update is a lifecycle conflict and must abort the transaction.
