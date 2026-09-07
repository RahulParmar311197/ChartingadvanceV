import { WebSocketServer } from "ws";
import { generateQuote } from "../../../packages/market-domain/src/demo-core.js";

const port = Number(process.env.MARKET_WS_PORT ?? 8788);
const wss = new WebSocketServer({ port });
let sequence = 0;

function send(socket, event) {
  if (socket.readyState === 1) socket.send(JSON.stringify(event));
}

wss.on("connection", (socket) => {
  send(socket, { type: "status", sequence: ++sequence, timestamp: Date.now(), status: "connected", provider: "demo", message: "Simulated market stream" });
  socket.on("message", (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message?.type !== "subscribe" || !Array.isArray(message.symbols)) return;
      const symbols = [...new Set(message.symbols.filter((symbol) => typeof symbol === "string" && symbol.includes(":")).slice(0, 50))];
      for (const symbol of symbols) {
        send(socket, { type: "quote", sequence: ++sequence, timestamp: Date.now(), quote: generateQuote(symbol) });
      }
    } catch {
      send(socket, { type: "status", sequence: ++sequence, timestamp: Date.now(), status: "degraded", provider: "demo", message: "Invalid subscription message" });
    }
  });
});

console.log(`ChartingadvanceV demo market WebSocket listening on ws://localhost:${port}`);
