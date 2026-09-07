import { describe, expect, it, vi } from "vitest";
import { createWorkspaceService } from "./workspace-service.js";

const state = { watchlist: ["NASDAQ:AAPL"], activeSymbol: "NASDAQ:AAPL", interval: "1D" };

function repository(initial = null) {
  let document = initial;
  return {
    get: vi.fn(async () => document),
    create: vi.fn(async (next) => { document = structuredClone(next); return structuredClone(document); }),
    update: vi.fn(async (next) => { document = { ...structuredClone(next), revision: document.revision + 1 }; return structuredClone(document); }),
  };
}

describe("workspace application service", () => {
  it("creates an owned default document and exposes its state", async () => {
    const repo = repository();
    const service = createWorkspaceService(repo);
    await expect(service.getDocument("user-1")).resolves.toMatchObject({ workspaceId: "workspace:user-1", ownerId: "user-1", revision: 0, schemaVersion: 1, state: expect.objectContaining({ activeSymbol: "NASDAQ:AAPL" }) });
    expect(repo.create).toHaveBeenCalledTimes(1);
  });

  it("updates state using the caller's expected revision", async () => {
    const repo = repository();
    const service = createWorkspaceService(repo);
    await service.getDocument("user-1");
    const saved = await service.saveWorkspace("user-1", { ...state, interval: "4H" }, 0);
    expect(saved).toEqual(expect.objectContaining({ revision: 1, state: { ...state, interval: "4H" } }));
    expect(repo.update.mock.calls[0][1]).toBe(0);
  });

  it("preserves legacy workspace validation while persisting", async () => {
    const repo = repository();
    const service = createWorkspaceService(repo);
    await service.getDocument("user-1");
    const saved = await service.saveWorkspace("user-1", { watchlist: ["bad", "NASDAQ:MSFT", "NASDAQ:MSFT"], activeSymbol: "bad", interval: "invalid" }, 0);
    expect(saved.state).toEqual({ watchlist: ["NASDAQ:MSFT"], activeSymbol: "NASDAQ:MSFT", interval: "1D" });
  });

  it("rejects a stale revision before repository mutation", async () => {
    const document = { schemaVersion: 1, workspaceId: "workspace:user-1", ownerId: "user-1", revision: 3, updatedAt: Date.now(), state };
    const repo = repository(document);
    const service = createWorkspaceService(repo);
    await expect(service.saveWorkspace("user-1", { interval: "1D" }, 2)).rejects.toThrow("workspace revision conflict");
    expect(repo.update).not.toHaveBeenCalled();
  });
});
