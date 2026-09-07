import { applyFillToPortfolio, assessOrderRisk, createPaperAccount, executePaperOrder, markPortfolio, replaceOrder, transitionOrder } from "../../../packages/trading-engine/src/index.ts";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { createPaperRepository } from "./paper-repository.js";

const FEE_RATE = 0.001;
function accountIdFor(userId) { const safeUserId = typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous"; return `paper:${safeUserId}`; }
function validSymbol(symbol) { return typeof symbol === "string" && /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i.test(symbol); }
function executionQuote(symbol) { if (!validSymbol(symbol)) throw new Error("symbol must use EXCHANGE:TICKER format"); const quote = generateQuote(symbol); return { bid: quote.last, ask: quote.last, last: quote.last }; }

export function createPaperTradingService(repository, { transactional = false } = {}) {
  if (!repository) throw new Error("paper repository is required");
  async function accountFor(userId) {
    const id = accountIdFor(userId);
    let portfolio = await repository.getPortfolio(id);
    if (!portfolio) {
      const account = createPaperAccount(id, "USD", 100_000);
      await repository.createAccount(account, typeof userId === "string" && userId.trim() ? userId.trim() : "anonymous");
      portfolio = await repository.savePortfolio({ account, positions: [], ledger: [] }, account.version);
    }
    return portfolio;
  }
  async function audit(accountId, action, orderId, timestamp, reason) { await repository.appendAuditEvent({ id: `${orderId}:${action}:${timestamp}`, accountId, action, timestamp, orderId, ...(reason ? { reason } : {}) }); }
  async function atomic(work) { return repository.runTransaction ? repository.runTransaction(work) : work(repository); }

  const service = {
    async submitPaperOrder(userId, input, now = Date.now()) {
      if (!transactional && repository.runTransaction) return atomic((tx) => createPaperTradingService(tx, { transactional: true }).submitPaperOrder(userId, input, now));
      if (!Number.isFinite(now)) throw new Error("invalid execution timestamp");
      const portfolio = await accountFor(userId);
      const order = { id: typeof input?.id === "string" && input.id ? input.id : `paper-order:${now}:${(await repository.listOrders(portfolio.account.id)).length + 1}`, accountId: portfolio.account.id, symbolId: input?.symbolId, side: input?.side, type: input?.type ?? "market", quantity: Number(input?.quantity), ...(input?.limitPrice !== undefined ? { limitPrice: Number(input.limitPrice) } : {}), ...(input?.stopPrice !== undefined ? { stopPrice: Number(input.stopPrice) } : {}), status: "pending", createdAt: now };
      if (await repository.getOrder(portfolio.account.id, order.id)) { await audit(portfolio.account.id, "order_rejected", order.id, now, "duplicate order id"); return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk: { allowed: false, reason: "duplicate order id", estimatedNotional: 0 }, simulated: true }; }
      await repository.insertOrder(order); await audit(portfolio.account.id, "order_submitted", order.id, now);
      const referenceQuote = executionQuote(order.symbolId); const risk = assessOrderRisk(portfolio.account, portfolio.positions, order, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
      if (!risk.allowed) { const rejected = transitionOrder(order, "reject", now); await repository.transitionOrder(portfolio.account.id, order.id, "pending", rejected); await audit(portfolio.account.id, "order_rejected", order.id, now, risk.reason); return { order: rejected, fill: null, portfolio, risk, simulated: true }; }
      const accepted = transitionOrder(order, "submit", now); await repository.transitionOrder(portfolio.account.id, order.id, "pending", accepted); await audit(portfolio.account.id, "order_accepted", accepted.id, now);
      const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
      if (!execution.fill) { const storedOrder = await repository.transitionOrder(portfolio.account.id, accepted.id, "accepted", execution.order); return { ...execution, order: storedOrder, portfolio, risk, simulated: true }; }
      const filled = transitionOrder(accepted, "fill", now); await repository.transitionOrder(portfolio.account.id, accepted.id, "accepted", filled);
      const storedFill = await repository.insertFill({ ...execution.fill, accountId: portfolio.account.id }); const savedPortfolio = await repository.savePortfolio(applyFillToPortfolio(portfolio, storedFill, accepted.side), portfolio.account.version); await audit(portfolio.account.id, "order_filled", accepted.id, now);
      return { ...execution, order: filled, fill: storedFill, portfolio: savedPortfolio, risk, simulated: true };
    },
    async cancelPaperOrder(userId, orderId, now = Date.now()) {
      if (!transactional && repository.runTransaction) return atomic((tx) => createPaperTradingService(tx, { transactional: true }).cancelPaperOrder(userId, orderId, now));
      if (!Number.isFinite(now)) throw new Error("invalid cancellation timestamp");
      const portfolio = await accountFor(userId); const order = await repository.getOrder(portfolio.account.id, orderId); if (!order) throw new Error("open paper order not found");
      const stored = await repository.transitionOrder(portfolio.account.id, orderId, "accepted", transitionOrder(order, "cancel", now)); await audit(portfolio.account.id, "order_cancelled", orderId, now);
      return { cancelled: true, order: stored, portfolio: await service.getPaperPortfolio(userId), simulated: true };
    },
    async replacePaperOrder(userId, orderId, request = {}, now = Date.now()) {
      if (!transactional && repository.runTransaction) return atomic((tx) => createPaperTradingService(tx, { transactional: true }).replacePaperOrder(userId, orderId, request, now));
      if (!Number.isFinite(now)) throw new Error("invalid replacement timestamp");
      const portfolio = await accountFor(userId); const order = await repository.getOrder(portfolio.account.id, orderId); if (!order) throw new Error("open paper order not found");
      const newOrderId = typeof request?.id === "string" && request.id ? request.id : `${orderId}:replace:${now}`; if (await repository.getOrder(portfolio.account.id, newOrderId)) throw new Error("duplicate replacement order id");
      const pair = replaceOrder(order, { quantity: request.quantity === undefined ? undefined : Number(request.quantity), limitPrice: request.limitPrice === undefined ? undefined : Number(request.limitPrice), stopPrice: request.stopPrice === undefined ? undefined : Number(request.stopPrice), createdAt: now }, newOrderId);
      const cancelled = await repository.transitionOrder(portfolio.account.id, orderId, "accepted", pair.cancelled); await repository.insertOrder(pair.replacement);
      const referenceQuote = executionQuote(pair.replacement.symbolId); const risk = assessOrderRisk(portfolio.account, portfolio.positions, pair.replacement, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
      await audit(portfolio.account.id, "order_cancelled", orderId, now, "replaced"); await audit(portfolio.account.id, "order_replaced", orderId, now); await audit(portfolio.account.id, "order_submitted", newOrderId, now);
      if (!risk.allowed) { const rejected = transitionOrder(pair.replacement, "reject", now); const storedRejected = await repository.transitionOrder(portfolio.account.id, newOrderId, "pending", rejected); await audit(portfolio.account.id, "order_rejected", newOrderId, now, risk.reason); return { replaced: true, cancelled, replacement: storedRejected, order: cancelled, portfolio: await service.getPaperPortfolio(userId), risk, simulated: true }; }
      const accepted = transitionOrder(pair.replacement, "submit", now); await repository.transitionOrder(portfolio.account.id, newOrderId, "pending", accepted); await audit(portfolio.account.id, "order_accepted", newOrderId, now);
      const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
      if (!execution.fill) return { replaced: true, cancelled, replacement: await repository.getOrder(portfolio.account.id, newOrderId), order: cancelled, portfolio: await service.getPaperPortfolio(userId), risk, simulated: true };
      const filled = transitionOrder(accepted, "fill", now); await repository.transitionOrder(portfolio.account.id, newOrderId, "accepted", filled); const storedFill = await repository.insertFill({ ...execution.fill, accountId: portfolio.account.id }); await repository.savePortfolio(applyFillToPortfolio(portfolio, storedFill, accepted.side), portfolio.account.version); await audit(portfolio.account.id, "order_filled", newOrderId, now);
      return { replaced: true, cancelled, replacement: filled, order: cancelled, fill: storedFill, portfolio: await service.getPaperPortfolio(userId), risk, simulated: true };
    },
    async getPaperPortfolio(userId) { const portfolio = await accountFor(userId); const marks = portfolio.positions.map((position) => ({ symbolId: position.symbolId, markPrice: executionQuote(position.symbolId).last })); const marked = markPortfolio(portfolio.account, portfolio.positions, marks); return structuredClone({ ...portfolio, account: marked.account, positions: marked.positions }); },
    async getPaperOrders(userId) { return repository.listOrders((await accountFor(userId)).account.id); },
    async getPaperAudit(userId, limit = 100) { return repository.listAuditEvents((await accountFor(userId)).account.id, limit); },
    async resetPaperTradingStore() { if (typeof repository.clear === "function") return repository.clear(); throw new Error("reset is only supported by the in-memory paper repository"); },
  };
  return service;
}

export const demoPaperTrading = createPaperTradingService(createPaperRepository());
export const { submitPaperOrder, cancelPaperOrder, replacePaperOrder, getPaperPortfolio, getPaperOrders, getPaperAudit, resetPaperTradingStore } = demoPaperTrading;
