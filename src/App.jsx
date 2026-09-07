import { useEffect, useRef, useState } from "react";
import { Bell, BarChart3, ChevronDown, Clock3, Crosshair, Grid2X2, LineChart, Menu, Minus, MoreHorizontal, Pencil, Plus, Search, Settings, Star, Trash2, TrendingUp, Type, UserRound, X, ZoomIn } from "lucide-react";
import { createChart, CandlestickSeries, HistogramSeries } from "lightweight-charts";
import { DeterministicDemoMarketDataProvider } from "../packages/market-domain/src/demo-provider.ts";

const MARKET_DATA = new DeterministicDemoMarketDataProvider();

const SYMBOLS = [
  { symbol: "NASDAQ:AAPL", name: "Apple Inc.", price: 239.55, change: 1.24 },
  { symbol: "NASDAQ:MSFT", name: "Microsoft", price: 505.72, change: 0.83 },
  { symbol: "NASDAQ:NVDA", name: "NVIDIA", price: 177.18, change: 2.42 },
  { symbol: "NASDAQ:TSLA", name: "Tesla", price: 346.62, change: -0.54 },
  { symbol: "BINANCE:BTCUSDT", name: "Bitcoin / Tether", price: 111420, change: 1.91 },
  { symbol: "OANDA:EURUSD", name: "Euro / U.S. Dollar", price: 1.1732, change: -0.18 }
];

function intervalSeconds(interval) {
  return { "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400, "1W": 604800, "1M": 2592000 }[interval];
}

function Chart({ symbol, interval }) {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    const chart = createChart(el, {
      layout: { background: { color: "#131722" }, textColor: "#9aa4b2" },
      grid: { vertLines: { color: "#1e2430" }, horzLines: { color: "#1e2430" } },
      rightPriceScale: { borderColor: "#2a2f3a" },
      timeScale: { borderColor: "#2a2f3a", timeVisible: true },
      crosshair: { mode: 0 }, width: el.clientWidth, height: el.clientHeight
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a", downColor: "#ef5350", borderVisible: false,
      wickUpColor: "#26a69a", wickDownColor: "#ef5350"
    });
    const volume = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" }, priceScaleId: "",
      scaleMargins: { top: 0.82, bottom: 0 }
    });
    let disposed = false;
    const step = intervalSeconds(interval);
    const to = Math.floor(Date.now() / 1000);
    const from = to - step * 180;
    MARKET_DATA.getHistoricalCandles({ symbol, interval, from, to }).then((candles) => {
      if (disposed || candles.length === 0) return;
      series.setData(candles);
      volume.setData(candles.map((c) => ({
        time: c.time,
        value: c.volume ?? 0,
        color: c.close >= c.open ? "rgba(38,166,154,.45)" : "rgba(239,83,80,.45)"
      })));
      chart.timeScale().fitContent();
    });
    const resize = () => chart.applyOptions({ width: el.clientWidth, height: el.clientHeight });
    window.addEventListener("resize", resize);
    return () => { disposed = true; window.removeEventListener("resize", resize); chart.remove(); };
  }, [symbol, interval]);
  return <div className="chart-canvas" ref={ref} />;
}

export default function App() {
  const [symbol, setSymbol] = useState(SYMBOLS[0]);
  const [interval, setIntervalValue] = useState("1D");
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [watchlist, setWatchlist] = useState(SYMBOLS);
  const [activeTool, setActiveTool] = useState("crosshair");
  const [bottom, setBottom] = useState("Trading Panel");
  const filtered = SYMBOLS.filter((x) => `${x.symbol} ${x.name}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">TV</div><span>TradingView</span></div>
        <button className="symbol-button" onClick={() => setSearchOpen(true)}><span className="ticker">{symbol.symbol.split(":")[1]}</span><span className="exchange">{symbol.symbol.split(":")[0]}</span><ChevronDown size={15} /></button>
        <button className="icon-btn"><Clock3 size={17} /></button><button className="interval-btn">{interval}<ChevronDown size={13} /></button>
        <button className="toolbar-btn"><BarChart3 size={16} /> Indicators</button><button className="toolbar-btn"><Bell size={16} /> Alert</button><button className="icon-btn"><Settings size={17} /></button>
        <div className="top-spacer"/><button className="top-btn"><Grid2X2 size={16} /> Layout</button><button className="top-btn"><UserRound size={16} /> Sign in</button><button className="blue-btn">Get started</button><button className="icon-btn"><Menu size={18} /></button>
      </header>
      <main className="workspace">
        <aside className="left-toolbar">
          {[["crosshair", Crosshair],["line", Minus],["trend", TrendingUp],["text", Type],["zoom", ZoomIn]].map(([id, Icon]) => <button key={id} className={activeTool === id ? "tool active" : "tool"} onClick={() => setActiveTool(id)}><Icon size={18}/></button>)}
          <div className="tool-divider"/><button className="tool"><Pencil size={17}/></button><button className="tool"><Trash2 size={17}/></button>
        </aside>
        <section className="chart-area">
          <div className="chart-header"><div><strong>{symbol.symbol}</strong><span className="muted"> · {interval}</span><span className="status-dot"/><span className="muted">Demo data</span></div><div className="ohlc"><span>O {symbol.price.toFixed(2)}</span><span>H {(symbol.price*1.014).toFixed(2)}</span><span>L {(symbol.price*.987).toFixed(2)}</span><span>C {symbol.price.toFixed(2)}</span><span className={symbol.change >= 0 ? "positive" : "negative"}>{symbol.change >= 0 ? "+" : ""}{symbol.change.toFixed(2)}%</span></div></div>
          <div className="mini-toolbar">{["1m","5m","15m","1H","4H","1D","1W","1M"].map(x => <button key={x} className={interval === x ? "time active" : "time"} onClick={() => setIntervalValue(x)}>{x}</button>)}<span className="separator"/><button className="time"><LineChart size={15}/></button><button className="time"><Settings size={15}/></button></div>
          <Chart symbol={symbol.symbol} interval={interval}/>
          <div className="chart-footer"><button className="time">Auto</button><button className="time">%</button><div className="footer-spacer"/><button className="time"><Plus size={14}/> Add alert</button><button className="time"><MoreHorizontal size={15}/></button></div>
        </section>
        <aside className="right-panel">
          <div className="panel-tabs"><strong>Watchlist</strong><button className="icon-btn"><Plus size={16}/></button></div>
          <div className="watch-head"><span>Symbol</span><span>Last</span><span>Chg%</span></div>
          <div className="watchlist">{watchlist.map((item) => <button key={item.symbol} className={item.symbol === symbol.symbol ? "watch-row selected" : "watch-row"} onClick={() => setSymbol(item)}><div className="watch-name"><Star size={12}/><div><strong>{item.symbol.split(":")[1]}</strong><small>{item.symbol.split(":")[0]}</small></div></div><span>{item.price.toLocaleString()}</span><span className={item.change >= 0 ? "positive" : "negative"}>{item.change >= 0 ? "+" : ""}{item.change.toFixed(2)}%</span><span className="remove" onClick={(e) => {e.stopPropagation();setWatchlist((w)=>w.filter((x)=>x.symbol!==item.symbol));}}><X size={12}/></span></button>)}</div>
          <div className="news"><div className="panel-tabs"><strong>News</strong><button className="text-btn">All</button></div>{["Markets open higher as tech leads gains","AI infrastructure stocks remain in focus","Dollar index retreats from recent highs"].map((n,i)=><article key={i}><small>Demo · Market News</small><p>{n}</p></article>)}</div>
        </aside>
      </main>
      <footer className="bottom-bar">{["Stock Screener","Pine Editor","Strategy Tester","Replay Trading","Paper Trading","Trading Panel"].map((x)=><button key={x} className={bottom===x?"bottom-tab active":"bottom-tab"} onClick={()=>setBottom(x)}>{x}</button>)}<div className="footer-spacer"/><span className="connection"><span className="status-dot"/> Demo data connection</span></footer>
      {searchOpen && <div className="modal-backdrop" onClick={()=>setSearchOpen(false)}><div className="search-modal" onClick={(e)=>e.stopPropagation()}><div className="search-input"><Search size={18}/><input autoFocus placeholder="Search symbol, company or crypto" value={query} onChange={(e)=>setQuery(e.target.value)}/><kbd>Esc</kbd></div>{filtered.map((item)=><button className="search-result" key={item.symbol} onClick={()=>{setSymbol(item);setSearchOpen(false);setQuery("")}}><div><strong>{item.symbol}</strong><small>{item.name}</small></div><span className={item.change>=0?"positive":"negative"}>{item.price.toLocaleString()} · {item.change}%</span></button>)}</div></div>}
    </div>
  );
}
