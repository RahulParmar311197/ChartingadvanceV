import { spawn } from "node:child_process";
import process from "node:process";
import WebSocket from "ws";

const apiPort = Number(process.env.SMOKE_API_PORT ?? 8877);
const wsPort = Number(process.env.SMOKE_WS_PORT ?? 8878);
const apiBase = `http://127.0.0.1:${apiPort}`;
const wsUrl = `ws://127.0.0.1:${wsPort}`;
const env = { ...process.env, PORT: String(apiPort), MARKET_WS_PORT: String(wsPort), PAPER_PERSISTENCE: "memory" };
const children = [];

function start(command, args) {
  const child = spawn(command, args, { env, stdio: ["ignore", "pipe", "pipe"] });
  child.stdout.on("data", (chunk) => process.stdout.write(`[${command}] ${chunk}`));
  child.stderr.on("data", (chunk) => process.stderr.write(`[${command}] ${chunk}`));
  children.push(child);
  return child;
}

async function waitFor(url, timeoutMs = 10_000) {
  const deadline = Date.now() + timeoutMs;
  let lastError;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) { lastError = error; }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError?.message ?? "unknown error"}`);
}

async function assertJson(path, check) {
  const response = await fetch(`${apiBase}${path}`);
  if (!response.ok) throw new Error(`${path} returned HTTP ${response.status}`);
  const body = await response.json();
  check(body);
  return body;
}

async function smokeWebSocket() {
  await new Promise((resolve, reject) => {
    const socket = new WebSocket(wsUrl);
    const timer = setTimeout(() => { socket.close(); reject(new Error("WebSocket smoke test timed out")); }, 5_000);
    let sawConnected = false;
    let sawQuote = false;
    socket.on("open", () => socket.send(JSON.stringify({ type: "subscribe", symbols: ["NASDAQ:AAPL", "NASDAQ:MSFT"] })));
    socket.on("message", (raw) => {
      const event = JSON.parse(raw.toString());
      if (event.type === "status" && event.status === "connected") sawConnected = true;
      if (event.type === "quote" && ["NASDAQ:AAPL", "NASDAQ:MSFT"].includes(event.quote?.symbol)) sawQuote = true;
      if (sawConnected && sawQuote) { clearTimeout(timer); socket.close(); resolve(); }
    });
    socket.on("error", (error) => { clearTimeout(timer); reject(error); });
  });
}

try {
  start("node", ["--import", "tsx", "apps/api/src/index.js"]);
  start("node", ["--import", "tsx", "apps/api/src/realtime.js"]);
  await waitFor(`${apiBase}/health`);
  await assertJson("/v1/market/quote?symbol=NASDAQ%3AAAPL", (body) => { if (!body.data?.symbol || body.meta?.simulated !== true) throw new Error("quote contract mismatch"); });
  await assertJson("/v1/market/candles?symbol=NASDAQ%3AAAPL&interval=1D&from=1700000000&to=1710000000", (body) => { if (!Array.isArray(body.data) || body.data.length === 0) throw new Error("candle contract mismatch"); });
  await assertJson("/v1/screener/fundamentals?query=%7B%22filters%22%3A%5B%5D%2C%22groups%22%3A%5B%5D%7D&limit=10", (body) => { if (!Array.isArray(body.data?.items)) throw new Error("screener contract mismatch"); });
  await assertJson("/v1/paper/portfolio", (body) => { if (!body.data?.cash || body.meta?.execution !== "paper-only") throw new Error("paper portfolio contract mismatch"); });
  await assertJson("/v1/paper/orders", (body) => { if (!Array.isArray(body.data)) throw new Error("paper orders contract mismatch"); });
  await assertJson("/v1/paper/audit", (body) => { if (!Array.isArray(body.data)) throw new Error("paper audit contract mismatch"); });
  await assertJson("/v1/workspace", (body) => { if (!Array.isArray(body.data?.watchlist)) throw new Error("workspace contract mismatch"); });
  const backtest = await fetch(`${apiBase}/v1/backtest`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ symbol: "NASDAQ:AAPL", interval: "1D", strategy: "candle-direction", candles: [{ time: 1700000000, open: 100, high: 102, low: 99, close: 101, volume: 1000 }, { time: 1700086400, open: 101, high: 103, low: 100, close: 102, volume: 1000 }, { time: 1700172800, open: 102, high: 104, low: 101, close: 100, volume: 1000 }] }) });
  if (!backtest.ok) throw new Error(`/v1/backtest returned HTTP ${backtest.status}`);
  const backtestBody = await backtest.json();
  if (!backtestBody.data || backtestBody.meta?.simulated !== true) throw new Error("backtest contract mismatch");
  await smokeWebSocket();
  console.log("Codespaces smoke test: PASS — REST market, screener, paper, workspace, backtest and WebSocket paths are reachable.");
} finally {
  for (const child of children) child.kill("SIGTERM");
}
