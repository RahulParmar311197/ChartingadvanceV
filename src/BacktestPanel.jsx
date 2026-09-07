import { useEffect, useMemo, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { runBacktestRequest } from "./backtest.js";

function metric(value, digits = 2) { return Number.isFinite(Number(value)) ? Number(value).toFixed(digits) : "—"; }
function pct(value) { return Number.isFinite(Number(value)) ? `${(Number(value) * 100).toFixed(2)}%` : "—"; }

export default function BacktestPanel({ symbol, interval, apiUrl, candles, onClose }) {
  const [initialCash, setInitialCash] = useState("100000");
  const [feeRate, setFeeRate] = useState("0.001");
  const [slippageBps, setSlippageBps] = useState("0");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true); setError("");
    try {
      const payload = await runBacktestRequest(apiUrl, { strategy: "buy-and-hold", interval, candles, initialCash: Number(initialCash), feeRate: Number(feeRate), slippageBps: Number(slippageBps) });
      setResult(payload);
    } catch (err) { setError(err?.message || "Unable to run backtest"); }
    finally { setLoading(false); }
  };

  useEffect(() => { if (apiUrl && candles?.length) run(); }, [apiUrl, symbol.symbol, interval]);
  const metrics = result?.metrics ?? result?.result?.metrics;
  const curve = result?.equityCurve ?? result?.result?.equityCurve ?? [];
  const maxEquity = useMemo(() => curve.length ? Math.max(...curve) : 0, [curve]);
  const minEquity = useMemo(() => curve.length ? Math.min(...curve) : 0, [curve]);

  return <section className="backtest-panel">
    <div className="backtest-header"><div><strong>Strategy Tester</strong><small>{symbol.symbol} · {interval} · deterministic candle simulation</small></div><button className="icon-btn" onClick={onClose}><X size={16}/></button></div>
    <div className="backtest-controls">
      <label>Strategy<select value="buy-and-hold" disabled><option value="buy-and-hold">Buy &amp; Hold</option></select></label>
      <label>Initial cash<input type="number" min="0" step="any" value={initialCash} onChange={(e) => setInitialCash(e.target.value)}/></label>
      <label>Fee rate<input type="number" min="0" step="0.0001" value={feeRate} onChange={(e) => setFeeRate(e.target.value)}/></label>
      <label>Slippage (bps)<input type="number" min="0" step="0.1" value={slippageBps} onChange={(e) => setSlippageBps(e.target.value)}/></label>
      <button className="toolbar-btn" disabled={loading || !apiUrl || !candles?.length} onClick={run}><RefreshCw size={14}/> {loading ? "Testing…" : "Run"}</button>
    </div>
    {!apiUrl && <div className="backtest-error">Configure the API URL to run the application-level backtest.</div>}
    {error && <div className="backtest-error">{error}</div>}
    {metrics && <>
      <div className="backtest-grid">
        <div><span>Return</span><strong>{pct(metrics.totalReturn)}</strong></div><div><span>Net profit</span><strong>{metric(metrics.netProfit)}</strong></div><div><span>Max drawdown</span><strong>{pct(metrics.maxDrawdown)}</strong></div><div><span>Trades</span><strong>{metric(metrics.tradeCount, 0)}</strong></div><div><span>Win rate</span><strong>{pct(metrics.winRate)}</strong></div><div><span>Profit factor</span><strong>{metric(metrics.profitFactor)}</strong></div><div><span>Avg trade P&amp;L</span><strong>{metric(metrics.averageTradePnl)}</strong></div><div><span>Sharpe</span><strong>{metric(metrics.sharpeRatio)}</strong></div>
      </div>
      <div className="backtest-curve"><div><strong>Equity curve</strong><span>{curve.length} observations · range {metric(minEquity)}–{metric(maxEquity)}</span></div><div className="equity-bars">{curve.filter((_, index) => index % Math.max(1, Math.ceil(curve.length / 80)) === 0).map((value, index) => <span key={`${index}-${value}`} style={{ height: `${maxEquity > minEquity ? 8 + ((value - minEquity) / (maxEquity - minEquity)) * 72 : 40}%` }} />)}</div></div>
      {result?.benchmark && <div className="backtest-benchmark"><span>Benchmark return</span><strong>{pct(result.benchmark.benchmarkReturn)}</strong><span>Excess return</span><strong>{pct(result.benchmark.excessReturn)}</strong></div>}
    </>}
    <div className="backtest-note">Simulation only. Candle-level execution does not model intrabar fills, queues, margin, borrow, corporate actions, or live broker execution.</div>
  </section>;
}
