import { WebSocketServer } from "ws";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";
import { normalizeSubscription } from "./realtime-validation.js";

const NODE_ENV = process.env.NODE_ENV ?? "development";
const port = Number(process.env.MARKET_WS_PORT ?? 8788);
const maxConnections = Number(process.env.MARKET_WS_MAX_CONNECTIONS ?? 500);
const maxPayload = 8 * 1024;
const heartbeatMs = 30_000;
const wss = new WebSocketServer({ port, maxPayload });
let sequence = 0;
let connectionCount = 0;

function send(socket, event) {
  if (socket.readyState === 1) socket.send(JSON.stringify(event));
}

function status(socket, statusValue, message) {
  send(socket, { type: "status", sequence: ++sequence, timestamp: Date.now(), status: statusValue, provider: "demo", message });
}

wss.on("connection", (socket, request) => {
  if (connectionCount >= maxConnections) {
    status(socket, "degraded", "WebSocket connection capacity reached");
    socket.close(1013, "capacity reached");
    return;
  }

  connectionCount += 1;
  socket.isAlive = true;
  socket.on("pong", () => { socket.isAlive = true; });
  socket.once("close", () => { connectionCount = Math.max(0, connectionCount - 1); });
  socket.on("error", () => { socket.isAlive = false; });

  status(socket, "connected", NODE_ENV === "production" ? "Market stream connected" : "Simulated market stream");
  socket.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      const symbols = normalizeSubscription(message);
      if (!symbols || symbols.length === 0) {
        status(socket, "degraded", "Invalid subscription message");
        return;
      }
      for (const symbol of symbols) {
        send(socket, { type: "quote", sequence: ++sequence, timestamp: Date.now(), quote: generateQuote(symbol) });
      }
    } catch {
      status(socket, "degraded", "Invalid subscription message");
    }
  });
});

const heartbeat = setInterval(() => {
  for (const socket of wss.clients) {
    if (!socket.isAlive) {
      socket.terminate();
      continue;
    }
    socket.isAlive = false;
    socket.ping();
  }
}, heartbeatMs);
heartbeat.unref?.();

async function shutdown(signal) {
  clearInterval(heartbeat);
  console.log(`ChartingadvanceV market WebSocket shutting down (${signal})`);
  await new Promise((resolve) => wss.close(resolve));
}
process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
process.on("uncaughtException", (error) => { console.error(error); void shutdown("uncaughtException").finally(() => process.exit(1)); });
process.on("unhandledRejection", (error) => { console.error(error); void shutdown("unhandledRejection").finally(() => process.exit(1)); });

console.log(`ChartingadvanceV ${NODE_ENV === "production" ? "market" : "demo market"} WebSocket listening on ws://localhost:${port}`);
