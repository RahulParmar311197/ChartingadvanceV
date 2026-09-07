import { useEffect, useState } from "react";
import { cancelPaperOrder, fetchPaperOrders, fetchPaperPortfolio, replacePaperOrder, submitPaperOrder } from "./paper-trading.js";

export default function TradingPanel({ symbol, quote, apiUrl, onClose }) {
  const [portfolio, setPortfolio] = useState(null);
  const [orders, setOrders] = useState([]);
  const [side, setSide] = useState("buy");
  const [type, setType] = useState("market");
  const [quantity, setQuantity] = useState("1");
  const [limitPrice, setLimitPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const refresh = async () => {
    try {
      const [nextPortfolio, nextOrders] = await Promise.all([fetchPaperPortfolio(apiUrl), fetchPaperOrders(apiUrl)]);
      setPortfolio(nextPortfolio);
      setOrders(nextOrders.filter((order) => order.status === "accepted"));
    } catch (error) { setMessage(error.message); }
  };
  useEffect(() => { refresh(); }, [apiUrl]);

  const orderInput = () => ({ symbolId: symbol.symbol, side, type, quantity: Number(quantity), ...(limitPrice ? { limitPrice: Number(limitPrice) } : {}), ...(stopPrice ? { stopPrice: Number(stopPrice) } : {}) });
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setMessage("");
    try { const result = await submitPaperOrder(orderInput(), apiUrl); setPortfolio(result.portfolio); setMessage(result.fill ? `Filled ${result.fill.quantity} @ ${result.fill.price.toFixed(2)}` : result.risk?.reason ?? "Order accepted"); await refresh(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const cancel = async (orderId) => {
    setBusy(true); setMessage("");
    try { await cancelPaperOrder(orderId, apiUrl); setMessage(`Cancelled ${orderId}`); await refresh(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };
  const replace = async (order) => {
    const nextQuantity = Number(window.prompt("Replacement quantity", String(order.quantity)));
    if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) return;
    const nextLimit = window.prompt("Replacement limit price", order.limitPrice == null ? "" : String(order.limitPrice));
    const nextStop = window.prompt("Replacement stop price", order.stopPrice == null ? "" : String(order.stopPrice));
    const replacement = { quantity: nextQuantity, ...(nextLimit ? { limitPrice: Number(nextLimit) } : {}), ...(nextStop ? { stopPrice: Number(nextStop) } : {}) };
    setBusy(true); setMessage("");
    try { await replacePaperOrder(order.id, replacement, apiUrl); setMessage(`Replaced ${order.id}`); await refresh(); }
    catch (error) { setMessage(error.message); } finally { setBusy(false); }
  };

  return <section className="trading-panel">
    <div className="trading-panel-header"><strong>Paper Trading</strong><button onClick={onClose}>×</button></div>
    <div className="trading-panel-warning">Simulation only · no broker or real-money execution</div>
    <form onSubmit={submit} className="order-form">
      <div className="order-symbol"><strong>{symbol.symbol}</strong><span>{quote ? quote.last.toFixed(2) : "No quote"}</span></div>
      <div className="order-toggle"><button type="button" className={side === "buy" ? "active" : ""} onClick={() => setSide("buy")}>Buy</button><button type="button" className={side === "sell" ? "active" : ""} onClick={() => setSide("sell")}>Sell</button></div>
      <label>Order type<select value={type} onChange={(event) => setType(event.target.value)}><option value="market">Market</option><option value="limit">Limit</option><option value="stop">Stop</option><option value="stop_limit">Stop Limit</option></select></label>
      <label>Quantity<input inputMode="decimal" min="0" step="any" value={quantity} onChange={(event) => setQuantity(event.target.value)} /></label>
      {(type === "limit" || type === "stop_limit") && <label>Limit price<input inputMode="decimal" min="0" step="any" value={limitPrice} onChange={(event) => setLimitPrice(event.target.value)} /></label>}
      {(type === "stop" || type === "stop_limit") && <label>Stop price<input inputMode="decimal" min="0" step="any" value={stopPrice} onChange={(event) => setStopPrice(event.target.value)} /></label>}
      <button className="submit-order" disabled={busy || !quantity || Number(quantity) <= 0}>{busy ? "Submitting…" : `Submit ${side}`}</button>
    </form>
    {message && <div className="trading-message">{message}</div>}
    {portfolio && <div className="portfolio"><div><span>Cash</span><strong>{portfolio.account.cash.toFixed(2)} {portfolio.account.currency}</strong></div><div><span>Equity</span><strong>{portfolio.account.equity.toFixed(2)}</strong></div><div><span>Buying power</span><strong>{portfolio.account.buyingPower.toFixed(2)}</strong></div><div><span>Positions</span><strong>{portfolio.positions.length}</strong></div></div>}
    {portfolio?.positions?.length > 0 && <div className="positions"><strong>Positions</strong>{portfolio.positions.map((position) => <div key={position.symbolId}><span>{position.symbolId}</span><span>{position.quantity} @ {position.averagePrice.toFixed(2)}</span></div>)}</div>}
    <div className="paper-orders"><strong>Open Orders</strong>{orders.length === 0 && <span>No open orders</span>}{orders.map((order) => <div key={order.id}><span>{order.symbolId} · {order.side} {order.quantity} · {order.type}</span><span><button disabled={busy} onClick={() => cancel(order.id)}>Cancel</button><button disabled={busy} onClick={() => replace(order)}>Replace</button></span></div>)}</div>
  </section>;
}
