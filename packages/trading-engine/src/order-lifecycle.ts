import type { Order, OrderStatus } from './trading';

export type OrderAction = 'submit' | 'accept' | 'reject' | 'fill' | 'cancel' | 'replace';

const terminal: ReadonlySet<OrderStatus> = new Set(['filled', 'cancelled', 'rejected']);

export function transitionOrder(order: Order, action: OrderAction, now: number): Order {
  if (!Number.isFinite(now) || now < order.createdAt) throw new Error('invalid lifecycle timestamp');
  if (terminal.has(order.status)) throw new Error(`order is terminal: ${order.status}`);
  if (action === 'submit') {
    if (order.status !== 'pending') throw new Error('order must be pending to submit');
    return { ...order, status: 'accepted' };
  }
  if (action === 'accept') {
    if (order.status !== 'pending') throw new Error('order must be pending to accept');
    return { ...order, status: 'accepted' };
  }
  if (action === 'reject') return { ...order, status: 'rejected' };
  if (action === 'fill') {
    if (order.status !== 'accepted') throw new Error('order must be accepted to fill');
    return { ...order, status: 'filled' };
  }
  if (action === 'cancel') {
    if (order.status !== 'accepted') throw new Error('only accepted orders can be cancelled');
    return { ...order, status: 'cancelled' };
  }
  throw new Error('replace is handled by replaceOrder');
}

export interface ReplaceRequest { quantity?: number; limitPrice?: number; stopPrice?: number; createdAt: number; }

export function replaceOrder(order: Order, request: ReplaceRequest, newOrderId: string): { cancelled: Order; replacement: Order } {
  if (!newOrderId || !Number.isFinite(request.createdAt) || request.createdAt < order.createdAt) throw new Error('invalid replacement');
  if (order.status !== 'accepted') throw new Error('only accepted orders can be replaced');
  const replacement: Order = {
    ...order,
    id: newOrderId,
    quantity: request.quantity ?? order.quantity,
    ...(request.limitPrice !== undefined ? { limitPrice: request.limitPrice } : {}),
    ...(request.stopPrice !== undefined ? { stopPrice: request.stopPrice } : {}),
    status: 'pending',
    createdAt: request.createdAt,
  };
  if (!Number.isFinite(replacement.quantity) || replacement.quantity <= 0) throw new Error('replacement quantity must be positive');
  return { cancelled: { ...order, status: 'cancelled' }, replacement };
}
