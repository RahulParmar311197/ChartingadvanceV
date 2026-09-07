import { useEffect, useState } from "react";
import { RefreshCw, X } from "lucide-react";
import { createFundamentalFilter, fetchFundamentals, FUNDAMENTAL_FIELDS, OPERATORS } from "./screener.js";

const LABELS = { marketCap: "Market cap", peRatio: "P/E", priceToBook: "P/B", revenueGrowth: "Revenue growth", earningsGrowth: "Earnings growth", profitMargin: "Profit margin", returnOnEquity: "ROE", debtToEquity: "Debt / equity", dividendYield: "Dividend yield" };

function formatMetric(field, value) {
  if (value == null) return "—";
  if (["revenueGrowth", "earningsGrowth", "profitMargin", "returnOnEquity", "dividendYield"].includes(field)) return `${(value * 100).toFixed(1)}%`;
  if (field === "marketCap") return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(value);
  return Number(value).toFixed(2);
}

export default function ScreenerPanel({ apiUrl, onClose }) {
  const [filter, setFilter] = useState(createFundamentalFilter());
  const [rows, setRows] = useState([]);
  const [freshness, setFreshness] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const run = async () => {
    setLoading(true); setError("");
    try { const result = await fetchFundamentals({ apiUrl, filters: [filter], limit: 25 }); setRows(result?.items ?? []); setFreshness(result?.freshness ?? null); }
    catch (err) { setError(err?.message || "Unable to load screener results"); }
    finally { setLoading(false); }
  };
  useEffect(() => { if (apiUrl) run(); }, [apiUrl]);

  const change = (key, value) => setFilter((current) => ({ ...current, [key]: key === "field" || key === "operator" ? value : Number(value) }));
  return <section className="screener-panel">
    <div className="screener-header"><div><strong>Stock Screener</strong><small>Fundamentals · demo provider</small></div><button className="icon-btn" onClick={onClose}><X size={16}/></button></div>
    <div className="screener-filters"><select value={filter.field} onChange={(e) => change("field", e.target.value)}>{FUNDAMENTAL_FIELDS.map((field) => <option key={field} value={field}>{LABELS[field]}</option>)}</select><select value={filter.operator} onChange={(e) => change("operator", e.target.value)}>{OPERATORS.map((operator) => <option key={operator} value={operator}>{operator}</option>)}</select><input type="number" step="any" value={filter.value} onChange={(e) => change("value", e.target.value)}/>{filter.operator === "between" && <input type="number" step="any" value={filter.upperValue} onChange={(e) => change("upperValue", e.target.value)}/>}<button className="toolbar-btn" disabled={loading || !apiUrl} onClick={run}><RefreshCw size={14}/> {loading ? "Running…" : "Run"}</button></div>
    {freshness && <div className={freshness.stale ? "screener-fresh stale" : "screener-fresh"}>{freshness.stale ? "Stale demo data" : "Data current to provider snapshot"}</div>}
    {error && <div className="screener-error">{error}</div>}
    <div className="screener-table"><div className="screener-row screener-head"><span>Symbol</span><span>Score</span><span>{LABELS[filter.field]}</span></div>{rows.map(({ snapshot, score }) => <div className="screener-row" key={snapshot.symbolId}><strong>{snapshot.symbolId}</strong><span>{Math.round(score * 100)}%</span><span>{formatMetric(filter.field, snapshot[filter.field])}</span></div>)}{!loading && !error && !rows.length && <div className="screener-empty">No matches.</div>}</div>
    <div className="screener-note">Simulated fundamentals only. No live-data guarantee.</div>
  </section>;
}
