import { describe, expect, it } from 'vitest';
import { applyPaperFill, executePaperOrder, orderTriggered, validatePaperOrder } from './trading';

const base = {
  id: 'o1', accountId: 'a1', symbolId: 'NASDAQ:AAPL', side: 'buy' as const,
  type: 'market' as const, quantity: 10, status: 'pending' as const, createdAt: 1000,
};
const quote = { bid: 99, ask: 100, last: 99.5 };

describe('paper trading primitives', () => {
  it('validates required order fields and prices', () => {
    expect(validatePaperOrder(base)).toBeNull();
    expect(validatePaperOrder({ ...base, quantity: 0 })).toBeTruthy();
    expect(validatePaperOrder({ ...base, type: 'limit', limitPrice: 0 })).toBeTruthy();
    expect(validatePaperOrder({ ...base, type: 'stop', stopPrice: Number.NaN })).toBeTruthy();
  });

  it('triggers market, limit, and stop orders against bid/ask', () => {
    expect(orderTriggered(base, quote)).toBe(true);
    expect(orderTriggered({ ...base, type: 'limit', limitPrice: 100 }, quote)).toBe(true);
    expect(orderTriggered({ ...base, type: 'limit', limitPrice: 99 }, quote)).toBe(false);
    expect(orderTriggered({ ...base, type: 'stop', stopPrice: 100 }, quote)).toBe(true);
  });

  it('fills triggered orders at deterministic paper prices and fees', () => {
    const result = executePaperOrder(base, quote, 1100, 0.001);
    expect(result.order.status).toBe('filled');
    expect(result.fill).toMatchObject({ quantity: 10, price: 100, fee: 1, timestamp: 1100 });
  });

  it('keeps untriggered orders accepted without inventing a fill', () => {
    const result = executePaperOrder({ ...base, type: 'limit', limitPrice: 98 }, quote, 1100);
    expect(result.order.status).toBe('accepted');
    expect(result.fill).toBeNull();
  });

  it('rejects invalid execution inputs', () => {
    expect(executePaperOrder({ ...base, quantity: -1 }, quote, 1100).order.status).toBe('rejected');
    expect(executePaperOrder(base, quote, 900).order.status).toBe('rejected');
  });

  it('applies buys and sells to a position with realized P&L', () => {
    const opened = applyPaperFill(null, { id: 'f1', orderId: 'o1', quantity: 10, price: 100, fee: 0, timestamp: 1000 }, 'buy');
    expect(opened.quantity).toBe(10);
    expect(opened.averagePrice).toBe(100);
    const closed = applyPaperFill(opened, { id: 'f2', orderId: 'o2', quantity: 10, price: 110, fee: 0, timestamp: 2000 }, 'sell');
    expect(closed.quantity).toBe(0);
    expect(closed.averagePrice).toBe(0);
    expect(closed.realizedPnl).toBe(100);
  });
});
