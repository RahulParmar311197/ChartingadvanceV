import {
  applyFillToPortfolio,
  assessOrderRisk,
  createPaperAccount,
  executePaperOrder,
  markPortfolio,
  transitionOrder,
} from "../../../packages/trading-engine/src/index.ts";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";

const FEE_RATE = 0.001;
const accounts = new Map();
const submittedOrderIds = new Map();
const openOrders = new Map();
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
  if (!openOrders.has(id)) openOrders.set(id, new Map());
  if (!auditEvents.has(id)) auditEvents.set(id, []);
  return portfolio;
}

function validSymbol(symbol) { return typeof symbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(symbol); }
function executionQuote(symbol) {
  if (!validSymbol(symbol)) throw new Error("symbol must use EXCHANGE:TICKER format");
  const quote = generateQuote(symbol);
  return { bid: quote.last, ask: quote.last, last: quote.last };
}
function audit(accountId, action, orderId, timestamp, reason) {
  const events = auditEvents.get(accountId) ?? [];
  const event = { id: `${orderId}:${action}:${timestamp}`, accountId, action, timestamp, orderId, ...(reason ? { reason } : {}) };
  if (!events.some((item) => item.id === event.id)) auditEvents.set(accountId, [...events, event]);
}
function rememberOrder(accountId, order) { openOrders.get(accountId)?.set(order.id, order); }

export function submitPaperOrder(userId, input, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
  const portfolio = accountFor(userId);
  const order = { id: typeof input?.id === "string" && input.id ? input.id : `paper-order:${now}:${Math.random().toString(36).slice(2, 8)}`, accountId: portfolio.account.id, symbolId: input?.symbolId, side: input?.side, type: input?.type ?? "market", quantity: Number(input?.quantity), ...(input?.limitPrice !== undefined ? { limitPrice: Number(input.limitPrice) } : {}), ...(input?.stopPrice !== undefined ? { stopPrice: Number(input.stopPrice) } : {}), status: "pending", createdAt: now };
  const ids = submittedOrderIds.get(portfolio.account.id);
  if (ids.has(order.id)) {
    audit(portfolio.account.id, "order_rejected", order.id, now, "duplicate order id");
    return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk: { allowed: false, reason: "duplicate order id", estimatedNotional: 0 }, simulated: true };
  }
  ids.add(order.id);
  audit(portfolio.account.id, "order_submitted", order.id, now);
  const referenceQuote = executionQuote(order.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, order, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  if (!risk.allowed) {
    audit(portfolio.account.id, "order_rejected", order.id, now, risk.reason);
    return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk, simulated: true };
  }
  const accepted = transitionOrder(order, "submit", now);
  audit(portfolio.account.id, "order_accepted", accepted.id, now);
  const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
  if (!execution.fill) {
    rememberOrder(portfolio.account.id, execution.order);
    return { ...execution, portfolio, risk, simulated: true };
  }
  const nextPortfolio = applyFillToPortfolio(portfolio, execution.fill, accepted.side);
  accounts.set(portfolio.account.id, nextPortfolio);
  audit(portfolio.account.id, "order_filled", accepted.id, now);
  return { ...execution, portfolio: nextPortfolio, risk, simulated: true };
}

export function cancelPaperOrder(userId, orderId, now = Date.now()) {
  const portfolio = accountFor(userId);
  const order = openOrders.get(portfolio.account.id)?.get(orderId);
  if (!order) throw new Error("open paper order not found");
  const cancelled = transitionOrder(order, "cancel", now);
  openOrders.get(portfolio.account.id).delete(orderId);
  audit(portfolio.account.id, "order_cancelled", orderId, now);
  return { order: cancelled, portfolio: getPaperPortfolio(userId, now), simulated: true };
}

export function replacePaperOrder(userId, orderId, request, now = Date.now()) {
  const portfolio = accountFor(userId);
  const order = openOrders.get(portfolio.account.id)?.get(orderId);
  if (!order) throw new Error("open paper order not found");
  const newOrderId = typeof request?.id === "string" && request.id ? request.id : `${orderId}:replace:${now}`;
  const replacement = { ...request, id: newOrderId, symbolId: order.symbolId, side: order.side, type: order.type };
  const ids = submittedOrderIds.get(portfolio.account.id);
  if (ids.has(newOrderId)) throw new Error("duplicate replacement order id");
  const pair = awaitableReplace(order, replacement, now);
  ids.add(newOrderId);
  openOrders.get(portfolio.account.id).delete(orderId);
  rememberOrder(portfolio.account.id, pair.replacement);
  audit(portfolio.account.id, "order_replaced", orderId, now);
  audit(portfolio.account.id, "order_submitted", newOrderId, now);
  audit(portfolio.account.id, "order_accepted", newOrderId, now);
  return { cancelled: pair.cancelled, replacement: pair.replacement, portfolio: getPaperPortfolio(userId, now), simulated: true };
}
function awaitableReplace(order, replacement, now) {
  const quantity = Number(replacement.quantity ?? order.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) throw new Error("replacement quantity must be positive");
  const cancelled = { ...order, status: "cancelled" };
  const next = { ...order, ...replacement, id: replacement.id, quantity, status: "accepted", createdAt: now };
  return { cancelled, replacement: next };
}

export function getPaperPortfolio(userId, now = Date.now()) {
  const portfolio = accountFor(userId);
  const marks = portfolio.positions.map((position) => ({ symbolId: position.symbolId, markPrice: executionQuote(position.symbolId).last }));
  return structuredClone(markPortfolio(portfolio.account, portfolio.positions, marks).account ? { ...portfolio, ...markPortfolio(portfolio.account, portfolio.positions, marks) } : portfolio);
}
export function getPaperAudit(userId, limit = 100) {
  const portfolio = accountFor(userId);
  const bounded = Math.max(1, Math.min(100, Number(limit) || 100));
  return structuredClone((auditEvents.get(portfolio.account.id) ?? []).slice(-bounded));
}
export function resetPaperTradingStore() { accounts.clear(); submittedOrderIds.clear(); openOrders.clear(); auditEvents.clear(); }
