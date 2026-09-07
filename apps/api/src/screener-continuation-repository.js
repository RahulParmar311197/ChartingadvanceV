import { randomUUID } from "node:crypto";

const DEFAULT_TTL_SECONDS = 15 * 60;
const MAX_OWNER_LENGTH = 256;
const MAX_PROVIDER_LENGTH = 128;
const MAX_FINGERPRINT_LENGTH = 256;
const MAX_CURSOR_LENGTH = 4096;

function validateString(value, label, maxLength) {
  if (typeof value !== "string" || value.length === 0 || value.length > maxLength) {
    throw new Error(`${label} must be a non-empty string of at most ${maxLength} characters`);
  }
}

function validateTtl(ttlSeconds) {
  if (!Number.isInteger(ttlSeconds) || ttlSeconds < 1 || ttlSeconds > 24 * 60 * 60) {
    throw new Error("ttlSeconds must be an integer from 1 to 86400");
  }
}

export function createContinuationId() {
  return randomUUID();
}

export class InMemoryScreenerContinuationRepository {
  constructor({ now = () => new Date() } = {}) {
    this.now = now;
    this.rows = new Map();
  }

  async create({ ownerId, requestFingerprint, providerName, providerCursor, ttlSeconds = DEFAULT_TTL_SECONDS }) {
    validateString(ownerId, "ownerId", MAX_OWNER_LENGTH);
    validateString(requestFingerprint, "requestFingerprint", MAX_FINGERPRINT_LENGTH);
    validateString(providerName, "providerName", MAX_PROVIDER_LENGTH);
    validateString(providerCursor, "providerCursor", MAX_CURSOR_LENGTH);
    validateTtl(ttlSeconds);
    const now = this.now();
    const continuationId = createContinuationId();
    this.rows.set(continuationId, {
      continuationId, ownerId, requestFingerprint, providerName, providerCursor,
      expiresAt: new Date(now.getTime() + ttlSeconds * 1000), createdAt: now, updatedAt: now,
    });
    return continuationId;
  }

  async consume({ continuationId, ownerId, requestFingerprint, providerName }) {
    validateString(continuationId, "continuationId", 128);
    validateString(ownerId, "ownerId", MAX_OWNER_LENGTH);
    validateString(requestFingerprint, "requestFingerprint", MAX_FINGERPRINT_LENGTH);
    validateString(providerName, "providerName", MAX_PROVIDER_LENGTH);
    const row = this.rows.get(continuationId);
    if (!row || row.ownerId !== ownerId || row.requestFingerprint !== requestFingerprint || row.providerName !== providerName) return null;
    if (row.expiresAt <= this.now()) {
      this.rows.delete(continuationId);
      return null;
    }
    this.rows.delete(continuationId);
    return { providerCursor: row.providerCursor, expiresAt: row.expiresAt };
  }

  async invalidate(continuationId) {
    validateString(continuationId, "continuationId", 128);
    this.rows.delete(continuationId);
  }
}

export class PostgresScreenerContinuationRepository {
  constructor(pool, { now = () => new Date() } = {}) {
    if (!pool || typeof pool.query !== "function" || typeof pool.connect !== "function") throw new Error("Postgres pool is required");
    this.pool = pool;
    this.now = now;
  }

  async create({ ownerId, requestFingerprint, providerName, providerCursor, ttlSeconds = DEFAULT_TTL_SECONDS }) {
    validateString(ownerId, "ownerId", MAX_OWNER_LENGTH);
    validateString(requestFingerprint, "requestFingerprint", MAX_FINGERPRINT_LENGTH);
    validateString(providerName, "providerName", MAX_PROVIDER_LENGTH);
    validateString(providerCursor, "providerCursor", MAX_CURSOR_LENGTH);
    validateTtl(ttlSeconds);
    const continuationId = createContinuationId();
    const now = this.now();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);
    await this.pool.query(
      `INSERT INTO screener_continuations
       (continuation_id, owner_id, request_fingerprint, provider_name, provider_cursor, expires_at, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$7)`,
      [continuationId, ownerId, requestFingerprint, providerName, providerCursor, expiresAt, now],
    );
    return continuationId;
  }

  async consume({ continuationId, ownerId, requestFingerprint, providerName }) {
    validateString(continuationId, "continuationId", 128);
    validateString(ownerId, "ownerId", MAX_OWNER_LENGTH);
    validateString(requestFingerprint, "requestFingerprint", MAX_FINGERPRINT_LENGTH);
    validateString(providerName, "providerName", MAX_PROVIDER_LENGTH);
    const result = await this.pool.query(
      `DELETE FROM screener_continuations
       WHERE continuation_id=$1 AND owner_id=$2 AND request_fingerprint=$3 AND provider_name=$4 AND expires_at > $5
       RETURNING provider_cursor, expires_at`,
      [continuationId, ownerId, requestFingerprint, providerName, this.now()],
    );
    if (result.rows.length === 0) return null;
    return { providerCursor: result.rows[0].provider_cursor, expiresAt: result.rows[0].expires_at };
  }

  async invalidate(continuationId) {
    validateString(continuationId, "continuationId", 128);
    await this.pool.query("DELETE FROM screener_continuations WHERE continuation_id=$1", [continuationId]);
  }

  async purgeExpired() {
    const result = await this.pool.query("DELETE FROM screener_continuations WHERE expires_at <= $1", [this.now()]);
    return result.rowCount ?? 0;
  }
}
