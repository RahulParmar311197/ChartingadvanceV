import type { Candle } from '../../market-domain/src/index';

export type BacktestInterval = '1m' | '5m' | '15m' | '1H' | '4H' | '1D' | '1W' | '1M';
export interface BacktestOrder { side: 'buy' | 'sell'; quantity: number; type?: 'market' | 'limit'; limitPrice?: number; }
export interface BacktestContext { index: number; candle: Candle; position: number; cash: number; }
export type StrategyStep = (context: BacktestContext) => BacktestOrder | null;
export interface BacktestConfig { initialCash: number; feeRate?: number; slippageBps?: number; allowShort?: boolean; interval?: BacktestInterval; }
export interface BacktestTrade { index: number; time: number; side: 'buy' | 'sell'; quantity: number; price: number; fee: number; realizedPnl: number; }
export interface BacktestMetrics { totalReturn: number; maxDrawdown: number; tradeCount: number; winRate: number; profitFactor: number; netProfit: number; averageTradePnl: number; sharpeRatio: number; }
export interface BacktestResult { initialCash: number; finalCash: number; finalEquity: number; trades: readonly BacktestTrade[]; equityCurve: readonly number[]; metrics: BacktestMetrics; }
export interface BenchmarkComparison { strategyReturn: number; benchmarkReturn: number; excessReturn: number; benchmarkFinalValue: number; }

const PERIODS_PER_YEAR: Record<BacktestInterval, number> = { '1m': 252 * 390, '5m': 252 * 78, '15m': 252 * 26, '1H': 252 * 6.5, '4H': 252 * 1.625, '1D': 252, '1W': 52, '1M': 12 };
export function annualizationPeriodsPerYear(interval: BacktestInterval = '1D'): number { return PERIODS_PER_YEAR[interval]; }

export function validateBacktestCandles(candles: readonly Candle[]): void {
  let previousTime: number | null = null;
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index];
    if (!candle || typeof candle !== 'object') throw new Error(`candle[${index}] must be an object`);
    if (!Number.isFinite(candle.time) || !Number.isInteger(candle.time) || candle.time < 0) throw new Error(`candle[${index}].time must be a non-negative Unix epoch second`);
    if (previousTime != null && candle.time <= previousTime) throw new Error('candle timestamps must be strictly increasing');
    previousTime = candle.time;
    for (const name of ['open', 'high', 'low', 'close'] as const) {
      if (!Number.isFinite(candle[name]) || candle[name] <= 0) throw new Error(`candle[${index}].${name} must be a finite positive number`);
    }
    if (candle.high < Math.max(candle.open, candle.close, candle.low)) throw new Error(`candle[${index}] high must be at least open, close, and low`);
    if (candle.low > Math.min(candle.open, candle.close, candle.high)) throw new Error(`candle[${index}] low must be at most open, close, and high`);
    if (candle.volume != null && (!Number.isFinite(candle.volume) || candle.volume < 0)) throw new Error(`candle[${index}].volume must be a finite non-negative number`);
  }
}
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
function sharpe(values: readonly number[], periodsPerYear: number): number {
  if (values.length < 2) return 0;
  const returns = values.slice(1).map((value, i) => values[i] === 0 ? 0 : value / values[i] - 1);
  const mean = returns.reduce((sum, value) => sum + value, 0) / returns.length;
  const variance = returns.reduce((sum, value) => sum + (value - mean) ** 2, 0) / returns.length;
  return variance > 0 ? mean / Math.sqrt(variance) * Math.sqrt(periodsPerYear) : 0;
}

export function runBacktest(candles: readonly Candle[], strategy: StrategyStep, config: BacktestConfig): BacktestResult {
  validateConfig(config);
  if (!candles.length) throw new Error('candles are required');
  validateBacktestCandles(candles);
  const periodsPerYear = annualizationPeriodsPerYear(config.interval);
  let cash = config.initialCash, position = 0, averageEntry = 0, equity = cash, peak = cash, maxDrawdown = 0;
  const trades: BacktestTrade[] = [], equityCurve: number[] = [];
  const feeRate = config.feeRate ?? 0, slippageBps = config.slippageBps ?? 0;
  for (let index = 0; index < candles.length; index += 1) {
    const candle = candles[index], order = strategy({ index, candle, position, cash });
    if (order) {
      if (!Number.isFinite(order.quantity) || order.quantity <= 0) throw new Error('strategy returned invalid quantity');
      const price = executionPrice(candle, order, slippageBps);
      if (price != null) {
        const signed = order.side === 'buy' ? order.quantity : -order.quantity;
        const notional = order.quantity * price, fee = notional * feeRate;
        const validBuy = order.side === 'buy' && cash >= notional + fee;
        const validSell = order.side === 'sell' && (config.allowShort === true || position >= order.quantity);
        if (validBuy || validSell) {
          const previous = position;
          cash += order.side === 'buy' ? -notional - fee : notional - fee;
          position += signed;
          let realizedPnl = 0;
          if (previous !== 0 && Math.sign(previous) !== Math.sign(signed)) {
            const closed = Math.min(Math.abs(previous), order.quantity);
            realizedPnl = (order.side === 'sell' ? 1 : -1) * closed * (price - averageEntry);
          }
          if (position === 0) averageEntry = 0;
          else if (previous === 0 || Math.sign(previous) === Math.sign(signed)) averageEntry = (Math.abs(previous) * averageEntry + order.quantity * price) / Math.abs(position);
          else if (Math.sign(position) !== Math.sign(previous)) averageEntry = price;
          trades.push({ index, time: candle.time, side: order.side, quantity: order.quantity, price, fee, realizedPnl });
        }
      }
    }
    equity = cash + position * candle.close;
    peak = Math.max(peak, equity);
    maxDrawdown = Math.max(maxDrawdown, peak > 0 ? (peak - equity) / peak : 0);
    equityCurve.push(equity);
  }
  const completedPnls = trades.map(t => t.realizedPnl - t.fee).filter(v => v !== 0);
  const gains = completedPnls.filter(v => v > 0), losses = completedPnls.filter(v => v < 0);
  const netProfit = equity - config.initialCash, grossLoss = Math.abs(losses.reduce((a,b)=>a+b,0)), grossProfit = gains.reduce((a,b)=>a+b,0);
  const metrics: BacktestMetrics = { totalReturn: config.initialCash > 0 ? netProfit / config.initialCash : 0, maxDrawdown, tradeCount: trades.length, winRate: completedPnls.length ? gains.length / completedPnls.length : 0, profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? Infinity : 0, netProfit, averageTradePnl: completedPnls.length ? completedPnls.reduce((a,b)=>a+b,0) / completedPnls.length : 0, sharpeRatio: sharpe(equityCurve, periodsPerYear) };
  return { initialCash: config.initialCash, finalCash: cash, finalEquity: equity, trades, equityCurve, metrics };
}

export function compareToBenchmark(result: BacktestResult, benchmarkCandles: readonly Candle[]): BenchmarkComparison {
  if (!benchmarkCandles.length) throw new Error('benchmark candles are required');
  const first = benchmarkCandles[0].close, last = benchmarkCandles[benchmarkCandles.length - 1].close;
  if (![first, last].every(Number.isFinite) || first <= 0) throw new Error('benchmark candles contain invalid prices');
  const benchmarkReturn = last / first - 1;
  return { strategyReturn: result.metrics.totalReturn, benchmarkReturn, excessReturn: result.metrics.totalReturn - benchmarkReturn, benchmarkFinalValue: result.initialCash * (1 + benchmarkReturn) };
}
