import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { createPostgresPoolFromEnv } from "./postgres-paper-repository.js";

const migrationDir = fileURLToPath(new URL("../migrations/", import.meta.url));

export async function migrateDatabase(pool) {
  if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") throw new Error("PostgreSQL pool is required");
  await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
  const applied = new Set((await pool.query("SELECT version FROM schema_migrations ORDER BY version")).rows.map((row) => row.version));
  const files = (await readdir(migrationDir)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
  for (const file of files) {
    const version = file.split("_")[0];
    if (applied.has(version)) continue;
    const sql = await readFile(join(migrationDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query("INSERT INTO schema_migrations(version) VALUES($1)", [version]);
      await client.query("COMMIT");
    } catch (error) {
      try { await client.query("ROLLBACK"); } catch { /* preserve original migration failure */ }
      throw error;
    } finally { client.release(); }
  }
}

async function main() {
  const pool = await createPostgresPoolFromEnv();
  try { await migrateDatabase(pool); }
  finally { await pool.end(); }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => { console.error(error); process.exitCode = 1; });
}
