import { WORKSPACE_SCHEMA_VERSION, createWorkspaceDocument, nextWorkspaceRevision } from "../../../packages/chart-engine/src/workspace-persistence.ts";

const DEFAULT_STATE = { watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"], activeSymbol: "NASDAQ:AAPL", interval: "1D" };
const VALID_INTERVALS = new Set(["1m", "5m", "15m", "1H", "4H", "1D", "1W", "1M"]);
const SYMBOL_PATTERN = /^[A-Z0-9_.-]+:[A-Z0-9_.-]+$/i;
const MAX_WATCHLIST = 100;

function ownerIdFor(userId) {
  return typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous";
}
function workspaceIdFor(userId) { return `workspace:${ownerIdFor(userId)}`; }
function normalizeSymbols(value) {
  if (!Array.isArray(value)) return null;
  return [...new Set(value.filter((symbol) => typeof symbol === "string" && SYMBOL_PATTERN.test(symbol)).slice(0, MAX_WATCHLIST))];
}
function normalizePatch(current, patch) {
  const watchlist = normalizeSymbols(patch.watchlist);
  const next = {
    ...current,
    ...(watchlist ? { watchlist } : {}),
    ...(typeof patch.activeSymbol === "string" && SYMBOL_PATTERN.test(patch.activeSymbol) ? { activeSymbol: patch.activeSymbol } : {}),
    ...(typeof patch.interval === "string" && VALID_INTERVALS.has(patch.interval) ? { interval: patch.interval } : {}),
  };
  if (!next.watchlist.includes(next.activeSymbol)) next.activeSymbol = next.watchlist[0] ?? current.activeSymbol;
  return next;
}

export function createWorkspaceService(repository) {
  if (!repository) throw new Error("workspace repository is required");
  async function getDocument(userId) {
    const ownerId = ownerIdFor(userId);
    const workspaceId = workspaceIdFor(ownerId);
    let document = await repository.get(workspaceId, ownerId);
    if (!document) document = await repository.create(createWorkspaceDocument(workspaceId, ownerId, DEFAULT_STATE, Date.now()));
    return document;
  }
  async function getWorkspace(userId) {
    return structuredClone((await getDocument(userId)).state);
  }
  async function saveWorkspace(userId, patch = {}, expectedRevision) {
    const current = await getDocument(userId);
    const expected = expectedRevision == null ? current.revision : Number(expectedRevision);
    const nextState = normalizePatch(current.state, patch);
    const next = nextWorkspaceRevision(current, expected, nextState, Date.now());
    return repository.update(next, expected);
  }
  return { getWorkspace, saveWorkspace, getDocument, schemaVersion: WORKSPACE_SCHEMA_VERSION };
}
