import { WORKSPACE_SCHEMA_VERSION } from "../../../packages/chart-engine/src/workspace-persistence.ts";

function workspaceRow(row) {
  if (!row) return null;
  return {
    schemaVersion: Number(row.schema_version),
    workspaceId: row.workspace_id,
    ownerId: row.owner_id,
    revision: Number(row.revision),
    updatedAt: new Date(row.updated_at).getTime(),
    state: structuredClone(row.state),
  };
}

export class PostgresWorkspaceRepository {
  constructor(pool) {
    if (!pool || typeof pool.query !== "function") throw new Error("Postgres pool is required");
    this.pool = pool;
  }

  async get(workspaceId, ownerId) {
    const result = await this.pool.query(
      "SELECT workspace_id,owner_id,schema_version,revision,state,updated_at FROM workspaces WHERE workspace_id=$1 AND owner_id=$2",
      [workspaceId, ownerId],
    );
    return workspaceRow(result.rows[0]);
  }

  async create(document, now = new Date(document.updatedAt)) {
    if (document.schemaVersion !== WORKSPACE_SCHEMA_VERSION) throw new Error("unsupported workspace schema version");
    const result = await this.pool.query(
      "INSERT INTO workspaces(workspace_id,owner_id,schema_version,revision,state,updated_at,created_at) VALUES($1,$2,$3,0,$4::jsonb,$5,$5) RETURNING workspace_id,owner_id,schema_version,revision,state,updated_at",
      [document.workspaceId, document.ownerId, document.schemaVersion, JSON.stringify(document.state), now],
    );
    return workspaceRow(result.rows[0]);
  }

  async update(document, expectedRevision, now = new Date(document.updatedAt)) {
    if (document.schemaVersion !== WORKSPACE_SCHEMA_VERSION) throw new Error("unsupported workspace schema version");
    const result = await this.pool.query(
      "UPDATE workspaces SET schema_version=$3,state=$4::jsonb,revision=revision+1,updated_at=$5 WHERE workspace_id=$1 AND owner_id=$2 AND revision=$6 RETURNING workspace_id,owner_id,schema_version,revision,state,updated_at",
      [document.workspaceId, document.ownerId, document.schemaVersion, JSON.stringify(document.state), now, expectedRevision],
    );
    if (!result.rowCount) throw new Error("workspace revision conflict");
    return workspaceRow(result.rows[0]);
  }
}
