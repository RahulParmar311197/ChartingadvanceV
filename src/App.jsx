import { useEffect, useRef, useState } from "react";
import { Bell, BarChart3, ChevronDown, Clock3, Crosshair, Grid2X2, LineChart, Menu, Minus, MoreHorizontal, Pencil, Plus, Search, Settings, Star, Trash2, TrendingUp, Type, UserRound, X, ZoomIn } from "lucide-react";
import { createChart, CandlestickSeries, HistogramSeries, LineSeries } from "lightweight-charts";
import { DeterministicDemoMarketDataProvider } from "../packages/market-domain/src/demo-provider.ts";
import { createMovingAverageOverlay } from "../packages/indicator-engine/src/overlay.ts";
import { createRsiSeries } from "../packages/indicator-engine/src/oscillator.ts";
import { addDrawing, removeDrawing, updateDrawing } from "../packages/chart-engine/src/drawing-state.ts";
import { clampVisibleBars } from "./chart-interaction.js";
import { advanceDrawingDraft, createDrawingDrag, createDrawingId, drawingPointFromCoordinates, drawingTypeForTool, finishDrawingDrag, hitTestDrawingPoint, shouldCommitDrawing, updateDrawingDrag } from "./drawing-interaction.js";
import { publishChartCrosshair, publishChartRange, subscribeChartCrosshair, subscribeChartRange } from "./chart-pane-sync.js";
import { fetchQuote, formatQuoteValue } from "./market.js";
import { connectMarketStream } from "./realtime.js";
import { loadWorkspace, normalizeWorkspace, saveWorkspace } from "./workspace.js";
import ScreenerPanel from "./ScreenerPanel.jsx";

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

function Chart({ symbol, interval, indicators, visibleBars, drawings, onDrawingsChange, activeTool, selectedDrawingId, onSelectDrawing }) {
  const ref = useRef(null); const chartRef = useRef(null); const drawingDraft = useRef({ points: [] }); const drawingDrag = useRef(null); const drawingSeriesRef = useRef(new Map());
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const chart = createChart(el, { layout: { background: { color: "#131722" }, textColor: "#9aa4b2" }, grid: { vertLines: { color: "#1e2430" }, horzLines: { color: "#1e2430" } }, rightPriceScale: { borderColor: "#2a2f3a" }, timeScale: { borderColor: "#2a2f3a", timeVisible: true }, crosshair: { mode: 0 }, width: el.clientWidth, height: el.clientHeight });
    chartRef.current = chart;
    const handleRange = (range) => { if (range) publishChartRange("primary", range); };
    chart.timeScale().subscribeVisibleLogicalRangeChange(handleRange);
    const series = chart.addSeries(CandlestickSeries, { upColor: "#26a69a", downColor: "#ef5350", borderVisible: false, wickUpColor: "#26a69a", wickDownColor: "#ef5350" });
    const handleCrosshair = (param) => {
      if (!param?.time || !param?.point) { publishChartCrosshair("primary", null); return; }
      const price = series.coordinateToPrice?.(param.point.y);
      publishChartCrosshair("primary", Number.isFinite(price) ? { time: param.time, price } : { time: param.time });
    };
    chart.subscribeCrosshairMove(handleCrosshair);
    const toChartPoint = (event) => { const rect = el.getBoundingClientRect(); return { x: event.clientX - rect.left, y: event.clientY - rect.top }; };
    const handlePointerDown = (event) => {
      if (drawingTypeForTool(activeTool) || event.button !== 0 || drawingDrag.current) return;
      const point = toChartPoint(event);
      const candidates = drawings.filter((drawing) => drawing.visible !== false && !drawing.locked && drawing.points.length > 0);
      for (const drawing of candidates) {
        const pointIndex = hitTestDrawingPoint(chart, series, drawing, point.x, point.y);
        if (pointIndex == null) continue;
        const drag = createDrawingDrag(drawing, pointIndex);
        if (!drag) continue;
        drawingDrag.current = drag;
        onSelectDrawing(drag.drawingId);
        el.setPointerCapture?.(event.pointerId);
        event.preventDefault();
        return;
      }
    };
    const handlePointerMove = (event) => {
      const drag = drawingDrag.current;
      if (!drag) return;
      const point = toChartPoint(event);
      const timePrice = drawingPointFromCoordinates(chart, series, point.x, point.y);
      if (!timePrice) return;
      const updated = updateDrawingDrag(drag, timePrice);
      drawingDrag.current = updated;
      const line = drawingSeriesRef.current.get(updated.drawingId);
      if (line && updated.previewDrawing.points.length >= 2) line.setData(updated.previewDrawing.points);
    };
    const handlePointerUp = (event) => {
      const drag = drawingDrag.current;
      if (!drag) return;
      const point = toChartPoint(event);
      const timePrice = drawingPointFromCoordinates(chart, series, point.x, point.y);
      const finished = timePrice ? finishDrawingDrag(updateDrawingDrag(drag, timePrice)) : finishDrawingDrag(drag);
      drawingDrag.current = null;
      el.releasePointerCapture?.(event.pointerId);
      if (finished) onDrawingsChange((current) => updateDrawing(current, finished.id, { points: finished.points }));
    };
    const handlePointerCancel = () => { drawingDrag.current = null; };
    el.addEventListener("pointerdown", handlePointerDown);
    el.addEventListener("pointermove", handlePointerMove);
    el.addEventListener("pointerup", handlePointerUp);
    el.addEventListener("pointercancel", handlePointerCancel);
    const handleClick = (param) => {
      const type = drawingTypeForTool(activeTool);
      if (!type || !param?.point) return;
      const point = drawingPointFromCoordinates(chart, series, param.point.x, param.point.y);
      if (!point) return;
      const nextDraft = advanceDrawingDraft(drawingDraft.current, point);
      if (!shouldCommitDrawing(nextDraft)) { drawingDraft.current = nextDraft; return; }
      const drawing = { id: createDrawingId(), type, points: nextDraft.points, visible: true, locked: false };
      onDrawingsChange((current) => addDrawing(current, drawing));
      onSelectDrawing(drawing.id);
      drawingDraft.current = { points: [] };
    };
    chart.subscribeClick(handleClick);
    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: "volume" }, priceScaleId: "", scaleMargins: { top: 0.82, bottom: 0 } });
    const overlaySeries = []; const drawingSeries = new Map(); drawingSeriesRef.current = drawingSeries;
    let disposed = false; const step = intervalSeconds(interval); const to = Math.floor(Date.now() / 1000); const from = to - step * 180;
    loadCandles(symbol, interval, from, to).then((candles) => {
      if (disposed || !candles.length) return;
      series.setData(candles); volume.setData(candles.map((c) => ({ time: c.time, value: c.volume ?? 0, color: c.close >= c.open ? "rgba(38,166,154,.45)" : "rgba(239,83,80,.45)" })));
      indicators.filter((indicator) => indicator.enabled).forEach((indicator) => { const overlay = createMovingAverageOverlay(candles, indicator.kind, indicator.period); const line = chart.addSeries(LineSeries, { lineWidth: 1, title: overlay.label, priceLineVisible: false, lastValueVisible: false }); line.setData(overlay.points); overlaySeries.push(line); });
      chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, candles.length - visibleBars), to: candles.length - 1 });
    });
    drawings.filter((drawing) => drawing.visible !== false && drawing.points.length >= 2).forEach((drawing) => {
      const line = chart.addSeries(LineSeries, { lineWidth: 2, title: drawing.type, priceLineVisible: false, lastValueVisible: false });
      line.setData(drawing.points);
      drawingSeries.set(drawing.id, line);
    });
    const handleDrawingClick = (param) => {
      if (drawingTypeForTool(activeTool) || !param?.seriesData) return;
      for (const [id, line] of drawingSeries) if (param.seriesData.has(line)) { onSelectDrawing(id); break; }
    };
    chart.subscribeClick(handleDrawingClick);
    const resize = () => chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }); window.addEventListener("resize", resize);
    return () => { disposed = true; drawingDrag.current = null; drawingSeriesRef.current = new Map(); el.removeEventListener("pointerdown", handlePointerDown); el.removeEventListener("pointermove", handlePointerMove); el.removeEventListener("pointerup", handlePointerUp); el.removeEventListener("pointercancel", handlePointerCancel); chart.timeScale().unsubscribeVisibleLogicalRangeChange(handleRange); chart.unsubscribeCrosshairMove(handleCrosshair); chart.unsubscribeClick(handleClick); chart.unsubscribeClick(handleDrawingClick); chartRef.current = null; window.removeEventListener("resize", resize); overlaySeries.forEach((line) => chart.removeSeries(line)); drawingSeries.forEach((line) => chart.removeSeries(line)); chart.remove(); };
  }, [symbol, interval, indicators, drawings, activeTool, onDrawingsChange, onSelectDrawing]);
  useEffect(() => { for (const [id, line] of drawingSeriesRef.current) line.applyOptions({ lineWidth: id === selectedDrawingId ? 3 : 2 }); }, [selectedDrawingId]);
  useEffect(() => { const chart = chartRef.current; if (!chart) return; const range = chart.timeScale().getVisibleLogicalRange(); if (!range) return; chart.timeScale().setVisibleLogicalRange({ from: range.to - visibleBars + 1, to: range.to }); }, [visibleBars]);
  return <div className="chart-canvas" ref={ref} />;
}

function RsiPane({ symbol, interval, visibleBars }) {
  const ref = useRef(null); const chartRef = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return undefined;
    const chart = createChart(el, { layout: { background: { color: "#131722" }, textColor: "#9aa4b2" }, grid: { vertLines: { color: "#1e2430" }, horzLines: { color: "#1e2430" } }, rightPriceScale: { borderColor: "#2a2f3a", scaleMargins: { top: 0.08, bottom: 0.08 } }, timeScale: { borderColor: "#2a2f3a", visible: false }, crosshair: { mode: 0 }, width: el.clientWidth, height: el.clientHeight });
    chartRef.current = chart;
    const unsubscribeRange = subscribeChartRange("primary", (range) => { if (range) chart.timeScale().setVisibleLogicalRange(range); });
    const rsiLine = chart.addSeries(LineSeries, { lineWidth: 1, title: "RSI 14", priceLineVisible: false, lastValueVisible: true, autoscaleInfoProvider: () => ({ priceRange: { minValue: 0, maxValue: 100 } }) });
    let rsiValues = new Map();
    const unsubscribeCrosshair = subscribeChartCrosshair("primary", (payload) => {
      if (!payload?.time) { chart.clearCrosshairPosition(); return; }
      const rsiValue = rsiValues.get(payload.time) ?? 50;
      chart.setCrosshairPosition(rsiValue, payload.time, rsiLine);
    });
    rsiLine.createPriceLine({ price: 70, title: "70", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, lineVisible: true });
    rsiLine.createPriceLine({ price: 30, title: "30", lineWidth: 1, lineStyle: 2, axisLabelVisible: true, lineVisible: true });
    let disposed = false; const step = intervalSeconds(interval); const to = Math.floor(Date.now() / 1000); const from = to - step * 180;
    loadCandles(symbol, interval, from, to).then((candles) => { if (disposed || !candles.length) return; const points = createRsiSeries(candles, 14).points; rsiValues = new Map(points.map((point) => [point.time, point.value])); rsiLine.setData(points); chart.timeScale().setVisibleLogicalRange({ from: Math.max(0, candles.length - visibleBars), to: candles.length - 1 }); });
    const resize = () => chart.applyOptions({ width: el.clientWidth, height: el.clientHeight }); window.addEventListener("resize", resize);
    return () => { disposed = true; unsubscribeRange(); unsubscribeCrosshair(); chartRef.current = null; window.removeEventListener("resize", resize); chart.remove(); };
  }, [symbol, interval]);
  useEffect(() => { const chart = chartRef.current; if (!chart) return; const range = chart.timeScale().getVisibleLogicalRange(); if (!range) return; chart.timeScale().setVisibleLogicalRange({ from: range.to - visibleBars + 1, to: range.to }); }, [visibleBars]);
  return <div className="rsi-pane"><div className="rsi-pane-header"><strong>RSI 14</strong><span>Relative Strength Index</span></div><div className="rsi-chart" ref={ref} /></div>;
}

export default function App() {
  const [symbol, setSymbol] = useState(DEFAULT_WATCHLIST[0]); const [interval, setIntervalValue] = useState("1D"); const [searchOpen, setSearchOpen] = useState(false); const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState(DEFAULT_WATCHLIST); const [quotes, setQuotes] = useState({}); const [streamStatus, setStreamStatus] = useState("disconnected");
  const [indicators, setIndicators] = useState([{ kind: "sma", period: 20, enabled: true }, { kind: "ema", period: 50, enabled: false }]); const [rsiEnabled, setRsiEnabled] = useState(true); const [visibleBars, setVisibleBars] = useState(120);
  const [drawings, setDrawings] = useState([]); const [selectedDrawingId, setSelectedDrawingId] = useState(null);
  const [workspaceReady, setWorkspaceReady] = useState(!API_URL); const hydrating = useRef(true); const saveTimer = useRef(null); const [activeTool, setActiveTool] = useState("crosshair"); const [bottom, setBottom] = useState("Trading Panel");
  const [screenerOpen, setScreenerOpen] = useState(false);
  const filtered = DEFAULT_WATCHLIST.filter((x) => `${x.symbol} ${x.name}`.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => { let cancelled = false; if (!API_URL) { hydrating.current = false; return undefined; } loadWorkspace(API_URL, DEMO_USER_ID).then((remote) => { if (cancelled) return; const normalized = normalizeWorkspace(remote, DEFAULT_WORKSPACE); const bySymbol = new Map(DEFAULT_WATCHLIST.map((item) => [item.symbol, item])); setWatchlist(normalized.watchlist.map((value) => bySymbol.get(value)).filter(Boolean)); setSymbol(bySymbol.get(normalized.activeSymbol) ?? DEFAULT_WATCHLIST[0]); setIntervalValue(normalized.interval); setWorkspaceReady(true); hydrating.current = false; }).catch((error) => { console.warn("Workspace API unavailable; keeping local session state.", error); hydrating.current = false; setWorkspaceReady(true); }); return () => { cancelled = true; }; }, []);
  useEffect(() => { if (!workspaceReady || hydrating.current || !API_URL) return undefined; clearTimeout(saveTimer.current); saveTimer.current = setTimeout(() => { saveWorkspace({ watchlist: watchlist.map((item) => item.symbol), activeSymbol: symbol.symbol, interval }, API_URL, DEMO_USER_ID).catch((error) => console.warn("Workspace save failed.", error)); }, 500); return () => clearTimeout(saveTimer.current); }, [watchlist, symbol, interval, workspaceReady]);
  useEffect(() => { let cancelled = false; const load = async () => { const entries = await Promise.all(watchlist.map(async (item) => { try { return [item.symbol, await fetchQuote(item.symbol, API_URL, MARKET_DATA)]; } catch { return null; } })); if (!cancelled) setQuotes(Object.fromEntries(entries.filter(Boolean))); }; load(); return () => { cancelled = true; }; }, [watchlist]);
  useEffect(() => { if (!WS_URL) return undefined; const disconnect = connectMarketStream(WS_URL, watchlist.map((item) => item.symbol), (event) => { setStreamStatus(event.status); if (event.type === "quote") setQuotes((current) => ({ ...current, [event.quote.symbol]: event.quote })); }); return disconnect; }, [watchlist]);
  useEffect(() => () => clearTimeout(saveTimer.current), []);
  useEffect(() => { const onKeyDown = (event) => { if (event.key === "Escape") { setActiveTool("crosshair"); setSelectedDrawingId(null); } if ((event.key === "Delete" || event.key === "Backspace") && selectedDrawingId) { setDrawings((current) => removeDrawing(current, selectedDrawingId)); setSelectedDrawingId(null); } }; window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown); }, [selectedDrawingId]);
  const currentQuote = quotes[symbol.symbol];
  const toggleIndicator = (kind) => setIndicators((current) => current.map((indicator) => indicator.kind === kind ? { ...indicator, enabled: !indicator.enabled } : indicator));
  const zoom = (delta) => setVisibleBars((current) => clampVisibleBars(current + delta));
  return <div className="app-shell">
    <header className="topbar"><div className="brand"><BarChart3 size={20} /><span>ChartingadvanceV</span></div><div className="top-actions"><button title="Search" onClick={() => setSearchOpen((value) => !value)}><Search size={17} /></button><button title="Alerts"><Bell size={17} /></button><button title="Settings"><Settings size={17} /></button><button title="User"><UserRound size={17} /></button></div></header>
    {searchOpen && <div className="symbol-search"><Search size={16} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search symbol" /> <button onClick={() => setSearchOpen(false)}><X size={16} /></button><div className="search-results">{filtered.map((item) => <button key={item.symbol} onClick={() => { setSymbol(item); setSearchOpen(false); setQuery(""); }}><strong>{item.symbol}</strong><span>{item.name}</span></button>)}</div></div>}
    <div className="workspace-toolbar"><div className="symbol-select"><Star size={15} /><strong>{symbol.symbol}</strong><ChevronDown size={14} /></div><div className="quote"><strong>{currentQuote ? formatQuoteValue(currentQuote.last) : "—"}</strong><span className={(currentQuote?.changePercent ?? 0) >= 0 ? "positive" : "negative"}>{currentQuote ? `${currentQuote.changePercent >= 0 ? "+" : ""}${currentQuote.changePercent.toFixed(2)}%` : "No quote"}</span></div><div className="tool-group">{[["crosshair", Crosshair], ["line", Minus], ["trend", TrendingUp], ["text", Type], ["cursor", Pencil]].map(([tool, Icon]) => <button key={tool} className={activeTool === tool ? "active" : ""} title={tool} onClick={() => setActiveTool(tool)}><Icon size={16} /></button>)}<button title="Delete selected" disabled={!selectedDrawingId} onClick={() => { setDrawings((current) => removeDrawing(current, selectedDrawingId)); setSelectedDrawingId(null); }}><Trash2 size={16} /></button></div><div className="tool-group"><button onClick={() => zoom(-10)} title="Zoom in"><Plus size={16} /></button><button onClick={() => zoom(10)} title="Zoom out"><Minus size={16} /></button></div><div className="intervals">{INTERVALS.map((value) => <button key={value} className={interval === value ? "active" : ""} onClick={() => setIntervalValue(value)}>{value}</button>)}</div></div>
    <div className="main-layout"><aside className="watchlist"><div className="panel-title"><span>Watchlist</span><MoreHorizontal size={16} /></div>{watchlist.map((item) => { const quote = quotes[item.symbol]; return <button className={symbol.symbol === item.symbol ? "watch-item selected" : "watch-item"} key={item.symbol} onClick={() => setSymbol(item)}><span><strong>{item.symbol.split(":")[1]}</strong><small>{item.name}</small></span><span className={(quote?.changePercent ?? 0) >= 0 ? "positive" : "negative"}>{quote ? `${quote.changePercent >= 0 ? "+" : ""}${quote.changePercent.toFixed(2)}%` : "—"}</span></button>; })}<div className="stream-status">stream: {streamStatus}</div></aside><main className="chart-workspace"><div className="chart-header"><div><strong>{symbol.name}</strong><span>{interval} · Demo market data</span></div><div className="chart-header-actions"><button onClick={() => setRsiEnabled((value) => !value)} className={rsiEnabled ? "active" : ""}>RSI</button><button onClick={() => toggleIndicator("ema")} className={indicators.find((indicator) => indicator.kind === "ema")?.enabled ? "active" : ""}>EMA 50</button></div></div><Chart symbol={symbol.symbol} interval={interval} indicators={indicators} visibleBars={visibleBars} drawings={drawings} onDrawingsChange={setDrawings} activeTool={activeTool} selectedDrawingId={selectedDrawingId} onSelectDrawing={setSelectedDrawingId} />{rsiEnabled && <RsiPane symbol={symbol.symbol} interval={interval} visibleBars={visibleBars} />}</main></div>
    <div className="bottom-bar">{["Trading Panel", "Stock Screener", "Pine Editor", "Strategy Tester", "Replay"].map((label) => <button key={label} className={bottom === label ? "active" : ""} onClick={() => { setBottom(label); if (label === "Stock Screener") setScreenerOpen(true); }}>{label}</button>)}<span className="bottom-spacer" /><span>Paper Trading · Simulation</span></div>
    {screenerOpen && <ScreenerPanel onClose={() => setScreenerOpen(false)} />}
  </div>;
}
