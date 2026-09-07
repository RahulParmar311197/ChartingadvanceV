import { createServer } from "node:http";

const PORT = Number(process.env.PORT ?? 8787);
const INTERVAL_SECONDS = { "1m": 60, "5m": 300, "15m": 900, "1H": 3600, "4H": 14400, "1D": 86400, "1W": 604800, "1M": 2592000 };
const INTERVALS = new Set(Object.keys(INTERVAL_SECONDS));
const PROVIDER = "demo";

function hashSymbol(symbol) {
  let hash = 2166136261;
  for (const char of symbol) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
}
function noise(seed) {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return (x - Math.floor(x)) - 0.5;
}
function candles(symbol, interval, from, to) {
  const step = INTERVAL_SECONDS[interval];
  const start = Math.ceil(from / step) * step;
  const count = Math.min(5000, Math.max(0, Math.floor((to - start) / step)));
  const seed = hashSymbol(symbol);
  const base = 100 + (seed % 500);
  const result = [];
  let previous = base;
  for (let i = 0; i < count; i += 1) {
    const time = start + i * step;
    const drift = noise(seed + i * 17) * base * 0.012;
    const open = Math.max(0.01, previous);
    const close = Math.max(0.01, open + drift);
    const spread = Math.abs(noise(seed + i * 31)) * base * 0.008 + 0.01;
    result.push({ time, open, high: Math.max(open, close) + spread, low: Math.max(0.01, Math.min(open, close) - spread), close, volume: Math.round(100000 + Math.abs(noise(seed + i * 43)) * 900000) });
    previous = close;
  }
  return result;
}
function quote(symbol) {
  const seed = hashSymbol(symbol);
  const last = 100 + (seed % 500);
  const changePercent = ((seed % 1000) - 500) / 100;
  return { symbol, last, change: last * changePercent / 100, changePercent, timestamp: Date.now() };
}
function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*" });
  res.end(JSON.stringify(body));
}
function parseNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

const server = createServer((req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, null);
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname === "/health") return json(res, 200, { ok: true, provider: PROVIDER, simulated: true });
  if (url.pathname === "/v1/market/quote") {
    const symbol = url.searchParams.get("symbol");
    if (!symbol || !symbol.includes(":")) return json(res, 400, { error: { code: "INVALID_SYMBOL", message: "symbol must use EXCHANGE:TICKER format" } });
    return json(res, 200, { data: quote(symbol), meta: { provider: PROVIDER, simulated: true } });
  }
  if (url.pathname !== "/v1/market/candles") return json(res, 404, { error: { code: "NOT_FOUND", message: "Route not found" } });

  const symbol = url.searchParams.get("symbol");
  const interval = url.searchParams.get("interval") ?? "1D";
  const from = parseNumber(url.searchParams.get("from"));
  const to = parseNumber(url.searchParams.get("to"));
  if (!symbol || !symbol.includes(":")) return json(res, 400, { error: { code: "INVALID_SYMBOL", message: "symbol must use EXCHANGE:TICKER format" } });
  if (!INTERVALS.has(interval)) return json(res, 400, { error: { code: "INVALID_INTERVAL", message: "Unsupported candle interval" } });
  if (from === null || to === null || from >= to) return json(res, 400, { error: { code: "INVALID_RANGE", message: "from and to must be finite Unix seconds with from < to" } });

  return json(res, 200, { data: candles(symbol, interval, from, to), meta: { provider: PROVIDER, simulated: true, symbol, interval, from, to } });
});

server.listen(PORT, () => console.log(`ChartingadvanceV API listening on http://localhost:${PORT}`));
