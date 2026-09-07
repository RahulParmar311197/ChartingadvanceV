import {
  applyFillToPortfolio,
  assessOrderRisk,
  createPaperAccount,
  executePaperOrder,
  transitionOrder,
} from "../../../packages/trading-engine/src/index.ts";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";

const FEE_RATE = 0.001;
const accounts = new Map();

function accountFor(userId) {
  const id = `paper:${userId}`;
  let portfolio = accounts.get(id);
  if (!portfolio) {
    portfolio = { account: createPaperAccount(id, "USD", 100_000), positions: [], ledger: [] };
    accounts.set(id, portfolio);
  }
  return portfolio;
}

function executionQuote(symbol) {
  const quote = generateQuote(symbol);
  return { bid: quote.last, ask: quote.last, last: quote.last };
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
  const referenceQuote = executionQuote(order.symbolId);
  const risk = assessOrderRisk(portfolio.account, portfolio.positions, order, referenceQuote.last, { allowShort: false, maxOrderNotional: 50_000, maxPositionQuantity: 10_000 });
  if (!risk.allowed) return { order: { ...order, status: "rejected" }, fill: null, portfolio, risk, simulated: true };

  const accepted = transitionOrder(order, "submit", now);
  const execution = executePaperOrder(accepted, referenceQuote, now, FEE_RATE);
  if (!execution.fill) return { ...execution, portfolio, risk, simulated: true };

  const nextPortfolio = applyFillToPortfolio(portfolio, execution.fill, accepted.side);
  accounts.set(portfolio.account.id, nextPortfolio);
  return { ...execution, portfolio: nextPortfolio, risk, simulated: true };
}

export function getPaperPortfolio(userId) {
  return structuredClone(accountFor(userId));
}

export function resetPaperTradingStore() {
  accounts.clear();
}
