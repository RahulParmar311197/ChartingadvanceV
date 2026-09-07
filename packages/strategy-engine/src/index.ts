import type { Candle } from '../../market-domain/src/index';

export interface BacktestOrder { side: 'buy' | 'sell'; quantity: number; type?: 'market' | 'limit'; limitPrice?: number; }
export interface BacktestContext { index: number; candle: Candle; position: number; cash: number; }
export type StrategyStep = (context: BacktestContext) => BacktestOrder | null;
export interface BacktestConfig { initialCash: number; feeRate?: number; slippageBps?: number; allowShort?: boolean; }
export interface BacktestTrade { index: number; time: number; side: 'buy' | 'sell'; quantity: number; price: number; fee: number; realizedPnl: number; }
export interface BacktestMetrics { totalReturn: number; maxDrawdown: number; tradeCount: number; winRate: number; profitFactor: number; netProfit: number; averageTradePnl: number; sharpeRatio: number; }
export interface BacktestResult { initialCash: number; finalCash: number; finalEquity: number; trades: readonly BacktestTrade[]; equityCurve: readonly number[]; metrics: BacktestMetrics; }

function validateConfig(config: BacktestConfig): void {
  if (!Number.isFinite(config.initialCash) || config.initialCash < 0) throw new Error('initialCash must be non-negative');
  if (config.feeRate != null && (!Number.isFinite(config.feeRate) || config.feeRate < 0)) throw new Error('feeRate must be non-negative');
  if (config.slippageBps != null && (!Number.isFinite(config.slippageBps) || config.slippageBps < 0)) throw new Error('slippageBps must be non-negative');
}

function executionPrice(candle: Candle, order: BacktestOrder, slippageBps: number): number | null {
  if (![candle.open, candle.high, candle.low, candle.close].every(Number.isFinite)) return null;
  const raw = order.type === 'limit' ? order.limitPrice : candle.open;
  if (!Number.isFinite(raw) || raw! <= 0) return null;
  if (order.type === 'limit' && (order.side === 'buy' ? candle.low > raw! : candle.high < raw!)) return null;
  return raw! * (1 + (order.side === 'buy' ? 1 : -1) * slippageBps / 10_000);
}

function sharpe(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const returns = values.slice(1).map((value, i) => values[i] === 0 ? 0 : value / values[i] - 1);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return variance > 0 ? mean / Math.sqrt(variance) * Math.sqrt(252) : 0;
}

export function runBacktest(candles: readonly Candle[], strategy: StrategyStep, config: BacktestConfig): BacktestResult {
  validateConfig(config);
  if (!candles.length) throw new Error('candles are required');
  let cash = config.initialCash, position = 0, equity = cash, peak = cash, maxDrawdown = 0;
  const trades: BacktestTrade[] = [], equityCurve: number[] = [];
  const feeRate = config.feeRate ?? 0, slippageBps = config.slippageBps ?? 0;
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index], order = strategy({ index, candle, position, cash });
    if (order) {
      if (!Number.isFinite(order.quantity) || order.quantity <= 0) throw new Error('strategy returned invalid quantity');
      const price = executionPrice(candle, order, slippageBps);
      if (price != null) {
        const previousPosition = position, signed = order.side === 'buy' ? order.quantity : -order.quantity;
        const notional = order.quantity * price, fee = notional * feeRate;
        const canBuy = order.side === 'buy' && (config.allowShort !== true || true) && cash >= notional + fee;
        const canSell = order.side === 'sell' && (config.allowShort === true || position >= order.quantity);
        if (canBuy || canSell) {
          cash += order.side === 'buy' ? -notional - fee : notional - fee;
          position += signed;
          const closed = previousPosition !== 0 && Math.sign(previousPosition) !== Math.sign(signed) ? Math.min(Math.abs(previousPosition), order.quantity) : 0;
          const realizedPnl = closed * (order.side === 'sell' ? price - Math.abs(previousPosition ? previousPosition / Math.abs(previousPosition) : 1) * Math.abs(previousPosition === 0 ? 0 : price) : 0);
          trades.push({ index, time: candle.time, side: order.side, quantity: order.quantity, price, fee, realizedPnl: Number.isFinite(realizedPnl) ? realizedPnl : 0 });
        }
      }
    }
    equity = cash + position * candle.close;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? (peak - equity) / peak : 0);
    equityCurve.push(equity);
  }
  const pnls = trades.map(t => t.realizedPnl - t.fee), gains = pnls.filter(v => v > 0), losses = pnls.filter(v => v < 0);
  const netProfit = equity - config.initialCash;
  const metrics: BacktestMetrics = { totalReturn: config.initialCash > 0 ? netProfit / config.initialCash : 0, maxDrawdown, tradeCount: trades.length, winRate: pnls.length ? gains.length / pnls.length : 0, profitFactor: Math.abs(losses.reduce((a,b)=>a+b,0)) > 0 ? gains.reduce((a,b)=>a+b,0) / Math.abs(losses.reduce((a,b)=>a+b,0)) : gains.length ? Infinity : 0, netProfit, averageTradePnl: pnls.length ? pnls.reduce((a,b)=>a+b,0) / pnls.length : 0, sharpeRatio: sharpe(equityCurve) };
  return { initialCash: config.initialCash, finalCash: cash, finalEquity: equity, trades, equityCurve, metrics };
}
