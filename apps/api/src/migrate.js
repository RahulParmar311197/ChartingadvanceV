import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { createPostgresPoolFromEnv } from "./postgres-paper-repository.js";

const migrationDir = new URL("../migrations/", import.meta.url);

async function migrate() {
  const pool = await createPostgresPoolFromEnv();
  try {
    await pool.query("CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())");
    const applied = new Set((await pool.query("SELECT version FROM schema_migrations ORDER BY version")).rows.map((row) => row.version));
    const files = (await readdir(migrationDir.pathname)).filter((name) => /^\d+_.+\.sql$/.test(name)).sort();
    for (const file of files) {
      const version = file.split("_")[0];
      if (applied.has(version)) continue;
      const sql = await readFile(join(migrationDir.pathname, file), "utf8");
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query("INSERT INTO schema_migrations(version) VALUES($1)", [version]);
        await client.query("COMMIT");
        console.log(`Applied migration ${file}`);
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    }
  } finally { await pool.end(); }
}

migrate().catch((error) => { console.error(error); process.exitCode = 1; });
