export function createQuoteEvent(sequence, quote, timestamp = Date.now()) {
  return { type: "quote", sequence, timestamp, quote };
}

export function createStatusEvent(sequence, status, message, timestamp = Date.now()) {
  return {
    type: "status",
    sequence,
    timestamp,
    status,
    provider: "demo",
    ...(message ? { message } : {}),
  };
}

export function isNewerMarketEvent(previousSequence, event) {
  return event.sequence > previousSequence;
}
