import {
  appendAuditEvent,
  applyFillToPortfolio,
  assessOrderRisk,
  createPaperAccount,
  createTradingAuditEvent,
  executePaperOrder,
  replaceOrder,
  transitionOrder,
} from "../../../packages/trading-engine/src/index.ts";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";

const FEE_RATE = 0.001;
const accounts = new Map();
const submittedOrderIds = new Map();
const orders = new Map();
const auditEvents = new Map();

function accountFor(userId) {
  const safeUserId = typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous";
  const id = `paper:${safeUserId}`;
  let portfolio = accounts.get(id);
  if (!portfolio) {
    portfolio = { account: createPaperAccount(id, "USD", 100_000), positions: [], ledger: [] };
    accounts.set(id, portfolio);
  }
  if (!submittedOrderIds.has(id)) submittedOrderIds.set(id, new Set());
  if (!orders.has(id)) orders.set(id, new Map());
  if (!auditEvents.has(id)) auditEvents.set(id, []);
  return portfolio;
}

function validSymbol(symbol) {
  return typeof symbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(symbol);
}

function executionQuote(symbol) {
  if (!validSymbol(symbol)) throw new Error("symbol must use EXCHANGE:TICKER format");
  const quote = generateQuote(symbol);
  return { bid: quote.last, ask: quote.last, last: quote.last };
}

function recordAudit(portfolio, action, orderId, timestamp, reason) {
  const id = portfolio.account.id;
  const event = createTradingAuditEvent(id, action, orderId, timestamp, reason);
  auditEvents.set(id, appendAuditEvent(auditEvents.get(id), event));
}

function saveOrder(portfolio, order) {
  orders.get(portfolio.account.id).set(order.id, order);
}

export function submitPaperOrder(userId, input, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
  const portfolio = accountFor(userId);
  const order = {
    id: typeof input?.id === "string" && input.id ? input.id : `paper-order:${now}:${Math.random().toString(36).slice(2, 8)}`,
    accountId: portfolio.account.id,
    symbolId: input?.symbolId,
    side: input?.side,
    type: input?.type ?? "market",
    quantity: Number(input?.quantity),
    ...(input?.limitPrice !== undefined ? { limitPrice: Number(input.limitPrice) } : {}),
    ...(input?.stopPrice !== undefined ? { stopPrice: Number(input.stopPrice) } : {}),
    status: "pending",
    createdAt: now,
  };
  const ids = submittedOrderIds.get(portfolio.account.id);
  recordAudit(portfolio, "order_submitted", order.id, now);
  if (ids.has(order.id)) {
    recordAudit(portfolio, "order_rejected", order.id, now, "duplicate order id");
    return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk: { allowed: false, reason: "duplicate order id", estimatedNotional: 0 }, simulated: true };
  }
  ids.add(order.id);
  saveOrder(portfolio, order);

  const referenceQuote = executionQuote(order.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, order, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  if (!risk.allowed) {
    const rejected = { ...order, status: "rejected" };
    saveOrder(portfolio, rejected);
    recordAudit(portfolio, "order_rejected", order.id, now, risk.reason);
    return { order: rejected, fill: null, portfolio, risk, simulated: true };
  }

  const accepted = transitionOrder(order, "submit", now);
  saveOrder(portfolio, accepted);
  recordAudit(portfolio, "order_accepted", accepted.id, now);
  const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
  if (!execution.fill) return { ...execution, portfolio, risk, simulated: true };

  const filled = transitionOrder(accepted, "fill", now);
  saveOrder(portfolio, filled);
  recordAudit(portfolio, "order_filled", filled.id, now);
  const nextPortfolio = applyFillToPortfolio(portfolio, execution.fill, accepted.side);
  accounts.set(portfolio.account.id, nextPortfolio);
  return { ...execution, order: filled, portfolio: nextPortfolio, risk, simulated: true };
}

export function cancelPaperOrder(userId, orderId, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
  if (typeof orderId !== "string" || !orderId) throw new Error("orderId is required");
  const portfolio = accountFor(userId);
  const order = orders.get(portfolio.account.id).get(orderId);
  if (!order) return { order: null, cancelled: false, reason: "order not found", simulated: true };
  const cancelled = transitionOrder(order, "cancel", now);
  saveOrder(portfolio, cancelled);
  recordAudit(portfolio, "order_cancelled", orderId, now);
  return { order: cancelled, cancelled: true, simulated: true };
}

export function replacePaperOrder(userId, orderId, input = {}, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
  if (typeof orderId !== "string" || !orderId) throw new Error("orderId is required");
  const portfolio = accountFor(userId);
  const current = orders.get(portfolio.account.id).get(orderId);
  if (!current) return { order: null, replacement: null, replaced: false, reason: "order not found", simulated: true };
  const newOrderId = typeof input?.id === "string" && input.id ? input.id : `${orderId}:replace:${now}`;
  const ids = submittedOrderIds.get(portfolio.account.id);
  if (ids.has(newOrderId)) return { order: current, replacement: null, replaced: false, reason: "duplicate order id", simulated: true };

  const pair = replaceOrder(current, {
    quantity: input?.quantity !== undefined ? Number(input.quantity) : undefined,
    limitPrice: input?.limitPrice !== undefined ? Number(input.limitPrice) : undefined,
    stopPrice: input?.stopPrice !== undefined ? Number(input.stopPrice) : undefined,
    createdAt: now,
  }, newOrderId);
  const referenceQuote = executionQuote(pair.replacement.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, pair.replacement, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  if (!risk.allowed) return { order: current, replacement: { ...pair.replacement, status: "rejected" }, replaced: false, risk, reason: risk.reason, simulated: true };

  const acceptedReplacement = transitionOrder(pair.replacement, "submit", now);
  saveOrder(portfolio, pair.cancelled);
  recordAudit(portfolio, "order_cancelled", orderId, now, "replaced");
  ids.add(newOrderId);
  saveOrder(portfolio, acceptedReplacement);
  recordAudit(portfolio, "order_replaced", newOrderId, now, `replaced ${orderId}`);
  const execution = executePaperOrder(acceptedReplacement, referenceQuote, now, FEE_RATE);
  if (!execution.fill) return { ...execution, order: pair.cancelled, replacement: acceptedReplacement, replaced: true, risk, simulated: true };

  const filled = transitionOrder(acceptedReplacement, "fill", now);
  saveOrder(portfolio, filled);
  recordAudit(portfolio, "order_filled", filled.id, now);
  const nextPortfolio = applyFillToPortfolio(portfolio, execution.fill, filled.side);
  accounts.set(portfolio.account.id, nextPortfolio);
  return { ...execution, order: pair.cancelled, replacement: filled, replaced: true, risk, simulated: true, portfolio: nextPortfolio };
}

export function getPaperPortfolio(userId) {
  return structuredClone(accountFor(userId));
}

export function getPaperAudit(userId, limit = 100) {
  const portfolio = accountFor(userId);
  const safeLimit = Number.isFinite(Number(limit)) ? Math.min(100, Math.max(1, Number(limit))) : 100;
  return structuredClone(auditEvents.get(portfolio.account.id).slice(-safeLimit));
}

export function resetPaperTradingStore() {
  accounts.clear();
  submittedOrderIds.clear();
  orders.clear();
  auditEvents.clear();
}
