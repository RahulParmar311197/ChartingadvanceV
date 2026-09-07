export async function runBacktestRequest(apiUrl, request) {
  if (!apiUrl) throw new Error("Backtesting requires the API URL");
  const response = await fetch(`${apiUrl.replace(/\/$/, "")}/v1/backtest`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(request) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload?.error?.message || `Backtest API returned ${response.status}`);
  return payload;
}
