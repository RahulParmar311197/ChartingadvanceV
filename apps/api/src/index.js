import { createServer } from "node:http";
import { generateCandles, generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { getWorkspace, saveWorkspace } from "./workspace.js";
import { validateCandleRequest, validSymbol } from "./validation.js";

const PORT = Number(process.env.PORT ?? 8787);
const PROVIDER = "demo";
const MAX_BODY_BYTES = 32 * 1024;

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,x-demo-user-id", "access-control-allow-methods": "GET,PUT,OPTIONS" });
  res.end(JSON.stringify(body));
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk;
      if (Buffer.byteLength(body) > MAX_BODY_BYTES) reject(new Error("BODY_TOO_LARGE"));
    });
    req.on("end", () => resolve(body));
    req.on("error", reject);
  });
}
function userId(req) { return req.headers["x-demo-user-id"] || "anonymous"; }

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") return json(res, 204, null);
  const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
  if (url.pathname === "/health") return json(res, 200, { ok: true, provider: PROVIDER, simulated: true });

  if (url.pathname === "/v1/market/quote" && req.method === "GET") {
    const symbol = url.searchParams.get("symbol");
    if (!validSymbol(symbol)) return json(res, 400, { error: { code: "INVALID_SYMBOL", message: "symbol must use EXCHANGE:TICKER format" } });
    return json(res, 200, { data: generateQuote(symbol), meta: { provider: PROVIDER, simulated: true } });
  }

  if (url.pathname === "/v1/market/candles" && req.method === "GET") {
    const result = validateCandleRequest({ symbol: url.searchParams.get("symbol"), interval: url.searchParams.get("interval") ?? "1D", from: url.searchParams.get("from"), to: url.searchParams.get("to") });
    if (!result.ok) {
      const messages = { INVALID_SYMBOL: "symbol must use EXCHANGE:TICKER format", INVALID_INTERVAL: "Unsupported candle interval", INVALID_RANGE: "from and to must be finite Unix seconds with from < to" };
      return json(res, 400, { error: { code: result.code, message: messages[result.code] } });
    }
    return json(res, 200, { data: generateCandles(result.symbol, result.interval, result.from, result.to), meta: { provider: PROVIDER, simulated: true, ...result } });
  }

  if (url.pathname === "/v1/workspace" && req.method === "GET") return json(res, 200, { data: getWorkspace(userId(req)), meta: { persistent: false, simulated: true } });
  if (url.pathname === "/v1/workspace" && req.method === "PUT") {
    try {
      const raw = await readBody(req);
      if (raw.length === 0) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } });
      const patch = JSON.parse(raw);
      if (!patch || typeof patch !== "object" || Array.isArray(patch)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } });
      return json(res, 200, { data: saveWorkspace(userId(req), patch), meta: { persistent: false, simulated: true } });
    } catch (error) {
      const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_BODY";
      return json(res, 400, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : "Malformed JSON body" } });
    }
  }
  return json(res, 404, { error: { code: "NOT_FOUND", message: "Route not found" } });
});

server.listen(PORT, () => console.log(`ChartingadvanceV API listening on http://localhost:${PORT}`));
