# MarketClock — Hackathon Progress & Technical Dossier

**Track**: Meteora Hackathon (Stocklana Track)  
**Submission Deadline**: September 25, 4:00 PM ET  
**Repository**: `MarketClock`  
**Access Note**: If this repository is kept private during evaluation, read access is granted to GitHub user: `@dannxbt`.

---

## 1. Hackathon Judging Criteria Alignment

### 1. Depth of Meteora Integration
MarketClock is built directly upon Meteora DLMM's discrete bin architecture (`lb_clmm` program `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo`) and its native dynamic-fee volatility accumulator engine:
$$\text{variable\_fee} = \left\lceil \frac{\text{variable\_fee\_control} \times (V_A \times \text{bin\_step})^2}{100{,}000{,}000{,}000} \right\rceil$$
Where the volatility accumulator $V_A$ updates as:
$$V_A = \min(V_{\text{ref}} + |\text{index\_ref} - \text{active\_id}| \times 10{,}000, \text{max\_volatility\_accumulator})$$
Rather than treating DLMM as a passive AMM or a one-time pool creation endpoint, MarketClock dynamically restructures bin liquidity ranges (`minBinId`, `maxBinId`) and strategy distributions (`StrategyType.Curve` vs. `StrategyType.Spot`) around the reference market's pricing cycle. It deliberately synchronizes liquidity tightening with the pool's on-chain `decay_period` to ensure variable fees reach the base fee floor during normal market hours without exposing thin positions to opening shocks.

### 2. Technical Execution
- **Modular Monorepo Architecture**: Clean separation of concerns across `packages/market-clock` (pure mathematical state machine & 2026 NYSE calendar), `packages/bin-scheduler` (monotonic bin positioning & overshoot prevention), `packages/keeper` (automated Solana DLMM rebalancer & structured JSON event logger), and `packages/backtest` (historical/synthetic simulation engine).
- **Comprehensive Test Coverage**: Rigorous test suites testing edge cases: 2026 NYSE holidays, DST transition boundaries (Eastern Time spring forward/fall back), monotonic widening during the `PRE_CLOSE` auction window, and mandatory `COOL_DOWN` phasing prior to `OPEN`.
- **Structured Telemetry**: Full machine-readable event logging (`rebalance-log.json`) recording old vs. new bin ranges, active bin price, dynamic fee rate, and on-chain transaction signatures.

### 3. Originality and Taste
Unlike pre-graduation curve-anchoring projects that only focus on the DBC bonding curve phase prior to migration, MarketClock addresses the **post-graduation, ongoing LP-side dilemma**. Once a tokenized equity graduates to an AMM, it trades 24/7, while the underlying equity exchange (NYSE/Nasdaq) is closed nights, weekends, and holidays. Static LPs are perpetually vulnerable to informed arbitrageurs picking off stale quotes when news breaks off-hours. MarketClock is a permanent, subscription-ready liquidity management service for graduated pools.

### 4. Impact Potential
Any tokenized-stock, tokenized-ETF, or RWA pool on Meteora DLMM can subscribe to MarketClock as an active keeper service. By protecting LPs from adverse selection while maximizing fee capture during peak volume hours, MarketClock creates deep, sustainable liquidity for Real-World Assets on Solana.

### 5. Traction / Volume
Demonstrates real on-chain execution with a live Meteora DLMM pool on Solana devnet (`118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo`), producing genuine transaction signatures for bin reallocations and displaying a side-by-side comparative performance panel against a static-range baseline.

---

## 2. Development Status & Roadmap

| Phase | Component | Status | Verification / Output |
| :--- | :--- | :--- | :--- |
| **Phase 1** | `packages/market-clock` | Complete | 9 Vitest tests passing (DST 2026, NYSE Holidays, Cool-Down Invariant) |
| **Phase 2** | `packages/bin-scheduler` | Complete | 8 Vitest tests passing (Monotonic widening, DLMM strategy mapping, overshoot check) |
| **Phase 3** | `packages/keeper` | Complete | Live Devnet DLMM integration (`118MVR...Mo`), real rebalance cycles & `rebalance-log.json` |
| **Phase 4** | `packages/backtest` | Complete | Friday close $\to$ Monday open gap simulation (+$483.41 net PnL advantage) |
| **Phase 5** | `apps/web` Hero Dial + Heatmap | Complete | 24H SVG Dial, dynamic glow, live DLMM bin distribution strip |
| **Phase 6** | `apps/web` Ticker + Impact Panel | Complete | Machine-readable keeper telemetry feed, side-by-side comparative bars |

---

## 3. Real On-Chain vs. Synthetic Disclosures

- **Solana Devnet Pool**: Real on-chain DLMM interactions utilizing `@meteora-ag/dlmm` and Solana Web3 JS targeting program `LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo` and pool `118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo`.
- **Backtest Scenario**: Clearly labeled **SYNTHETIC SIMULATION** modeling a realistic Friday 16:00 ET close through Monday 09:30 ET gap with $+3.8\%$ off-market news shock, comparing toxic flow loss on a static 60-bin LP against MarketClock's wide-spread defense.

---

## 4. Exact Demo Commands

```bash
# 1. Run all unit tests across the entire monorepo
npm test

# 2. Run the MarketClock keeper bot against Solana Devnet
npm run start:keeper

# 3. Run the comparative backtest simulation
npm run run:backtest

# 4. Launch the web dashboard
npm run dev:web
# Open http://localhost:3000 in your browser
```
