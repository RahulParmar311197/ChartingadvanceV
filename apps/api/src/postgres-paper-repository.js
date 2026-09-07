function number(value) { return Number(value); }
function accountRow(row) {
  if (!row) return null;
  return { id: row.account_id, currency: row.currency, cash: number(row.cash), buyingPower: number(row.buying_power), equity: number(row.equity), version: Number(row.version) };
}
function orderRow(row) {
  if (!row) return null;
  return { id: row.order_id, accountId: row.account_id, symbolId: row.symbol_id, side: row.side, type: row.order_type, quantity: number(row.quantity), ...(row.limit_price == null ? {} : { limitPrice: number(row.limit_price) }), ...(row.stop_price == null ? {} : { stopPrice: number(row.stop_price) }), status: row.status, createdAt: new Date(row.created_at).getTime(), updatedAt: new Date(row.updated_at).getTime(), version: Number(row.version), ...(row.replacement_of ? { replacementOf: row.replacement_of } : {}) };
}
function fillRow(row) { return row ? { id: row.fill_id, accountId: row.account_id, orderId: row.order_id, symbolId: row.symbol_id, side: row.side, quantity: number(row.quantity), price: number(row.price), fee: number(row.fee), timestamp: new Date(row.timestamp).getTime() } : null; }
function ledgerRow(row) { return row ? { id: row.ledger_id, accountId: row.account_id, type: row.entry_type, amount: number(row.amount), currency: row.currency, timestamp: new Date(row.timestamp).getTime(), ...(row.reference_id ? { referenceId: row.reference_id } : {}) } : null; }
function auditRow(row) { return row ? { id: row.event_id, accountId: row.account_id, action: row.action, timestamp: new Date(row.timestamp).getTime(), ...(row.order_id ? { orderId: row.order_id } : {}), ...(row.reason ? { reason: row.reason } : {}), ...(row.correlation_id ? { correlationId: row.correlation_id } : {}) } : null; }

/**
 * PostgreSQL adapter. The pool is injected so the application owns connection
 * lifecycle and tests do not need a database. Every mutating operation can be
 * wrapped in runTransaction() by the application service.
 */
export class PostgresPaperRepository {
  constructor(pool) {
    if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") throw new Error("Postgres pool is required");
    this.pool = pool;
  }

  async getAccount(accountId) {
    const result = await this.pool.query("SELECT account_id,currency,cash,buying_power,equity,version FROM paper_accounts WHERE account_id=$1", [accountId]);
    return accountRow(result.rows[0]);
  }
  async createAccount(account, ownerId = account.id, now = new Date()) {
    await this.pool.query("INSERT INTO paper_accounts(account_id,owner_id,currency,cash,buying_power,equity,version,positions,created_at,updated_at) VALUES($1,$2,$3,$4,$5,$6,0,'[]'::jsonb,$7,$7)", [account.id, ownerId, account.currency, account.cash, account.buyingPower, account.equity, now]);
    return structuredClone({ ...account, version: 0 });
  }
  async updateAccount(account, expectedVersion, now = new Date()) {
    const result = await this.pool.query("UPDATE paper_accounts SET cash=$2,buying_power=$3,equity=$4,version=version+1,updated_at=$5 WHERE account_id=$1 AND version=$6 RETURNING account_id,currency,cash,buying_power,equity,version", [account.id, account.cash, account.buyingPower, account.equity, now, expectedVersion]);
    if (!result.rowCount) throw new Error("account version conflict");
    return accountRow(result.rows[0]);
  }
  async getPortfolio(accountId) {
    const accountResult = await this.pool.query("SELECT account_id,currency,cash,buying_power,equity,version,positions FROM paper_accounts WHERE account_id=$1", [accountId]);
    const account = accountRow(accountResult.rows[0]);
    if (!account) return null;
    const ledgerResult = await this.pool.query("SELECT ledger_id,account_id,entry_type,amount,currency,timestamp,reference_id FROM paper_ledger_entries WHERE account_id=$1 ORDER BY timestamp,ledger_id", [accountId]);
    return { account, positions: structuredClone(accountResult.rows[0].positions ?? []), ledger: ledgerResult.rows.map(ledgerRow) };
  }
  async savePortfolio(portfolio, expectedVersion = portfolio.account.version, now = new Date()) {
    const result = await this.pool.query("UPDATE paper_accounts SET cash=$2,buying_power=$3,equity=$4,positions=$5::jsonb,version=version+1,updated_at=$6 WHERE account_id=$1 AND version=$7 RETURNING account_id,currency,cash,buying_power,equity,version,positions", [portfolio.account.id, portfolio.account.cash, portfolio.account.buyingPower, portfolio.account.equity, JSON.stringify(portfolio.positions), now, expectedVersion]);
    if (!result.rowCount) throw new Error("account version conflict");
    const row = result.rows[0];
    return structuredClone({ ...portfolio, account: accountRow(row), positions: structuredClone(row.positions ?? portfolio.positions) });
  }
  async getOrder(accountId, orderId) {
    const result = await this.pool.query("SELECT account_id,order_id,symbol_id,side,order_type,quantity,limit_price,stop_price,status,created_at,updated_at,version,replacement_of FROM paper_orders WHERE account_id=$1 AND order_id=$2", [accountId, orderId]);
    return orderRow(result.rows[0]);
  }
  async listOrders(accountId) {
    const result = await this.pool.query("SELECT account_id,order_id,symbol_id,side,order_type,quantity,limit_price,stop_price,status,created_at,updated_at,version,replacement_of FROM paper_orders WHERE account_id=$1 ORDER BY created_at,order_id", [accountId]);
    return result.rows.map(orderRow);
  }
  async insertOrder(order, now = new Date()) {
    await this.pool.query("INSERT INTO paper_orders(account_id,order_id,symbol_id,side,order_type,quantity,limit_price,stop_price,status,created_at,updated_at,version,replacement_of) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10,0,$11)", [order.accountId, order.id, order.symbolId, order.side, order.type, order.quantity, order.limitPrice ?? null, order.stopPrice ?? null, order.status, now, order.replacementOf ?? null]);
    return structuredClone(order);
  }
  async transitionOrder(accountId, orderId, expectedStatus, nextOrder, now = new Date()) {
    const result = await this.pool.query("UPDATE paper_orders SET status=$3,quantity=$4,limit_price=$5,stop_price=$6,updated_at=$7,version=version+1 WHERE account_id=$1 AND order_id=$2 AND status=$8 RETURNING account_id,order_id,symbol_id,side,order_type,quantity,limit_price,stop_price,status,created_at,updated_at,version,replacement_of", [accountId, orderId, nextOrder.status, nextOrder.quantity, nextOrder.limitPrice ?? null, nextOrder.stopPrice ?? null, now, expectedStatus]);
    if (!result.rowCount) throw new Error(`order status conflict: expected ${expectedStatus}`);
    return orderRow(result.rows[0]);
  }
  async insertFill(fill) {
    const result = await this.pool.query("INSERT INTO paper_fills(fill_id,account_id,order_id,symbol_id,side,quantity,price,fee,timestamp) VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (fill_id) DO NOTHING RETURNING fill_id,account_id,order_id,symbol_id,side,quantity,price,fee,timestamp", [fill.id, fill.accountId, fill.orderId, fill.symbolId, fill.side, fill.quantity, fill.price, fill.fee, new Date(fill.timestamp)]);
    if (result.rowCount) return fillRow(result.rows[0]);
    const existing = await this.pool.query("SELECT fill_id,account_id,order_id,symbol_id,side,quantity,price,fee,timestamp FROM paper_fills WHERE fill_id=$1", [fill.id]);
    return fillRow(existing.rows[0]);
  }
  async appendLedgerEntry(entry) {
    const result = await this.pool.query("INSERT INTO paper_ledger_entries(ledger_id,account_id,entry_type,amount,currency,timestamp,reference_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (ledger_id) DO NOTHING RETURNING ledger_id,account_id,entry_type,amount,currency,timestamp,reference_id", [entry.id, entry.accountId, entry.type, entry.amount, entry.currency, new Date(entry.timestamp), entry.referenceId ?? null]);
    if (result.rowCount) return ledgerRow(result.rows[0]);
    return structuredClone(entry);
  }
  async appendAuditEvent(event) {
    const result = await this.pool.query("INSERT INTO paper_audit_events(event_id,account_id,order_id,action,timestamp,reason,correlation_id) VALUES($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (event_id) DO NOTHING RETURNING event_id,account_id,order_id,action,timestamp,reason,correlation_id", [event.id, event.accountId, event.orderId ?? null, event.action, new Date(event.timestamp), event.reason ?? null, event.correlationId ?? null]);
    if (result.rowCount) return auditRow(result.rows[0]);
    return structuredClone(event);
  }
  async listAuditEvents(accountId, limit = 100, before) {
    const bounded = Math.max(1, Math.min(100, Number(limit) || 100));
    const result = before == null
      ? await this.pool.query("SELECT event_id,account_id,order_id,action,timestamp,reason,correlation_id FROM paper_audit_events WHERE account_id=$1 ORDER BY timestamp DESC,event_id DESC LIMIT $2", [accountId, bounded])
      : await this.pool.query("SELECT event_id,account_id,order_id,action,timestamp,reason,correlation_id FROM paper_audit_events WHERE account_id=$1 AND timestamp < $2 ORDER BY timestamp DESC,event_id DESC LIMIT $3", [accountId, new Date(before), bounded]);
    return result.rows.reverse().map(auditRow);
  }
  async runTransaction(work) {
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");
      const transactionRepository = new PostgresPaperRepository(client);
      const result = await work(transactionRepository);
      await client.query("COMMIT");
      return result;
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original failure */ }
      throw error;
    } finally { client.release(); }
  }
}

export async function createPostgresPoolFromEnv() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is required for PostgreSQL persistence");
  const { Pool } = await import("pg");
  return new Pool({ connectionString, max: Number(process.env.DB_POOL_MAX ?? 10), application_name: "chartingadvancev-api" });
}
