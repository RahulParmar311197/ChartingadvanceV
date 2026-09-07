export type TradingAuditAction = 'order_submitted' | 'order_accepted' | 'order_rejected' | 'order_filled' | 'order_cancelled' | 'order_replaced';

export interface TradingAuditEvent {
  id: string;
  accountId: string;
  action: TradingAuditAction;
  timestamp: number;
  orderId: string;
  reason?: string;
}

export function createTradingAuditEvent(accountId: string, action: TradingAuditAction, orderId: string, timestamp: number, reason?: string): TradingAuditEvent {
  if (!accountId || !orderId || !Number.isFinite(timestamp)) throw new Error('invalid audit event');
  return { id: `${orderId}:${action}:${timestamp}`, accountId, action, timestamp, ...(reason ? { reason } : {}) };
}

export function appendAuditEvent(events: readonly TradingAuditEvent[], event: TradingAuditEvent): readonly TradingAuditEvent[] {
  if (events.some((item) => item.id === event.id)) return events;
  return [...events, event];
}
