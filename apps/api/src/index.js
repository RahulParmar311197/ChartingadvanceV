import { createServer } from "node:http";
import { generateCandles, generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { getWorkspace, saveWorkspace } from "./workspace.js";
import { executeDemoScreener } from "./screener.js";
import { submitPaperOrder, getPaperPortfolio, cancelPaperOrder, replacePaperOrder, getPaperAudit } from "./paper-trading.js";
import { parseScreenerRequest, validateCandleRequest, validSymbol } from "./validation.js";

const PORT = Number(process.env.PORT ?? 8787);
const PROVIDER = "demo";
const MAX_BODY_BYTES = 32 * 1024;

function json(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,x-demo-user-id", "access-control-allow-methods": "GET,POST,PUT,OPTIONS" });
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
function paperMeta() { return { provider: PROVIDER, simulated: true, execution: "paper-only" }; }

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

  if (url.pathname === "/v1/screener/fundamentals" && req.method === "GET") {
    try {
      const rawQuery = url.searchParams.get("query");
      const rawFilters = url.searchParams.get("filters");
      const rawGroups = url.searchParams.get("groups");
      const parsed = parseScreenerRequest({
        symbols: url.searchParams.getAll("symbol"),
        query: rawQuery ? JSON.parse(rawQuery) : undefined,
        filters: rawFilters ? JSON.parse(rawFilters) : undefined,
        groups: rawGroups ? JSON.parse(rawGroups) : undefined,
        limit: url.searchParams.get("limit") == null ? undefined : Number(url.searchParams.get("limit")),
        cursor: url.searchParams.get("cursor") ?? undefined,
      });
      const data = await executeDemoScreener(parsed);
      return json(res, 200, { data, meta: { provider: PROVIDER, simulated: true } });
    } catch (error) {
      return json(res, 400, { error: { code: "INVALID_SCREENER_REQUEST", message: error?.message ?? "Invalid screener request" } });
    }
  }

  if (url.pathname === "/v1/paper/portfolio" && req.method === "GET") {
    return json(res, 200, { data: getPaperPortfolio(userId(req)), meta: paperMeta() });
  }

  if (url.pathname === "/v1/paper/audit" && req.method === "GET") {
    const limit = url.searchParams.get("limit");
    return json(res, 200, { data: getPaperAudit(userId(req), limit ?? 100), meta: paperMeta() });
  }

  if (url.pathname === "/v1/paper/orders" && req.method === "POST") {
    try {
      const raw = await readBody(req);
      if (raw.length === 0) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } });
      const input = JSON.parse(raw);
      if (!input || typeof input !== "object" || Array.isArray(input)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } });
      const result = submitPaperOrder(userId(req), input);
      return json(res, result.order.status === "rejected" ? 422 : 200, { data: result, meta: paperMeta() });
    } catch (error) {
      const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_BODY";
      return json(res, 400, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : error?.message ?? "Malformed paper order" } });
    }
  }

  const cancelMatch = url.pathname.match(/^\/v1\/paper\/orders\/([^/]+)$/);
  if (cancelMatch && req.method === "DELETE") {
    try {
      const result = cancelPaperOrder(userId(req), decodeURIComponent(cancelMatch[1]));
      return json(res, result.cancelled ? 200 : 404, { data: result, meta: paperMeta() });
    } catch (error) {
      return json(res, 422, { error: { code: "ORDER_CANCELLATION_REJECTED", message: error?.message ?? "Order cannot be cancelled" } });
    }
  }

  if (cancelMatch && req.method === "PUT") {
    try {
      const raw = await readBody(req);
      if (raw.length === 0) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } });
      const input = JSON.parse(raw);
      if (!input || typeof input !== "object" || Array.isArray(input)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } });
      const result = replacePaperOrder(userId(req), decodeURIComponent(cancelMatch[1]), input);
      if (!result.replaced) return json(res, result.reason === "order not found" ? 404 : 422, { data: result, meta: paperMeta() });
      return json(res, 200, { data: result, meta: paperMeta() });
    } catch (error) {
      const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "ORDER_REPLACEMENT_REJECTED";
      return json(res, 422, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : error?.message ?? "Order cannot be replaced" } });
    }
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
