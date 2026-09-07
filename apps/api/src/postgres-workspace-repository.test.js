import { describe, expect, it, vi } from "vitest";
import { PostgresWorkspaceRepository } from "./postgres-workspace-repository.js";

function pool(handler) { return { query: vi.fn(handler) }; }

describe("PostgresWorkspaceRepository", () => {
  it("loads only a workspace owned by the requested identity", async () => {
    const db = pool(async () => ({ rows: [{ workspace_id: "w1", owner_id: "u1", schema_version: "1", revision: "4", state: { activeSymbol: "NASDAQ:AAPL" }, updated_at: "2026-09-07T08:00:00Z" }] }));
    await expect(new PostgresWorkspaceRepository(db).get("w1", "u1")).resolves.toMatchObject({ workspaceId: "w1", ownerId: "u1", revision: 4, schemaVersion: 1 });
    expect(db.query).toHaveBeenCalledWith(expect.stringContaining("workspace_id=$1 AND owner_id=$2"), ["w1", "u1"]);
  });

  it("rejects stale optimistic workspace updates", async () => {
    const db = pool(async () => ({ rowCount: 0, rows: [] }));
    const document = { schemaVersion: 1, workspaceId: "w1", ownerId: "u1", revision: 4, updatedAt: 1000, state: { activeSymbol: "NASDAQ:AAPL" } };
    await expect(new PostgresWorkspaceRepository(db).update(document, 3)).rejects.toThrow("workspace revision conflict");
  });

  it("rejects unsupported workspace schemas", async () => {
    const db = pool(async () => ({ rowCount: 1, rows: [] }));
    const document = { schemaVersion: 99, workspaceId: "w1", ownerId: "u1", revision: 0, updatedAt: 1000, state: {} };
    await expect(new PostgresWorkspaceRepository(db).create(document)).rejects.toThrow("unsupported workspace schema version");
  });
});
