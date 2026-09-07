# Changelog

## 2026-09-07
- Added interval-aware Sharpe annualization to the strategy engine for 1m/5m/15m/1H/4H/1D/1W/1M intervals.
- Added explicit annualization metadata to the backtest application response.
- Added regression coverage for intraday, daily, weekly, and monthly period assumptions.

## 2026-09-07
- Expanded the application backtest allowlist with a second deterministic `candle-direction` strategy while retaining the no-arbitrary-code execution boundary.
- Added regression coverage for the new strategy and exposed the fixed strategy choices in the Strategy Tester UI.
- Updated the UI disclosure to make the fixed, deterministic, allowlisted strategy boundary explicit.

## 2026-09-07
- Replaced raw PostgreSQL duplicate-order exception handling with repository-level `insertOrderIfAbsent` semantics using `ON CONFLICT (account_id,order_id) DO NOTHING`.
- Paper-order submission and replacement now consume the atomic insert result, so a concurrent duplicate cannot abort the active PostgreSQL transaction.
- Added a real PostgreSQL integration race covering two concurrent submissions with the same client order ID and verifying exactly one fill, one deterministic duplicate rejection, one stored order, and a usable losing transaction.
- Updated in-memory repository behavior and application regression coverage to match the atomic repository contract.

## 2026-09-07
- Added a browser strategy-tester client for the application backtest endpoint.
- Added a Strategy Tester workspace panel with deterministic Buy & Hold controls, return/P&L/drawdown/trade metrics, equity visualization, and benchmark comparison display.
- Strategy Tester loads the current symbol/interval candle window and sends it through the API application boundary; no arbitrary client-side strategy execution is exposed.
- Added browser-client regression coverage for successful requests and structured API errors.
- Added explicit simulation limitations for candle-level backtesting in the UI.
