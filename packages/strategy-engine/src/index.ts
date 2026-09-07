import type { Candle } from '../../market-domain/src/index';

export interface BacktestOrder {
  side: 'buy' | 'sell';
  quantity: number;
  type?: 'market' | 'limit';
  limitPrice?: number;
}

export interface BacktestContext {
  index: number;
  candle: Candle;
  position: number;
  cash: number;
}

export type StrategyStep = (context: BacktestContext) => BacktestOrder | null;

export interface BacktestConfig {
  initialCash: number;
  feeRate?: number;
  slippageBps?: number;
}

export interface BacktestTrade {
  index: number;
  time: number;
  side: 'buy' | 'sell';
  quantity: number;
  price: number;
  fee: number;
}

export interface BacktestResult {
  initialCash: number;
  finalCash: number;
  finalEquity: number;
  trades: readonly BacktestTrade[];
  equityCurve: readonly number[];
  totalReturn: number;
  maxDrawdown: number;
}

function validateConfig(config: BacktestConfig): void {
  if (!Number.isFinite(config.initialCash) || config.initialCash < 0) throw new Error('initialCash must be non-negative');
  if (config.feeRate != null && (!Number.isFinite(config.feeRate) || config.feeRate < 0)) throw new Error('feeRate must be non-negative');
  if (config.slippageBps != null && (!Number.isFinite(config.slippageBps) || config.slippageBps < 0)) throw new Error('slippageBps must be non-negative');
}

function executionPrice(candle: Candle, order: BacktestOrder, slippageBps: number): number | null {
  if (![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) return null;
  const raw = order.type === 'limit' ? order.limitPrice : candle.open;
  if (!Number.isFinite(raw) || (order.type === 'limit' && raw! <= 0)) return null;
  if (order.type === 'limit') {
    const touched = order.side === 'buy' ? candle.low <= raw! : candle.high >= raw!;
    if (!touched) return null;
  }
  const factor = 1 + (order.side === 'buy' ? 1 : -1) * slippageBps / 10_000;
  return raw! * factor;
}

export function runBacktest(candles: readonly Candle[], strategy: StrategyStep, config: BacktestConfig): BacktestResult {
  validateConfig(config);
  if (!Array.isArray(candles) || candles.length === 0) throw new Error('candles are required');
  let cash = config.initialCash;
  let position = 0;
  let equity = cash;
  let peak = cash;
  let maxDrawdown = 0;
  const trades: BacktestTrade[] = [];
  const equityCurve: number[] = [];
  const feeRate = config.feeRate ?? 0;
  const slippageBps = config.slippageBps ?? 0;

  candles.forEach((candle, index) => {
    const order = strategy({ index, candle, position, cash });
    if (order) {
      if (!Number.isFinite(order.quantity) || order.quantity <= 0) throw new Error('strategy returned invalid quantity');
      const price = executionPrice(candle, order, slippageBps);
      if (price != null) {
        const signed = order.side === 'buy' ? order.quantity : -order.quantity;
        const notional = order.quantity * price;
        const fee = notional * feeRate;
        if (order.side === 'buy' && cash >= notional + fee) {
          cash -= notional + fee;
          position += order.quantity;
          trades.push({ index, time: candle.time, side: order.side, quantity: order.quantity, price, fee });
        } else if (order.side === 'sell' && position >= order.quantity) {
          cash += notional - fee;
          position -= order.quantity;
          trades.push({ index, time: candle.time, side: order.side, quantity: order.quantity, price, fee });
        }
      }
    }
    equity = cash + position * candle.close;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? (peak - equity) / peak : 0);
    equityCurve.push(equity);
  });

  return { initialCash: config.initialCash, finalCash: cash, finalEquity: equity, trades, equityCurve, totalReturn: config.initialCash > 0 ? (equity - config.initialCash) / config.initialCash : 0, maxDrawdown };
}
