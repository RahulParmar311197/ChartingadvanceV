import type { PaperAccount, Position } from './trading';

export interface PortfolioMark { symbolId: string; markPrice: number; }
export interface PortfolioSnapshot { account: PaperAccount; positions: readonly Position[]; grossExposure: number; netExposure: number; }

export function markPortfolio(account: PaperAccount, positions: readonly Position[], marks: readonly PortfolioMark[]): PortfolioSnapshot {
  const prices = new Map(marks.map((mark) => [mark.symbolId, mark.markPrice]));
  let marketValue = 0;
  let grossExposure = 0;
  const nextPositions = positions.map((position) => {
    const mark = prices.get(position.symbolId);
    if (!Number.isFinite(mark)) return position;
    marketValue += position.quantity * (mark as number);
    grossExposure += Math.abs(position.quantity * (mark as number));
    return { ...position, unrealizedPnl: position.quantity * ((mark as number) - position.averagePrice) };
  });
  return {
    account: { ...account, equity: account.cash + marketValue },
    positions: nextPositions,
    grossExposure,
    netExposure: marketValue,
  };
}
