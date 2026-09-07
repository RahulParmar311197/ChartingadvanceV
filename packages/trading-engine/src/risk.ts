import type { Order, PaperAccount, Position } from './trading';

export interface RiskLimits { maxOrderNotional?: number; maxPositionQuantity?: number; allowShorts?: boolean; }
export interface RiskCheck { allowed: boolean; reason?: string; }

export function checkPaperRisk(order: Order, account: PaperAccount, positions: readonly Position[], limits: RiskLimits = {}): RiskCheck {
  if (!Number.isFinite(account.cash) || !Number.isFinite(account.buyingPower) || account.cash < 0) return { allowed: false, reason: 'account buying power is invalid' };
  const referencePrice = order.limitPrice ?? order.stopPrice;
  if (referencePrice != null && Number.isFinite(limits.maxOrderNotional ?? NaN) && order.quantity * referencePrice > (limits.maxOrderNotional as number)) return { allowed: false, reason: 'order notional exceeds risk limit' };
  const position = positions.find((item) => item.symbolId === order.symbolId);
  const current = position?.quantity ?? 0;
  const projected = current + (order.side === 'buy' ? order.quantity : -order.quantity);
  if (limits.allowShorts === false && projected < 0) return { allowed: false, reason: 'short positions are disabled' };
  if (limits.maxPositionQuantity != null && Math.abs(projected) > limits.maxPositionQuantity) return { allowed: false, reason: 'position quantity exceeds risk limit' };
  if (order.side === 'buy' && referencePrice != null && order.quantity * referencePrice > account.buyingPower) return { allowed: false, reason: 'insufficient buying power' };
  return { allowed: true };
}
