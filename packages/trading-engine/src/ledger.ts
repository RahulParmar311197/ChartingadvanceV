import type { Fill, Order, OrderSide, PaperAccount, Position } from './trading';
import { applyPaperFill } from './trading';

export type LedgerEntryType = 'deposit' | 'withdrawal' | 'fee' | 'fill';
export interface LedgerEntry { id: string; accountId: string; type: LedgerEntryType; amount: number; currency: string; timestamp: number; referenceId?: string; }
export interface PaperPortfolio { account: PaperAccount; positions: readonly Position[]; ledger: readonly LedgerEntry[]; }
export interface PortfolioMark { symbolId: string; markPrice: number; }
export interface RiskLimits { maxOrderNotional?: number; maxPositionQuantity?: number; allowShort?: boolean; }
export interface RiskDecision { allowed: boolean; reason?: string; estimatedNotional: number; }

function finite(value: number): boolean { return Number.isFinite(value); }

export function createPaperAccount(id: string, currency = 'USD', initialCash = 100_000): PaperAccount {
  if (!id || !currency || !finite(initialCash) || initialCash < 0) throw new Error('invalid paper account');
  return { id, currency, cash: initialCash, buyingPower: initialCash, equity: initialCash };
}

export function assessOrderRisk(account: PaperAccount, positions: readonly Position[], order: Pick<Order, 'accountId' | 'symbolId' | 'side' | 'quantity'>, referencePrice: number, limits: RiskLimits = {}): RiskDecision {
  if (order.accountId !== account.id) return { allowed: false, reason: 'account mismatch', estimatedNotional: 0 };
  if (!finite(referencePrice) || referencePrice <= 0 || !finite(order.quantity) || order.quantity <= 0) return { allowed: false, reason: 'invalid order sizing', estimatedNotional: 0 };
  const estimatedNotional = order.quantity * referencePrice;
  if (limits.maxOrderNotional != null && (!finite(limits.maxOrderNotional) || limits.maxOrderNotional < 0 || estimatedNotional > limits.maxOrderNotional)) return { allowed: false, reason: 'maximum order notional exceeded', estimatedNotional };
  const current = positions.find((position) => position.symbolId === order.symbolId)?.quantity ?? 0;
  const next = current + (order.side === 'buy' ? order.quantity : -order.quantity);
  if (limits.allowShort === false && next < 0) return { allowed: false, reason: 'short positions are disabled', estimatedNotional };
  if (limits.maxPositionQuantity != null && (!finite(limits.maxPositionQuantity) || limits.maxPositionQuantity < 0 || Math.abs(next) > limits.maxPositionQuantity)) return { allowed: false, reason: 'maximum position quantity exceeded', estimatedNotional };
  if (order.side === 'buy' && estimatedNotional > account.buyingPower) return { allowed: false, reason: 'insufficient buying power', estimatedNotional };
  return { allowed: true, estimatedNotional };
}

export function applyFillToPortfolio(portfolio: PaperPortfolio, fill: Fill, side: OrderSide = fill.side ?? 'buy'): PaperPortfolio {
  if (!fill.orderId || !fill.symbolId || !finite(fill.quantity) || fill.quantity <= 0 || !finite(fill.price) || fill.price <= 0 || !finite(fill.fee) || fill.fee < 0) throw new Error('invalid fill');
  if (fill.accountId && fill.accountId !== portfolio.account.id) throw new Error('fill account mismatch');
  if (portfolio.ledger.some((entry) => entry.referenceId === fill.id)) return portfolio;
  const positionIndex = portfolio.positions.findIndex((position) => position.symbolId === fill.symbolId);
  const position = positionIndex >= 0 ? portfolio.positions[positionIndex] : null;
  const nextPosition = applyPaperFill(position, fill, side);
  const cashDelta = side === 'buy' ? -(fill.quantity * fill.price) - fill.fee : (fill.quantity * fill.price) - fill.fee;
  const entry: LedgerEntry = { id: `ledger:${fill.id}`, accountId: portfolio.account.id, type: 'fill', amount: cashDelta, currency: portfolio.account.currency, timestamp: fill.timestamp, referenceId: fill.id };
  const positions = positionIndex >= 0 ? portfolio.positions.map((item, index) => index === positionIndex ? nextPosition : item) : [...portfolio.positions, nextPosition];
  return { account: { ...portfolio.account, cash: portfolio.account.cash + cashDelta, buyingPower: portfolio.account.buyingPower + cashDelta }, positions, ledger: [...portfolio.ledger, entry] };
}

export function markPortfolio(portfolio: PaperPortfolio, marks: readonly PortfolioMark[]): PaperPortfolio {
  const bySymbol = new Map(marks.map((mark) => [mark.symbolId, mark.markPrice]));
  let positionValue = 0;
  const positions = portfolio.positions.map((position) => {
    const mark = bySymbol.get(position.symbolId);
    if (!finite(mark ?? NaN)) return position;
    const unrealizedPnl = position.quantity * (mark as number - position.averagePrice);
    positionValue += position.quantity * (mark as number);
    return { ...position, unrealizedPnl };
  });
  return { ...portfolio, account: { ...portfolio.account, equity: portfolio.account.cash + positionValue }, positions };
}
