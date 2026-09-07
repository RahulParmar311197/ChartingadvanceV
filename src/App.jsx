import { useEffect, useRef, useState } from "react";
import { Bell, BarChart3, ChevronDown, Clock3, Crosshair, Grid2X2, LineChart, Menu, Minus, MoreHorizontal, Pencil, Plus, Search, Settings, Star, Trash2, TrendingUp, Type, UserRound, X, ZoomIn } from "lucide-react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";
import { DeterministicDemoMarketDataProvider } from "../packages/market-domain/src/demo-provider.ts";
import { createMovingAverageOverlay } from "../packages/indicator-engine/src/overlay.ts";
import { fetchQuote, formatQuoteValue } from "./market.js";
import { connectMarketStream } from "./realtime.js";
import { loadWorkspace, normalizeWorkspace, saveWorkspace } from "./workspace.js";

const MARKET_DATA = new DeterministicDemoMarketDataProvider();
const API_URL = import.meta.env.VITE_MARKET_API_URL?.replace(/\/$/, "");
const WS_URL = import.meta.env.VITE_MARKET_WS_URL;
const DEMO_USER_ID = import.meta.env.VITE_DEMO_USER_ID || "anonymous";
const DEFAULT_WATCHLIST = [
  { symbol: "NASDAQ:AAPL", name: "Apple Inc." }, { symbol: "NASDAQ:MSFT", name: "Microsoft" },
  { symbol: "NASDAQ:NVDA", name: "NVIDIA" }, { symbol: "NASDAQ:TSLA", name: "Tesla" },
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin / Tether" }, { symbol: "OANDA:EURUSD", name: "Euro / U.S. Dollar" }
];
const DEFAULT_WORKSPACE = { watchlist: DEFAULT_WATCHLIST.map((item) => item.symbol), activeSymbol: DEFAULT_WATCHLIST[0].symbol, interval: "1D" };
const INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"];

function intervalSeconds(interval) { return { "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400, "1W": 604800, "1M": 2592000 }[interval]; }

async function loadCandles(symbol, interval, from, to) {
  if (API_URL) {
    const params = new URLSearchParams({ symbol, interval, from: String(from), to: String(to) });
    try {
      const response = await fetch(`${API_URL}/v1/market/candles?${params}`);
      if (!response.ok) throw new Error(`Market API returned ${response.status}`);
      return (await response.json()).data ?? [];
    } catch (error) { console.warn("Market API unavailable; using explicitly simulated demo provider.", error); }
  }
  return MARKET_DATA.getHistoricalCandles({ symbol, interval, from, to });
}

function Chart({ symbol, interval, indicators }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const chart = createChart(el, { layout: { background: { color: "#131722" }, textColor: "#9aa4b2" }, grid: { vertLines: { color: "#1e2430" }, horzLines: { color: "#1e2430" } }, rightPriceScale: { borderColor: "#2a2f3a" }, timeScale: { borderColor: "#2a2f3a", timeVisible: true }, crosshair: { mode: 0 }, width: el.clientWidth, height: el.clientHeight });
    const series = chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderVisible: false, wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", scaleMargins: { top: 0.82, bottom: 0 } });
    const overlaySeries = [];
    let disposed = false; const step = intervalSeconds(interval); const to = Math.floor(Date.now() / 1000); const from = to - step * 180;
    loadCandles(symbol, interval, from, to).then((candles) => {
      if (disposed || !candles.length) return;
      series.setData(candles); volume.setData(candles.map((c) => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? "rgba(38,166,154,.45)" : "rgba(239,83,80,.45)" })));
      indicators.filter((indicator) => indicator.enabled).forEach((indicator) => {
        const overlay = createMovingAverageOverlay(candles, indicator.kind, indicator.period);
        const line = chart.addSeries(LineSeries, { lineWidth: 1, title: overlay.label, priceLineVisible: false, lastValueVisible: false });
        line.setData(overlay.points); overlaySeries.push(line);
      });
      chart.timeScale().fitContent();
    });
    const resize = () => chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }); window.addEventListener("resize", resize);
    return () => { disposed = true; window.removeEventListener("resize", resize); overlaySeries.forEach((line) => chart.removeSeries(line)); chart.remove(); };
  }, [symbol, interval, indicators]);
  return <div className="chart-canvas" ref={ref} />;
}

export default function App() {
  const [symbol, setSymbol] = useState(DEFAULT_WATCHLIST[0]);
  const [interval, setIntervalValue] = useState("1D"); const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST); const [quotes, setQuotes] = useState({}); const [streamStatus, setStreamStatus] = useState("disconnected");
  const [indicators, setIndicators] = useState([{ kind: "sma", period: 20, enabled: true }, { kind: "ema", period: 50, enabled: false }]);
  const [workspaceReady, setWorkspaceReady] = useState(!API_URL); const hydrating = useRef(true); const saveTimer = useRef(null);
  const [activeTool, setActiveTool] = useState("crosshair"); const [bottom, setBottom] = useState("Trading Panel");
  const filtered = DEFAULT_WATCHLIST.filter((x) => `${x.symbol} ${x.name}`.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    let cancelled = false;
    if (!API_URL) { hydrating.current = false; return undefined; }
    loadWorkspace(API_URL, DEMO_USER_ID).then((remote) => {
      if (cancelled) return;
      const normalized = normalizeWorkspace(remote, DEFAULT_WORKSPACE);
      const bySymbol = new Map(DEFAULT_WATCHLIST.map((item) => [item.symbol, item]));
      const items = normalized.watchlist.map((value) => bySymbol.get(value) || { symbol: value, name: value.split(":")[1] || value });
      setWatchlist(items.length ? items : DEFAULT_WATCHLIST);
      setSymbol(items.find((item) => item.symbol === normalized.activeSymbol) || items[0] || DEFAULT_WATCHLIST[0]);
      setIntervalValue(normalized.interval);
    }).catch((error) => console.warn("Workspace API unavailable; keeping local workspace.", error)).finally(() => {
      if (!cancelled) { hydrating.current = false; setWorkspaceReady(true); }
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!API_URL || !workspaceReady || hydrating.current) return undefined;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveWorkspace({ watchlist: watchlist.map((item) => item.symbol), activeSymbol: symbol.symbol, interval }, API_URL, DEMO_USER_ID)
        .catch((error) => console.warn("Workspace save failed; local state remains active.", error));
    }, 400);
    return () => clearTimeout(saveTimer.current);
  }, [watchlist, symbol, interval, workspaceReady]);

  useEffect(() => {
    let cancelled = false;
    Promise.all(watchlist.map(async (item) => { try { const q = API_URL ? await fetchQuote(item.symbol) : await MARKET_DATA.getQuote(item.symbol); return [item.symbol, q]; } catch { return [item.symbol, null]; } }))
      .then((entries) => { if (!cancelled) setQuotes((current) => ({ ...current, ...Object.fromEntries(entries.filter(([, q]) => q)) })); });
    return () => { cancelled = true; };
  }, [watchlist]);

  useEffect(() => {
    if (!WS_URL) { setStreamStatus("disconnected"); return undefined; }
    return connectMarketStream({ url: WS_URL, symbols: watchlist.map((x) => x.symbol), onStatus: setStreamStatus, onEvent: (event) => { if (event.type === "quote") setQuotes((current) => ({ ...current, [event.quote.symbol]: event.quote })); } });
  }, [watchlist]);

  const currentQuote = quotes[symbol.symbol];
  const last = currentQuote?.last ?? 0; const changePercent = currentQuote?.changePercent ?? 0;
  const statusText = WS_URL ? `Realtime ${streamStatus}` : API_URL ? "API / demo fallback" : "Demo data";
  const toggleIndicator = (kind) => setIndicators((current) => current.map((item) => item.kind === kind ? { ...item, enabled: !item.enabled } : item));

  return <div className="app">
    <header className="topbar"><div className="brand"><div className="brand-mark">TV</div><span>TradingView</span></div>
      <button className="symbol-button" onClick={() => setSearchOpen(true)}><span className="ticker">{symbol.symbol.split(":")[1]}</span><span className="exchange">{symbol.symbol.split(":")[0]}</span><ChevronDown size={15}/></button>
      <button className="icon-btn"><Clock3 size={17}/></button><button className="interval-btn">{interval}<ChevronDown size={13}/></button>
      <div className="indicator-control"><button className="toolbar-btn"><BarChart3 size={16}/> Indicators</button><div className="indicator-menu"><button onClick={() => toggleIndicator("sma")}>SMA 20 <span>{indicators[0].enabled ? "✓" : ""}</span></button><button onClick={() => toggleIndicator("ema")}>EMA 50 <span>{indicators[1].enabled ? "✓" : ""}</span></button></div></div>
      <button className="toolbar-btn"><Bell size={16}/> Alert</button><button className="icon-btn"><Settings size={17}/></button><div className="top-spacer"/><button className="top-btn"><Grid2X2 size={16}/> Layout</button><button className="top-btn"><UserRound size={16}/> Sign in</button><button className="blue-btn">Get started</button><button className="icon-btn"><Menu size={18}/></button>
    </header>
    <main className="workspace"><aside className="left-toolbar">{[["crosshair",Crosshair],["line",Minus],["trend",TrendingUp],["text",Type],["zoom",ZoomIn]].map(([id,Icon])=><button key={id} className={activeTool===id?"tool active":"tool"} onClick={()=>setActiveTool(id)}><Icon size={18}/></button>)}<div className="tool-divider"/><button className="tool"><Pencil size={17}/></button><button className="tool"><Trash2 size={17}/></button></aside>
      <section className="chart-area"><div className="chart-header"><div><strong>{symbol.symbol}</strong><span className="muted"> · {interval}</span><span className="status-dot"/><span className="muted">{statusText}</span></div><div className="ohlc"><span>Last {formatQuoteValue(last)}</span><span>Δ {currentQuote ? formatQuoteValue(currentQuote.change) : "—"}</span><span>Bid/ask not provided</span><span className={changePercent>=0?"positive":"negative"}>{changePercent>=0?"+":""}{changePercent.toFixed(2)}%</span></div></div>
        <div className="mini-toolbar">{INTERVALS.map(x=><button key={x} className={interval===x?"time active":"time"} onClick={()=>setIntervalValue(x)}>{x}</button>)}<span className="separator"/><button className="time"><LineChart size={15}/></button><button className="time"><Settings size={15}/></button></div><Chart symbol={symbol.symbol} interval={interval} indicators={indicators}/><div className="chart-footer"><button className="time">Auto</button><button className="time">%</button><div className="footer-spacer"/><button className="time"><Plus size={14}/> Add alert</button><button className="time"><MoreHorizontal size={15}/></button></div>
      </section>
      <aside className="right-panel"><div className="panel-tabs"><strong>Watchlist</strong><button className="icon-btn"><Plus size={16}/></button></div><div className="watch-head"><span>Symbol</span><span>Last</span><span>Chg%</span></div><div className="watchlist">{watchlist.map((item)=>{const q=quotes[item.symbol]; const value=q?.last; const change=q?.changePercent ?? 0; return <button key={item.symbol} className={item.symbol===symbol.symbol?"watch-row selected":"watch-row"} onClick={()=>setSymbol(item)}><div className="watch-name"><Star size={12}/><div><strong>{item.symbol.split(":")[1]}</strong><small>{item.symbol.split(":")[0]}</small></div></div><span>{formatQuoteValue(value)}</span><span className={change>=0?"positive":"negative"}>{q ? `${change>=0?"+":""}${change.toFixed(2)}%` : "—"}</span><span className="remove" onClick={(e)=>{e.stopPropagation();setWatchlist((w)=>w.filter((x)=>x.symbol!==item.symbol));}}><X size={12}/></span></button>})}</div>
        <div className="news"><div className="panel-tabs"><strong>News</strong><button className="text-btn">All</button></div>{["Markets open higher as tech leads gains","AI infrastructure stocks remain in focus","Dollar index retreats from recent highs"].map((n,i)=><article key={i}><small>Demo · Market News</small><p>{n}</p></article>)}</div></aside>
    </main>
    <footer className="bottom-bar">{["Stock Screener","Pine Editor","Strategy Tester","Replay Trading","Paper Trading","Trading Panel"].map((x)=><button key={x} className={bottom===x?"bottom-tab active":"bottom-tab"} onClick={()=>setBottom(x)}>{x}</button>)}<div className="footer-spacer"/><span className="connection"><span className="status-dot"/> {WS_URL ? `Market stream: ${streamStatus}` : "Demo data connection"}</span></footer>
    {searchOpen&&<div className="modal-backdrop" onClick={()=>setSearchOpen(false)}><div className="search-modal" onClick={(e)=>e.stopPropagation()}><div className="search-input"><Search size={18}/><input autoFocus placeholder="Search symbol, company or crypto" value={query} onChange={(e)=>setQuery(e.target.value)}/><kbd>Esc</kbd></div>{filtered.map((item)=>{const q=quotes[item.symbol]; return <button className="search-result" key={item.symbol} onClick={()=>{setSymbol(item);setSearchOpen(false);setQuery("")}}><div><strong>{item.symbol}</strong><small>{item.name}</small></div><span className={q?.changePercent>=0?"positive":"negative"}>{q?formatQuoteValue(q.last):"—"} · {q?`${q.changePercent.toFixed(2)}%`:"—"}</span></button>})}</div></div>}
  </div>;
}
