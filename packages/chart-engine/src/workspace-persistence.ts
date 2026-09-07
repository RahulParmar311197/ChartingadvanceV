export const WORKSPACE_SCHEMA_VERSION = 1 as const;

export interface WorkspaceState {
  symbolId: string;
  interval: string;
  drawings: unknown[];
  panes?: unknown[];
  layout?: unknown;
}

export interface WorkspaceDocument {
  schemaVersion: typeof WORKSPACE_SCHEMA_VERSION;
  workspaceId: string;
  ownerId: string;
  revision: number;
  updatedAt: number;
  state: WorkspaceState;
}

export interface WorkspaceRepository {
  get(workspaceId: string, ownerId: string): Promise<WorkspaceDocument | null>;
  create(document: WorkspaceDocument): Promise<WorkspaceDocument>;
  update(document: WorkspaceDocument, expectedRevision: number): Promise<WorkspaceDocument>;
}

export function createWorkspaceDocument(workspaceId: string, ownerId: string, state: WorkspaceState, now: number): WorkspaceDocument {
  if (!workspaceId || !ownerId) throw new Error("workspaceId and ownerId are required");
  if (!Number.isFinite(now)) throw new Error("invalid workspace timestamp");
  return { schemaVersion: WORKSPACE_SCHEMA_VERSION, workspaceId, ownerId, revision: 0, updatedAt: now, state: structuredClone(state) };
}

export function assertWorkspaceOwner(document: WorkspaceDocument, ownerId: string): void {
  if (document.ownerId !== ownerId) throw new Error("workspace authorization failed");
}

export function nextWorkspaceRevision(document: WorkspaceDocument, expectedRevision: number, state: WorkspaceState, now: number): WorkspaceDocument {
  if (document.revision !== expectedRevision) throw new Error("workspace revision conflict");
  if (!Number.isFinite(now) || now < document.updatedAt) throw new Error("invalid workspace timestamp");
  assertWorkspaceOwner(document, document.ownerId);
  return { ...document, revision: expectedRevision + 1, updatedAt: now, state: structuredClone(state) };
}
