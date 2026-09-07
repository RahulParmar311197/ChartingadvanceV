import { WORKSPACE_SCHEMA_VERSION, createWorkspaceDocument, nextWorkspaceRevision } from "../../../packages/chart-engine/src/workspace-persistence.ts";

const DEFAULT_STATE = { watchlist: ["NASDAQ:AAPL", "NASDAQ:MSFT", "NASDAQ:NVDA"], activeSymbol: "NASDAQ:AAPL", interval: "1D" };

function ownerIdFor(userId) {
  return typeof userId === "string" && userId.trim() ? userId.trim().slice(0, 128) : "anonymous";
}
function workspaceIdFor(userId) { return `workspace:${ownerIdFor(userId)}`; }
function stateFromDocument(document) { return structuredClone(document.state); }

export function createWorkspaceService(repository) {
  if (!repository) throw new Error("workspace repository is required");
  async function getWorkspace(userId) {
    const ownerId = ownerIdFor(userId);
    const workspaceId = workspaceIdFor(ownerId);
    let document = await repository.get(workspaceId, ownerId);
    if (!document) {
      document = await repository.create(createWorkspaceDocument(workspaceId, ownerId, DEFAULT_STATE, Date.now()));
    }
    return stateFromDocument(document);
  }
  async function getDocument(userId) {
    const ownerId = ownerIdFor(userId);
    const workspaceId = workspaceIdFor(ownerId);
    let document = await repository.get(workspaceId, ownerId);
    if (!document) document = await repository.create(createWorkspaceDocument(workspaceId, ownerId, DEFAULT_STATE, Date.now()));
    return document;
  }
  async function saveWorkspace(userId, patch = {}, expectedRevision) {
    const current = await getDocument(userId);
    const nextState = { ...current.state, ...structuredClone(patch) };
    const expected = expectedRevision == null ? current.revision : Number(expectedRevision);
    const next = nextWorkspaceRevision(current, expected, nextState, Date.now());
    return stateFromDocument(await repository.update(next, expected));
  }
  return { getWorkspace, saveWorkspace, getDocument, schemaVersion: WORKSPACE_SCHEMA_VERSION };
}
