import { applyFillToPortfolio, assessOrderRisk, createPaperAccount, executePaperOrder, markPortfolio, replaceOrder, transitionOrder } from "../../../packages/trading-engine/src/index.ts";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { createPaperRepository } from "./paper-repository.js";

const FEE_RATE = 0.001;
const repository = createPaperRepository();

function accountIdFor(userId) {
  const safeUserId = typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous";
  return `paper:${safeUserId}`;
}
function accountFor(userId) {
  const id = accountIdFor(userId);
  let portfolio = repository.getPortfolio(id);
  if (!portfolio) {
    const account = createPaperAccount(id, "USD", 100_000);
    repository.createAccount(account);
    portfolio = { account, positions: [], ledger: [] };
    repository.savePortfolio(portfolio);
  }
  return portfolio;
}
function validSymbol(symbol) { return typeof symbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(symbol); }
function executionQuote(symbol) {
  if (!validSymbol(symbol)) throw new Error("symbol must use EXCHANGE:TICKER format");
  const quote = generateQuote(symbol);
  return { bid: quote.last, ask: quote.last, last: quote.last };
}
function audit(accountId, action, orderId, timestamp, reason) {
  repository.appendAuditEvent({ id: `${orderId}:${action}:${timestamp}`, accountId, action, timestamp, orderId, ...(reason ? { reason } : {}) });
}

export function submitPaperOrder(userId, input, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
  const portfolio = accountFor(userId);
  const order = { id: typeof input?.id === "string" && input.id ? input.id : `paper-order:${now}:${repository.listOrders(portfolio.account.id).length + 1}`, accountId: portfolio.account.id, symbolId: input?.symbolId, side: input?.side, type: input?.type ?? "market", quantity: Number(input?.quantity), ...(input?.limitPrice !== undefined ? { limitPrice: Number(input.limitPrice) } : {}), ...(input?.stopPrice !== undefined ? { stopPrice: Number(input.stopPrice) } : {}), status: "pending", createdAt: now };
  if (repository.getOrder(portfolio.account.id, order.id)) {
    audit(portfolio.account.id, "order_rejected", order.id, now, "duplicate order id");
    return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk: { allowed: false, reason: "duplicate order id", estimatedNotional: 0 }, simulated: true };
  }
  repository.insertOrder(order);
  audit(portfolio.account.id, "order_submitted", order.id, now);
  const referenceQuote = executionQuote(order.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, order, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  if (!risk.allowed) {
    const rejected = transitionOrder(order, "reject", now);
    repository.transitionOrder(portfolio.account.id, order.id, "pending", rejected);
    audit(portfolio.account.id, "order_rejected", order.id, now, risk.reason);
    return { order: rejected, fill: null, portfolio, risk, simulated: true };
  }
  const accepted = transitionOrder(order, "submit", now);
  repository.transitionOrder(portfolio.account.id, order.id, "pending", accepted);
  audit(portfolio.account.id, "order_accepted", accepted.id, now);
  const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
  if (!execution.fill) {
    repository.transitionOrder(portfolio.account.id, accepted.id, "accepted", execution.order);
    return { ...execution, portfolio, risk, simulated: true };
  }
  const filled = transitionOrder(accepted, "fill", now);
  repository.transitionOrder(portfolio.account.id, accepted.id, "accepted", filled);
  const storedFill = repository.insertFill({ ...execution.fill, accountId: portfolio.account.id });
  const nextPortfolio = applyFillToPortfolio(portfolio, storedFill, accepted.side);
  repository.savePortfolio(nextPortfolio);
  audit(portfolio.account.id, "order_filled", accepted.id, now);
  return { ...execution, order: filled, fill: storedFill, portfolio: nextPortfolio, risk, simulated: true };
}

export function cancelPaperOrder(userId, orderId, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid cancellation timestamp");
  const portfolio = accountFor(userId);
  const order = repository.getOrder(portfolio.account.id, orderId);
  if (!order) throw new Error("open paper order not found");
  const cancelledOrder = transitionOrder(order, "cancel", now);
  repository.transitionOrder(portfolio.account.id, orderId, "accepted", cancelledOrder);
  audit(portfolio.account.id, "order_cancelled", orderId, now);
  return { cancelled: true, order: cancelledOrder, portfolio: getPaperPortfolio(userId), simulated: true };
}

export function replacePaperOrder(userId, orderId, request = {}, now = Date.now()) {
  if (!Number.isFinite(now)) throw new Error("invalid replacement timestamp");
  const portfolio = accountFor(userId);
  const order = repository.getOrder(portfolio.account.id, orderId);
  if (!order) throw new Error("open paper order not found");
  const newOrderId = typeof request?.id === "string" && request.id ? request.id : `${orderId}:replace:${now}`;
  if (repository.getOrder(portfolio.account.id, newOrderId)) throw new Error("duplicate replacement order id");
  const pair = replaceOrder(order, { quantity: request.quantity === undefined ? undefined : Number(request.quantity), limitPrice: request.limitPrice === undefined ? undefined : Number(request.limitPrice), stopPrice: request.stopPrice === undefined ? undefined : Number(request.stopPrice), createdAt: now }, newOrderId);
  const cancelled = pair.cancelled;
  repository.transitionOrder(portfolio.account.id, orderId, "accepted", cancelled);
  repository.insertOrder(pair.replacement);
  const referenceQuote = executionQuote(pair.replacement.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, pair.replacement, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  audit(portfolio.account.id, "order_cancelled", orderId, now, "replaced");
  audit(portfolio.account.id, "order_replaced", orderId, now);
  audit(portfolio.account.id, "order_submitted", newOrderId, now);
  if (!risk.allowed) {
    const rejected = transitionOrder(pair.replacement, "reject", now);
    repository.transitionOrder(portfolio.account.id, newOrderId, "pending", rejected);
    audit(portfolio.account.id, "order_rejected", newOrderId, now, risk.reason);
    return { replaced: true, cancelled, replacement: rejected, order: cancelled, portfolio: getPaperPortfolio(userId), risk, simulated: true };
  }
  const accepted = transitionOrder(pair.replacement, "submit", now);
  repository.transitionOrder(portfolio.account.id, newOrderId, "pending", accepted);
  audit(portfolio.account.id, "order_accepted", newOrderId, now);
  const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
  if (!execution.fill) return { replaced: true, cancelled, replacement: accepted, order: cancelled, portfolio: getPaperPortfolio(userId), risk, simulated: true };
  const filled = transitionOrder(accepted, "fill", now);
  repository.transitionOrder(portfolio.account.id, newOrderId, "accepted", filled);
  const storedFill = repository.insertFill({ ...execution.fill, accountId: portfolio.account.id });
  const nextPortfolio = applyFillToPortfolio(portfolio, storedFill, accepted.side);
  repository.savePortfolio(nextPortfolio);
  audit(portfolio.account.id, "order_filled", newOrderId, now);
  return { replaced: true, cancelled, replacement: filled, order: cancelled, fill: storedFill, portfolio: getPaperPortfolio(userId), risk, simulated: true };
}

export function getPaperPortfolio(userId) {
  const portfolio = accountFor(userId);
  const marks = portfolio.positions.map((position) => ({ symbolId: position.symbolId, markPrice: executionQuote(position.symbolId).last }));
  const marked = markPortfolio(portfolio.account, portfolio.positions, marks);
  return structuredClone({ ...portfolio, account: marked.account, positions: marked.positions });
}
export function getPaperOrders(userId) { return repository.listOrders(accountFor(userId).account.id); }
export function getPaperAudit(userId, limit = 100) { return repository.listAuditEvents(accountFor(userId).account.id, limit); }
export function resetPaperTradingStore() { repository.accounts.clear(); repository.portfolios.clear(); repository.orders.clear(); repository.fills.clear(); repository.ledger.clear(); repository.audit.clear(); }
