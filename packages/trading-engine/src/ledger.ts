import type { Fill, OrderSide, PaperAccount, Position } from './trading';

export type LedgerEntryType = 'deposit' | 'withdrawal' | 'fee' | 'fill';
export interface LedgerEntry { id: string; accountId: string; type: LedgerEntryType; amount: number; currency: string; timestamp: number; referenceId?: string; }
export interface PaperPortfolio { account: PaperAccount; positions: readonly Position[]; ledger: readonly LedgerEntry[]; }

function finite(value: number): boolean { return Number.isFinite(value); }

export function createPaperAccount(id: string, currency = 'USD', initialCash = 100_000): PaperAccount {
  if (!id || !currency || !finite(initialCash) || initialCash < 0) throw new Error('invalid paper account');
  return { id, currency, cash: initialCash, buyingPower: initialCash, equity: initialCash };
}

export function applyFillToPortfolio(portfolio: PaperPortfolio, fill: Fill, side: OrderSide = fill.side ?? 'buy'): PaperPortfolio {
  if (!fill.orderId || !fill.symbolId || !finite(fill.quantity) || fill.quantity <= 0 || !finite(fill.price) || fill.price <= 0 || !finite(fill.fee) || fill.fee < 0) throw new Error('invalid fill');
  if (fill.accountId && fill.accountId !== portfolio.account.id) throw new Error('fill account mismatch');
  if (portfolio.ledger.some((entry) => entry.referenceId === fill.id)) return portfolio;
  const positionIndex = portfolio.positions.findIndex((position) => position.symbolId === fill.symbolId);
  const position = positionIndex >= 0 ? portfolio.positions[positionIndex] : null;
  const signed = side === 'buy' ? fill.quantity : -fill.quantity;
  const cashDelta = side === 'buy' ? -(fill.quantity * fill.price) - fill.fee : (fill.quantity * fill.price) - fill.fee;
  const nextPosition: Position = position
    ? { ...position, quantity: position.quantity + signed }
    : { accountId: portfolio.account.id, symbolId: fill.symbolId, quantity: signed, averagePrice: fill.price, realizedPnl: 0, unrealizedPnl: 0 };
  const entry: LedgerEntry = { id: `ledger:${fill.id}`, accountId: portfolio.account.id, type: 'fill', amount: cashDelta, currency: portfolio.account.currency, timestamp: fill.timestamp, referenceId: fill.id };
  return {
    account: { ...portfolio.account, cash: portfolio.account.cash + cashDelta, buyingPower: portfolio.account.buyingPower + cashDelta, equity: portfolio.account.equity + cashDelta },
    positions: positionIndex >= 0 ? portfolio.positions.map((p, i) => i === positionIndex ? nextPosition : p) : [...portfolio.positions, nextPosition],
    ledger: [...portfolio.ledger, entry],
  };
}
