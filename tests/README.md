# Verification

Meaningful domain behavior is covered with Vitest tests colocated with the relevant package.

Current coverage targets:
- deterministic market-data reproducibility and OHLCV invariants
- realtime event sequence ordering
- SMA, EMA, and RSI warmup/calculation behavior
- invalid indicator period validation

The repository currently does not have a committed lockfile or a fully configured monorepo test runner. CI therefore verifies the root application build while package-test execution is being integrated into the workspace configuration.
