export class InMemoryPaperRepository {
  constructor() {
    this.accounts = new Map();
    this.orders = new Map();
    this.fills = new Map();
    this.ledger = new Map();
    this.audit = new Map();
  }

  accountKey(accountId) { return accountId; }
  orderKey(accountId, orderId) { return `${accountId}:${orderId}`; }
  fillKey(fillId) { return fillId; }

  getAccount(accountId) { return this.accounts.get(this.accountKey(accountId)) ?? null; }
  createAccount(account) {
    if (this.accounts.has(this.accountKey(account.id))) throw new Error("account already exists");
    this.accounts.set(this.accountKey(account.id), structuredClone(account));
    return structuredClone(account);
  }
  updateAccount(account, expectedVersion) {
    const current = this.getAccount(account.id);
    if (!current) throw new Error("account not found");
    if (current.version !== expectedVersion) throw new Error("account version conflict");
    const next = { ...structuredClone(account), version: expectedVersion + 1 };
    this.accounts.set(this.accountKey(account.id), next);
    return structuredClone(next);
  }

  getOrder(accountId, orderId) { return this.orders.get(this.orderKey(accountId, orderId)) ?? null; }
  insertOrder(order) {
    const key = this.orderKey(order.accountId, order.id);
    if (this.orders.has(key)) throw new Error("duplicate order id");
    this.orders.set(key, structuredClone(order));
    return structuredClone(order);
  }
  transitionOrder(accountId, orderId, expectedStatus, nextOrder) {
    const current = this.getOrder(accountId, orderId);
    if (!current) throw new Error("order not found");
    if (current.status !== expectedStatus) throw new Error(`order status conflict: expected ${expectedStatus}`);
    this.orders.set(this.orderKey(accountId, orderId), structuredClone(nextOrder));
    return structuredClone(nextOrder);
  }

  insertFill(fill) {
    if (this.fills.has(this.fillKey(fill.id))) return structuredClone(this.fills.get(this.fillKey(fill.id)));
    this.fills.set(this.fillKey(fill.id), structuredClone(fill));
    return structuredClone(fill);
  }
  appendLedgerEntry(entry) {
    const entries = this.ledger.get(entry.accountId) ?? [];
    if (entries.some((item) => item.id === entry.id)) return structuredClone(entry);
    this.ledger.set(entry.accountId, [...entries, structuredClone(entry)]);
    return structuredClone(entry);
  }
  appendAuditEvent(event) {
    const events = this.audit.get(event.accountId) ?? [];
    if (events.some((item) => item.id === event.id)) return structuredClone(event);
    this.audit.set(event.accountId, [...events, structuredClone(event)]);
    return structuredClone(event);
  }
  listAuditEvents(accountId, limit = 100, before) {
    const events = this.audit.get(accountId) ?? [];
    const filtered = before == null ? events : events.filter((event) => event.timestamp < before);
    const bounded = Math.max(1, Math.min(100, Number(limit) || 100));
    return structuredClone(filtered.slice(-bounded));
  }

  async runTransaction(work) {
    return work(this);
  }
}

export function createPaperRepository() { return new InMemoryPaperRepository(); }
