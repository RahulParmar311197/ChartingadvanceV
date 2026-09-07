import { describe, expect, it } from 'vitest';
import { assertWorkspaceOwner, createWorkspaceDocument, nextWorkspaceRevision } from './workspace-persistence';

describe('workspace persistence contract', () => {
  const state = { symbolId: 'NASDAQ:AAPL', interval: '1D', drawings: [] };

  it('creates versioned documents with owner binding', () => {
    const document = createWorkspaceDocument('ws-1', 'user-1', state, 100);
    expect(document.schemaVersion).toBe(1);
    expect(document.revision).toBe(0);
    expect(document.ownerId).toBe('user-1');
  });

  it('rejects cross-owner access', () => {
    const document = createWorkspaceDocument('ws-1', 'user-1', state, 100);
    expect(() => assertWorkspaceOwner(document, 'user-2')).toThrow('workspace authorization failed');
  });

  it('requires the current revision and monotonic timestamp', () => {
    const document = createWorkspaceDocument('ws-1', 'user-1', state, 100);
    const next = nextWorkspaceRevision(document, 0, { ...state, drawings: [{ id: 'd1' }] }, 110);
    expect(next.revision).toBe(1);
    expect(() => nextWorkspaceRevision(next, 0, state, 120)).toThrow('workspace revision conflict');
    expect(() => nextWorkspaceRevision(next, 1, state, 90)).toThrow('invalid workspace timestamp');
  });
});
