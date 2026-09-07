const DEFAULT_RATE_LIMIT = 120;
const DEFAULT_RATE_WINDOW_MS = 60_000;

function positiveInteger(value, fallback) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function createRateLimiter({ limit = DEFAULT_RATE_LIMIT, windowMs = DEFAULT_RATE_WINDOW_MS } = {}) {
  const maxRequests = positiveInteger(limit, DEFAULT_RATE_LIMIT);
  const window = positiveInteger(windowMs, DEFAULT_RATE_WINDOW_MS);
  const buckets = new Map();

  return {
    check(key, now = Date.now()) {
      const current = buckets.get(key);
      if (!current || now - current.startedAt >= window) {
        buckets.set(key, { startedAt: now, count: 1 });
        return { allowed: true, remaining: maxRequests - 1, retryAfterSeconds: 0 };
      }
      if (current.count >= maxRequests) {
        return {
          allowed: false,
          remaining: 0,
          retryAfterSeconds: Math.max(1, Math.ceil((window - (now - current.startedAt)) / 1000)),
        };
      }
      current.count += 1;
      return { allowed: true, remaining: maxRequests - current.count, retryAfterSeconds: 0 };
    },
    purge(now = Date.now()) {
      for (const [key, bucket] of buckets) if (now - bucket.startedAt >= window) buckets.delete(key);
    },
  };
}

export function getClientAddress(req) {
  const forwarded = req.headers["x-forwarded-for"];
  if (typeof forwarded === "string" && forwarded.length > 0) return forwarded.split(",")[0].trim().slice(0, 128);
  return req.socket?.remoteAddress ?? "unknown";
}

export function parseCorsOrigins(value, { production = false } = {}) {
  if (typeof value !== "string" || value.trim() === "") {
    if (production) throw new Error("CORS_ORIGINS is required in production");
    return [];
  }
  const origins = value.split(",").map((origin) => origin.trim()).filter(Boolean);
  for (const origin of origins) {
    const parsed = new URL(origin);
    if (!/^https?:$/.test(parsed.protocol)) throw new Error("CORS_ORIGINS must contain http(s) origins");
  }
  return [...new Set(origins)];
}

export function createSecurityHeaders({ origin, production = false } = {}) {
  const headers = {
    "x-content-type-options": "nosniff",
    "x-frame-options": "DENY",
    "referrer-policy": "no-referrer",
    "permissions-policy": "camera=(), microphone=(), geolocation=()",
    "cross-origin-resource-policy": "same-site",
  };
  if (production) headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["access-control-allow-credentials"] = "true";
    headers["vary"] = "Origin";
  }
  return headers;
}

export function productionConfigErrors(env = process.env) {
  if (env.NODE_ENV !== "production") return [];
  const errors = [];
  if (env.AUTH_MODE !== "authenticated") errors.push("AUTH_MODE=authenticated is required for production; demo identity is not accepted");
  if (env.MARKET_DATA_MODE !== "live") errors.push("MARKET_DATA_MODE=live is required for production");
  if (env.FUNDAMENTALS_DATA_MODE !== "live") errors.push("FUNDAMENTALS_DATA_MODE=live is required for production");
  if (env.PAPER_PERSISTENCE !== "postgres") errors.push("PAPER_PERSISTENCE=postgres is required for production");
  if (!env.DATABASE_URL) errors.push("DATABASE_URL is required for production");
  if (!env.SCREENER_CURSOR_ENCRYPTION_KEY) errors.push("SCREENER_CURSOR_ENCRYPTION_KEY is required for production");
  try { parseCorsOrigins(env.CORS_ORIGINS, { production: true }); } catch (error) { errors.push(error.message); }
  return errors;
}

export function assertProductionConfig(env = process.env) {
  const errors = productionConfigErrors(env);
  if (errors.length) throw new Error(`Production configuration invalid: ${errors.join("; ")}`);
}
