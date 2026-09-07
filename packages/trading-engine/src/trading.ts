export type OrderSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderStatus = 'pending' | 'accepted' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';

export interface Order { id: string; accountId: string; symbolId: string; side: OrderSide; type: OrderType; quantity: number; limitPrice?: number; stopPrice?: number; status: OrderStatus; createdAt: number; }
export interface Fill { id: string; orderId: string; quantity: number; price: number; fee: number; timestamp: number; }
export interface Position { accountId: string; symbolId: string; quantity: number; averagePrice: number; realizedPnl: number; unrealizedPnl: number; }
export interface PaperAccount { id: string; currency: string; cash: number; buyingPower: number; equity: number; }
