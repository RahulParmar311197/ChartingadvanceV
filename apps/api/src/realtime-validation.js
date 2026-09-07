const SYMBOL_PATTERN = /^[^:\s]+:[^:\s]+$/;
const MAX_SUBSCRIPTION_SYMBOLS = 50;

export function normalizeSubscription(message) {
  if (!message || typeof message !== "object" || message.type !== "subscribe" || !Array.isArray(message.symbols)) {
    return null;
  }
  return [...new Set(
    message.symbols
      .filter((symbol) => typeof symbol === "string" && SYMBOL_PATTERN.test(symbol))
      .slice(0, MAX_SUBSCRIPTION_SYMBOLS),
  )];
}
