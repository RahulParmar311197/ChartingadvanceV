import { WebSocketServer } from "ws";
import { DeterministicDemoMarketDataProvider } from "../../../packages/market-domain/src/demo-provider.ts";

const provider = new DeterministicDemoMarketDataProvider();
const port = Number(process.env.MARKET_WS_PORT ?? 8788);
const wss = new WebSocketServer({ port });
let sequence = 0;

wss.on("connection", (socket) => {
  socket.send(JSON.stringify({ type: "status", sequence: ++sequence, timestamp: Date.now(), status: "connected", provider: "demo", message: "Simulated market stream" }));

  socket.on("message", async (raw) => {
    try {
      const message = JSON.parse(raw.toString());
      if (message?.type !== "subscribe" || !Array.isArray(message.symbols)) return;
      const symbols = message.symbols.filter((symbol) => typeof symbol === "string" && symbol.includes(":"));
      for (const symbol of symbols) {
        const quote = await provider.getQuote(symbol);
        if (socket.readyState === socket.OPEN) {
          socket.send(JSON.stringify({ type: "quote", sequence: ++sequence, timestamp: Date.now(), quote }));
        }
      }
    } catch {
      socket.send(JSON.stringify({ type: "status", sequence: ++sequence, timestamp: Date.now(), status: "degraded", provider: "demo", message: "Invalid subscription message" }));
    }
  });
});

console.log(`ChartingadvanceV demo market WebSocket listening on ws://localhost:${port}`);
