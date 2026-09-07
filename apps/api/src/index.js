import { createServer } from "node:http";
import { generateCandles, generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { getWorkspace, saveWorkspace } from "./workspace.js";
import { executeDemoScreener, createDemoFundamentalsProvider } from "./screener.js";
import { createScreenerApplication } from "./screener-application.js";
import { PostgresScreenerContinuationRepository } from "./screener-continuation-repository.js";
import { executeBacktest } from "./backtest.js";
import { createPaperTradingService } from "./paper-trading.js";
import { PostgresPaperRepository, createPostgresPoolFromEnv } from "./postgres-paper-repository.js";
import { createPaperRepository } from "./paper-repository.js";
import { PostgresWorkspaceRepository } from "./postgres-workspace-repository.js";
import { createWorkspaceService } from "./workspace-service.js";
import { parseScreenerRequest, validateCandleRequest, validSymbol } from "./validation.js";

const PORT = Number(process.env.PORT ?? 8787);
const PROVIDER = "demo";
const MAX_BODY_BYTES = 32 * 1024;
const persistenceMode = process.env.PAPER_PERSISTENCE ?? (process.env.NODE_ENV === "production" ? "postgres" : "memory");
if (persistenceMode !== "memory" && persistenceMode !== "postgres") throw new Error("PAPER_PERSISTENCE must be memory or postgres");
const paperPool = persistenceMode === "postgres" ? await createPostgresPoolFromEnv() : null;
const paperService = createPaperTradingService(paperPool ? new PostgresPaperRepository(paperPool) : createPaperRepository());
const workspaceService = paperPool ? createWorkspaceService(new PostgresWorkspaceRepository(paperPool)) : null;
const screenerApplication = createScreenerApplication({
  provider: createDemoFundamentalsProvider(),
  providerName: PROVIDER,
  continuationRepository: paperPool ? new PostgresScreenerContinuationRepository(paperPool) : undefined,
});

function json(res, status, body, extraHeaders = {}) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "access-control-allow-origin": "*", "access-control-allow-headers": "content-type,x-demo-user-id,if-match,x-workspace-revision", "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS", ...extraHeaders });
  res.end(JSON.stringify(body));
}
function readBody(req) { return new Promise((resolve, reject) => { let body = ""; req.on("data", (chunk) => { body += chunk; if (Buffer.byteLength(body) > MAX_BODY_BYTES) reject(new Error("BODY_TOO_LARGE")); }); req.on("end", () => resolve(body)); req.on("error", reject); }); }
function userId(req) { return req.headers["x-demo-user-id"] || "anonymous"; }
function paperMeta() { return { provider: PROVIDER, simulated: true, execution: "paper-only", persistence: persistenceMode }; }
function workspaceMeta(persistent) { return { persistent, simulated: !persistent, schemaVersion: workspaceService?.schemaVersion ?? 0 }; }
function revisionFromRequest(req) {
  const raw = req.headers["if-match"] ?? req.headers["x-workspace-revision"];
  if (raw == null) return undefined;
  const value = String(raw).replace(/^W\//, "").replace(/^\"|\"$/g, "");
  const revision = Number(value);
  if (!Number.isInteger(revision) || revision < 0) throw new Error("INVALID_WORKSPACE_REVISION");
  return revision;
}

const server = createServer(async (req, res) => {
  try {
    if (req.method === "OPTIONS") return json(res, 204, null);
    const url = new URL(req.url ?? "/", `http://${req.headers.host ?? "localhost"}`);
    if (url.pathname === "/health") return json(res, 200, { ok: true, provider: PROVIDER, simulated: true, persistence: persistenceMode, workspacePersistence: workspaceService ? "postgres" : "memory", screenerContinuationPersistence: paperPool ? "postgres" : "memory" });
    if (url.pathname === "/v1/market/quote" && req.method === "GET") { const symbol = url.searchParams.get("symbol"); if (!validSymbol(symbol)) return json(res, 400, { error: { code: "INVALID_SYMBOL", message: "symbol must use EXCHANGE:TICKER format" } }); return json(res, 200, { data: generateQuote(symbol), meta: { provider: PROVIDER, simulated: true } }); }
    if (url.pathname === "/v1/market/candles" && req.method === "GET") { const result = validateCandleRequest({ symbol: url.searchParams.get("symbol"), interval: url.searchParams.get("interval") ?? "1D", from: url.searchParams.get("from"), to: url.searchParams.get("to") }); if (!result.ok) { const messages = { INVALID_SYMBOL: "symbol must use EXCHANGE:TICKER format", INVALID_INTERVAL: "Unsupported candle interval", INVALID_RANGE: "from and to must be finite Unix seconds with from < to" }; return json(res, 400, { error: { code: result.code, message: messages[result.code] } }); } return json(res, 200, { data: generateCandles(result.symbol, result.interval, result.from, result.to), meta: { provider: PROVIDER, simulated: true, ...result } }); }
    if (url.pathname === "/v1/backtest" && req.method === "POST") { try { const raw = await readBody(req); if (!raw.length) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } }); const input = JSON.parse(raw); const result = executeBacktest(input); return json(res, 200, { data: result.result, benchmark: result.benchmark, meta: result.meta }); } catch (error) { const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_BACKTEST_REQUEST"; return json(res, 400, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : error?.message ?? "Invalid backtest request" } }); } }
    if (url.pathname === "/v1/screener/fundamentals" && req.method === "GET") { try { const rawQuery = url.searchParams.get("query"); const rawFilters = url.searchParams.get("filters"); const rawGroups = url.searchParams.get("groups"); const parsed = parseScreenerRequest({ symbols: url.searchParams.getAll("symbol"), query: rawQuery ? JSON.parse(rawQuery) : undefined, filters: rawFilters ? JSON.parse(rawFilters) : undefined, groups: rawGroups ? JSON.parse(rawGroups) : undefined, limit: url.searchParams.get("limit") == null ? undefined : Number(url.searchParams.get("limit")), cursor: url.searchParams.get("cursor") ?? undefined }); const data = await screenerApplication.run({ ...parsed, ownerId: userId(req) }); return json(res, 200, { data, meta: { provider: PROVIDER, simulated: true, continuation: "server-opaque" } }); } catch (error) { return json(res, 400, { error: { code: "INVALID_SCREENER_REQUEST", message: error?.message ?? "Invalid screener request" } }); } }
    if (url.pathname === "/v1/paper/portfolio" && req.method === "GET") return json(res, 200, { data: await paperService.getPaperPortfolio(userId(req)), meta: paperMeta() });
    if (url.pathname === "/v1/paper/audit" && req.method === "GET") return json(res, 200, { data: await paperService.getPaperAudit(userId(req), url.searchParams.get("limit") ?? 100), meta: paperMeta() });
    if (url.pathname === "/v1/paper/orders" && req.method === "GET") return json(res, 200, { data: await paperService.getPaperOrders(userId(req)), meta: paperMeta() });
    if (url.pathname === "/v1/paper/orders" && req.method === "POST") { try { const raw = await readBody(req); if (!raw.length) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } }); const input = JSON.parse(raw); if (!input || typeof input !== "object" || Array.isArray(input)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } }); const result = await paperService.submitPaperOrder(userId(req), input); return json(res, result.order.status === "rejected" ? 422 : 200, { data: result, meta: paperMeta() }); } catch (error) { const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "INVALID_BODY"; return json(res, 400, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : error?.message ?? "Malformed paper order" } }); } }
    const cancelMatch = url.pathname.match(/^\/v1\/paper\/orders\/([^/]+)$/);
    if (cancelMatch && req.method === "DELETE") { try { const result = await paperService.cancelPaperOrder(userId(req), decodeURIComponent(cancelMatch[1])); return json(res, result.cancelled ? 200 : 404, { data: result, meta: paperMeta() }); } catch (error) { return json(res, 422, { error: { code: "ORDER_CANCELLATION_REJECTED", message: error?.message ?? "Order cannot be cancelled" } }); } }
    if (cancelMatch && req.method === "PUT") { try { const raw = await readBody(req); if (!raw.length) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } }); const input = JSON.parse(raw); if (!input || typeof input !== "object" || Array.isArray(input)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } }); const result = await paperService.replacePaperOrder(userId(req), decodeURIComponent(cancelMatch[1]), input); return json(res, result.replaced ? 200 : 422, { data: result, meta: paperMeta() }); } catch (error) { const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : "ORDER_REPLACEMENT_REJECTED"; return json(res, 422, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : error?.message ?? "Order cannot be replaced" } }); } }
    if (url.pathname === "/v1/workspace" && req.method === "GET") { if (!workspaceService) return json(res, 200, { data: getWorkspace(userId(req)), meta: workspaceMeta(false) }); const document = await workspaceService.getDocument(userId(req)); return json(res, 200, { data: document.state, meta: { ...workspaceMeta(true), revision: document.revision, updatedAt: document.updatedAt } }, { etag: `"${document.revision}"` }); }
    if (url.pathname === "/v1/workspace" && req.method === "PUT") { try { const raw = await readBody(req); if (!raw.length) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON body is required" } }); const patch = JSON.parse(raw); if (!patch || typeof patch !== "object" || Array.isArray(patch)) return json(res, 400, { error: { code: "INVALID_BODY", message: "JSON object is required" } }); if (!workspaceService) return json(res, 200, { data: saveWorkspace(userId(req), patch), meta: workspaceMeta(false) }); const document = await workspaceService.saveWorkspace(userId(req), patch, revisionFromRequest(req)); return json(res, 200, { data: document.state, meta: { ...workspaceMeta(true), revision: document.revision, updatedAt: document.updatedAt } }, { etag: `"${document.revision}"` }); } catch (error) { const code = error?.message === "BODY_TOO_LARGE" ? "BODY_TOO_LARGE" : error?.message === "INVALID_WORKSPACE_REVISION" ? "INVALID_WORKSPACE_REVISION" : error?.message === "workspace revision conflict" ? "WORKSPACE_REVISION_CONFLICT" : "INVALID_BODY"; const status = code === "WORKSPACE_REVISION_CONFLICT" ? 409 : 400; return json(res, status, { error: { code, message: code === "BODY_TOO_LARGE" ? "Request body exceeds 32 KiB" : code === "INVALID_WORKSPACE_REVISION" ? "Workspace revision must be a non-negative integer" : code === "WORKSPACE_REVISION_CONFLICT" ? "Workspace was modified by another request; reload and retry" : "Malformed JSON body" } }); } }
    return json(res, 404, { error: { code: "NOT_FOUND", message: "Route not found" } });
  } catch (error) { console.error(error); return json(res, 500, { error: { code: "INTERNAL_ERROR", message: "Internal server error" } }); }
});
server.listen(PORT, () => console.log(`ChartingadvanceV API listening on http://localhost:${PORT} (paper persistence: ${persistenceMode}, workspace persistence: ${workspaceService ? "postgres" : "memory"})`));
