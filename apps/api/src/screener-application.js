import { createHash } from "node:crypto";
import { runScreener } from "../../../packages/screener-engine/src/provider.ts";
import { createContinuationId, InMemoryScreenerContinuationRepository } from "./screener-continuation-repository.js";

const DEFAULT_PROVIDER = "demo";
const DEFAULT_TTL_SECONDS = 15 * 60;

function stableJson(value) {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableJson).join(",")}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`).join(",`)}}`;
}

export function screenerRequestFingerprint(request) {
  return createHash("sha256").update(stableJson({ symbols: request.symbols ?? [], query: request.query ?? undefined, limit: request.limit ?? request.query?.limit ?? 25 })).digest("hex");
}

export function createScreenerApplication({ provider, providerName = DEFAULT_PROVIDER, continuationRepository = new InMemoryScreenerContinuationRepository(), ttlSeconds = DEFAULT_TTL_SECONDS, now = () => new Date() }) {
  if (!provider || typeof provider.getFundamentals !== "function") throw new Error("fundamentals provider is required");

  return {
    async run(request = {}) {
      const fingerprint = screenerRequestFingerprint(request);
      let providerCursor;
      if (request.cursor !== undefined) {
        const continuation = await continuationRepository.consume({
          continuationId: request.cursor,
          ownerId: request.ownerId ?? "anonymous",
          requestFingerprint: fingerprint,
          providerName,
        });
        if (!continuation) throw new Error("invalid or expired screener cursor");
        providerCursor = continuation.providerCursor;
      }

      const result = await runScreener(provider, { ...request, cursor: providerCursor });
      if (result.nextCursor === undefined) return { ...result, nextCursor: undefined };

      const continuationId = createContinuationId();
      // Use the repository's create path for validation/storage; the generated id is intentionally
      // not used as storage input because repositories own their identifier generation.
      const storedId = await continuationRepository.create({
        ownerId: request.ownerId ?? "anonymous",
        requestFingerprint: fingerprint,
        providerName,
        providerCursor: result.nextCursor,
        ttlSeconds,
        now: now(),
        continuationId,
      });
      return { ...result, nextCursor: storedId };
    },
  };
}
