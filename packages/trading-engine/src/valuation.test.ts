import { describe, expect, it } from 'vitest';
import { createPaperAccount, type PaperPortfolio } from './ledger';
import { markPortfolio } from './valuation';

describe('portfolio valuation', () => {
  it('marks long positions to market without changing cash', () => {
    const portfolio: PaperPortfolio = {
      account: { ...createPaperAccount('paper:test', 'USD', 100_000), cash: 90_000, buyingPower: 90_000 },
      positions: [{ symbolId: 'NASDAQ:AAPL', quantity: 10, averagePrice: 1_000, realizedPnl: 0, unrealizedPnl: 0 }],
      ledger: [],
    };

    const marked = markPortfolio(portfolio.account, portfolio.positions, [{ symbolId: 'NASDAQ:AAPL', markPrice: 1_100 }]);
    expect(marked.account.cash).toBe(90_000);
    expect(marked.account.equity).toBe(101_000);
    expect(marked.positions[0].unrealizedPnl).toBe(1_000);
    expect(marked.grossExposure).toBe(11_000);
    expect(marked.netExposure).toBe(11_000);
  });

  it('leaves unmarked positions unchanged', () => {
    const account = createPaperAccount('paper:test');
    const positions = [{ symbolId: 'NASDAQ:AAPL', quantity: 10, averagePrice: 100, realizedPnl: 0, unrealizedPnl: 25 }];
    const marked = markPortfolio(account, positions, []);
    expect(marked.positions).toEqual(positions);
    expect(marked.account.equity).toBe(account.cash);
    expect(marked.grossExposure).toBe(0);
  });
});
