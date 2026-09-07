export function connectMarketStream({ url, symbols, onEvent, onStatus }) {
  if (!url || typeof WebSocket === "undefined") return () => {};
  let socket;
  let stopped = false;
  let reconnectTimer;
  let attempt = 0;
  let lastSequence = 0;

  const connect = () => {
    if (stopped) return;
    try { socket = new WebSocket(url); } catch { scheduleReconnect(); return; }
    socket.addEventListener("open", () => {
      attempt = 0;
      onStatus?.("connected");
      socket.send(JSON.stringify({ type: "subscribe", symbols }));
    });
    socket.addEventListener("message", (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (!Number.isFinite(payload.sequence) || payload.sequence <= lastSequence) return;
        lastSequence = payload.sequence;
        onEvent?.(payload);
        if (payload.type === "status") onStatus?.(payload.status);
      } catch { onStatus?.("degraded"); }
    });
    socket.addEventListener("error", () => onStatus?.("degraded"));
    socket.addEventListener("close", () => { onStatus?.("disconnected"); scheduleReconnect(); });
  };

  const scheduleReconnect = () => {
    if (stopped || reconnectTimer) return;
    const delay = Math.min(5000, 500 * (2 ** attempt));
    attempt += 1;
    reconnectTimer = setTimeout(() => { reconnectTimer = undefined; connect(); }, delay);
  };

  connect();
  return () => {
    stopped = true;
    clearTimeout(reconnectTimer);
    reconnectTimer = undefined;
    socket?.close();
  };
}
