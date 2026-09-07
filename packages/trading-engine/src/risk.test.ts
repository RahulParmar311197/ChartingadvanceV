import { describe, expect, it } from 'vitest';
import { checkPaperRisk, type RiskLimits } from './risk';
import type { Order, PaperAccount, Position } from './trading';

const account: PaperAccount = { id: 'paper-1', currency: 'USD', cash: 1000, buyingPower: 1000, equity: 1000 };
const order: Order = { id: 'o1', accountId: 'paper-1', symbolId: 'NASDAQ:AAPL', side: 'buy', type: 'limit', quantity: 5, limitPrice: 100, status: 'pending', createdAt: 1 };
const limits: RiskLimits = { maxOrderNotional: 600, maxPositionQuantity: 10, allowShorts: false };

describe('paper risk', () => {
  it('accepts an order within limits', () => expect(checkPaperRisk(order, account, [], limits)).toEqual({ allowed: true }));
  it('rejects excessive notional', () => expect(checkPaperRisk({ ...order, quantity: 7 }, account, [], limits).allowed).toBe(false));
  it('rejects shorting when disabled', () => {
    const position: Position = { accountId: 'paper-1', symbolId: 'NASDAQ:AAPL', quantity: 2, averagePrice: 100, realizedPnl: 0, unrealizedPnl: 0 };
    expect(checkPaperRisk({ ...order, side: 'sell', quantity: 3 }, account, [position], limits)).toEqual({ allowed: false, reason: 'short positions are disabled' });
  });
  it('rejects position limit breaches', () => {
    const position: Position = { accountId: 'paper-1', symbolId: 'NASDAQ:AAPL', quantity: 8, averagePrice: 100, realizedPnl: 0, unrealizedPnl: 0 };
    expect(checkPaperRisk({ ...order, quantity: 3 }, account, [position], limits).reason).toBe('position quantity exceeds risk limit');
  });
  it('rejects insufficient buying power', () => expect(checkPaperRisk({ ...order, quantity: 11 }, account, [], { maxOrderNotional: 5000 }).reason).toBe('insufficient buying power'));
});
