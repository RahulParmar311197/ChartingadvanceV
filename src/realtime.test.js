import { afterEach, describe, expect, it, vi } from "vitest";
import { connectMarketStream } from "./realtime.js";

class FakeSocket {
  static instances = [];
  constructor() {
    this.listeners = new Map();
    this.sent = [];
    this.closed = false;
    FakeSocket.instances.push(this);
  }
  addEventListener(type, handler) {
    const handlers = this.listeners.get(type) ?? [];
    handlers.push(handler);
    this.listeners.set(type, handlers);
  }
  emit(type, value) {
    for (const handler of this.listeners.get(type) ?? []) handler(value);
  }
  send(value) { this.sent.push(value); }
  close() { this.closed = true; }
}

describe("connectMarketStream", () => {
  afterEach(() => {
    vi.useRealTimers();
    FakeSocket.instances = [];
    vi.unstubAllGlobals();
  });

  it("subscribes and ignores duplicate or out-of-order sequence events", () => {
    vi.stubGlobal("WebSocket", FakeSocket);
    const events = [];
    const statuses = [];
    const stop = connectMarketStream({ url: "ws://example.test", symbols: ["NASDAQ:AAPL"], onEvent: (event) => events.push(event), onStatus: (status) => statuses.push(status) });
    const socket = FakeSocket.instances[0];
    socket.emit("open");
    expect(JSON.parse(socket.sent[0])).toEqual({ type: "subscribe", symbols: ["NASDAQ:AAPL"] });
    socket.emit("message", { data: JSON.stringify({ type: "quote", sequence: 2, quote: { symbol: "NASDAQ:AAPL", last: 1 } }) });
    socket.emit("message", { data: JSON.stringify({ type: "quote", sequence: 2, quote: { symbol: "NASDAQ:AAPL", last: 2 } }) });
    socket.emit("message", { data: JSON.stringify({ type: "quote", sequence: 1, quote: { symbol: "NASDAQ:AAPL", last: 0 } }) });
    socket.emit("message", { data: JSON.stringify({ type: "status", sequence: 3, status: "live" }) });
    expect(events).toHaveLength(2);
    expect(events[0].sequence).toBe(2);
    expect(events[1].sequence).toBe(3);
    expect(statuses).toContain("connected");
    expect(statuses).toContain("live");
    stop();
    expect(socket.closed).toBe(true);
  });

  it("reconnects with bounded exponential backoff after close", () => {
    vi.useFakeTimers();
    vi.stubGlobal("WebSocket", FakeSocket);
    const stop = connectMarketStream({ url: "ws://example.test", symbols: [], onStatus: vi.fn() });
    const first = FakeSocket.instances[0];
    first.emit("close");
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(499);
    expect(FakeSocket.instances).toHaveLength(1);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(2);
    const second = FakeSocket.instances[1];
    second.emit("close");
    vi.advanceTimersByTime(999);
    expect(FakeSocket.instances).toHaveLength(2);
    vi.advanceTimersByTime(1);
    expect(FakeSocket.instances).toHaveLength(3);
    stop();
  });
});
