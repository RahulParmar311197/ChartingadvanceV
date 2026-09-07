export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'pending' | 'accepted' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';

export interface Order { id: string; accountId: string; symbolId: string; side: OrderSide; type: OrderType; quantity: number; limitPrice?: number; stopPrice?: number; status: OrderStatus; createdAt: number; }
export interface Fill { id: string; orderId: string; quantity: number; price: number; fee: number; timestamp: number; }
export interface Position { accountId: string; symbolId: string; quantity: number; averagePrice: number; realizedPnl: number; unrealizedPnl: number; }
export interface PaperAccount { id: string; currency: string; cash: number; buyingPower: number; equity: number; }

export interface ExecutionQuote {
  bid: number;
  ask: number;
  last: number;
}

export interface PaperExecution {
  order: Order;
  fill: Fill | null;
  reason?: string;
}

function validPositive(value: number | undefined): value is number {
  return value != null && Number.isFinite(value) && value > 0;
}

export function validatePaperOrder(order: Order): string | null {
  if (!order.id || !order.accountId || !order.symbolId) return 'order identity is required';
  if (!validPositive(order.quantity)) return 'quantity must be positive and finite';
  if (!Number.isFinite(order.createdAt)) return 'createdAt must be finite';
  if (order.type === 'limit' || order.type === 'stop_limit') {
    if (!validPositive(order.limitPrice)) return 'limitPrice must be positive and finite';
  }
  if (order.type === 'stop' || order.type === 'stop_limit') {
    if (!validPositive(order.stopPrice)) return 'stopPrice must be positive and finite';
  }
  return null;
}

export function orderTriggered(order: Order, quote: ExecutionQuote): boolean {
  if (![quote.bid, quote.ask, quote.last].every(Number.isFinite)) return false;
  if (order.type === 'market') return true;
  if (order.type === 'limit') {
    return order.side === 'buy' ? quote.ask <= (order.limitPrice as number) : quote.bid >= (order.limitPrice as number);
  }
  if (order.type === 'stop') {
    return order.side === 'buy' ? quote.ask >= (order.stopPrice as number) : quote.bid <= (order.stopPrice as number);
  }
  const stopReached = order.side === 'buy' ? quote.ask >= (order.stopPrice as number) : quote.bid <= (order.stopPrice as number);
  const limitReached = order.side === 'buy' ? quote.ask <= (order.limitPrice as number) : quote.bid >= (order.limitPrice as number);
  return stopReached && limitReached;
}

export function executionPrice(order: Order, quote: ExecutionQuote): number {
  if (order.type === 'limit' || order.type === 'stop_limit') return order.limitPrice as number;
  return order.side === 'buy' ? quote.ask : quote.bid;
}

export function executePaperOrder(order: Order, quote: ExecutionQuote, timestamp: number, feeRate = 0): PaperExecution {
  const validationError = validatePaperOrder(order);
  if (validationError) return { order: { ...order, status: 'rejected' }, fill: null, reason: validationError };
  if (!Number.isFinite(timestamp) || timestamp < order.createdAt) return { order: { ...order, status: 'rejected' }, fill: null, reason: 'invalid execution timestamp' };
  if (!Number.isFinite(feeRate) || feeRate < 0) return { order: { ...order, status: 'rejected' }, fill: null, reason: 'feeRate must be non-negative and finite' };
  if (!orderTriggered(order, quote)) return { order: { ...order, status: 'accepted' }, fill: null, reason: 'order conditions not met' };
  const price = executionPrice(order, quote);
  const fee = order.quantity * price * feeRate;
  return {
    order: { ...order, status: 'filled' },
    fill: { id: `${order.id}:${timestamp}`, orderId: order.id, quantity: order.quantity, price, fee, timestamp },
  };
}

export function applyPaperFill(position: Position | null, fill: Fill, side: OrderSide): Position {
  if (!Number.isFinite(fill.quantity) || fill.quantity <= 0 || !Number.isFinite(fill.price) || fill.price <= 0) throw new Error('invalid fill');
  const signedFill = side === 'buy' ? fill.quantity : -fill.quantity;
  const current = position ?? { accountId: '', symbolId: '', quantity: 0, averagePrice: 0, realizedPnl: 0, unrealizedPnl: 0 };
  const currentQuantity = current.quantity;
  const nextQuantity = currentQuantity + signedFill;
  let realizedPnl = current.realizedPnl;
  let averagePrice = current.averagePrice;
  if (currentQuantity === 0 || Math.sign(currentQuantity) === Math.sign(signedFill)) {
    const totalAbs = Math.abs(currentQuantity) + Math.abs(signedFill);
    averagePrice = totalAbs === 0 ? 0 : ((Math.abs(currentQuantity) * current.averagePrice) + (Math.abs(signedFill) * fill.price)) / totalAbs;
  } else {
    const closedQuantity = Math.min(Math.abs(currentQuantity), Math.abs(signedFill));
    realizedPnl += (side === 'sell' ? 1 : -1) * closedQuantity * (fill.price - current.averagePrice);
    averagePrice = nextQuantity === 0 ? 0 : (Math.sign(nextQuantity) === Math.sign(currentQuantity) ? current.averagePrice : fill.price);
  }
  return { ...current, quantity: nextQuantity, averagePrice, realizedPnl };
}
