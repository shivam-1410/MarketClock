"use client";

import React from "react";
import {
  getMarketClockState,
  createNyseDate,
  MarketClockStateResult,
} from "@market-clock/core";
import { computeTargetBinRange } from "@market-clock/bin-scheduler";
import { MarketClockDial } from "@/components/MarketClockDial";
import { BinLiquidityHeatmap } from "@/components/BinLiquidityHeatmap";
import { SessionTicker, RebalanceLogItem } from "@/components/SessionTicker";
import { ImpactPanel, BacktestData } from "@/components/ImpactPanel";
import { Footer } from "@/components/Footer";
import { NavigationTabs, ActiveTabId } from "@/components/NavigationTabs";
import { DbcLaunchpadStudio } from "@/components/DbcLaunchpadStudio";
import { PresetMarketplace } from "@/components/PresetMarketplace";
import { DevDataStreamPanel } from "@/components/DevDataStreamPanel";

// Fallback seed telemetry in case initial fetch is pending
const INITIAL_LOGS_FALLBACK: RebalanceLogItem[] = [
  {
    id: "reb_seed_005",
    timestamp: new Date().toISOString(),
    state: "PRE_CLOSE",
    nyseTimeFormatted: "2026-09-22 15:52:00 ET",
    activeBin: 1500,
    activePrice: 184.25,
    oldRange: [1475, 1525],
    newRange: [1455, 1545],
    strategyType: "Spot",
    txSignature: "4wS9pL3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mDevnetMC",
    baseFeeBps: 15,
    dynamicFeeBps: 9,
    totalFeeBps: 24,
    reason: "Pre-close auction expansion: widening from ±25 to ±45 bins ahead of closing bell.",
    status: "CONFIRMED",
    poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
    explorerUrl: "https://explorer.solana.com/tx/4wS9pL3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mDevnetMC?cluster=devnet",
  },
  {
    id: "reb_seed_004",
    timestamp: new Date(Date.now() - 3600000).toISOString(),
    state: "OPEN",
    nyseTimeFormatted: "2026-09-22 11:15:00 ET",
    activeBin: 1500,
    activePrice: 184.25,
    oldRange: [1465, 1535],
    newRange: [1490, 1510],
    strategyType: "Curve",
    txSignature: "5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zXDevnetMC",
    baseFeeBps: 15,
    dynamicFeeBps: 0,
    totalFeeBps: 15,
    reason: "Cool-down elapsed and volatility accumulator at 0: tightened to full OPEN Curve (±10 bins). Dynamic fee at floor.",
    status: "CONFIRMED",
    poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
    explorerUrl: "https://explorer.solana.com/tx/5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zXDevnetMC?cluster=devnet",
  },
  {
    id: "reb_seed_003",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    state: "COOL_DOWN",
    nyseTimeFormatted: "2026-09-22 09:33:00 ET",
    activeBin: 1500,
    activePrice: 184.25,
    oldRange: [1460, 1540],
    newRange: [1465, 1535],
    strategyType: "Curve",
    txSignature: "3hN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vDevnetMC",
    baseFeeBps: 15,
    dynamicFeeBps: 8,
    totalFeeBps: 23,
    reason: "Cool-down phase active: maintaining medium width (±35 bins) during decay_period window.",
    status: "CONFIRMED",
    poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
    explorerUrl: "https://explorer.solana.com/tx/3hN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vDevnetMC?cluster=devnet",
  },
  {
    id: "reb_seed_002",
    timestamp: new Date(Date.now() - 8000000).toISOString(),
    state: "PRE_OPEN",
    nyseTimeFormatted: "2026-09-22 09:30:00 ET",
    activeBin: 1500,
    activePrice: 184.25,
    oldRange: [1420, 1580],
    newRange: [1460, 1540],
    strategyType: "Curve",
    txSignature: "2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tDevnetMC",
    baseFeeBps: 15,
    dynamicFeeBps: 12,
    totalFeeBps: 27,
    reason: "Market Reopen Tick: snapped to buffer width (±40 bins, Curve) rather than razor-thin OPEN to absorb open imbalances.",
    status: "CONFIRMED",
    poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
    explorerUrl: "https://explorer.solana.com/tx/2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tDevnetMC?cluster=devnet",
  },
  {
    id: "reb_seed_001",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    state: "CLOSED",
    nyseTimeFormatted: "2026-09-21 16:00:00 ET",
    activeBin: 1500,
    activePrice: 184.25,
    oldRange: [1450, 1550],
    newRange: [1420, 1580],
    strategyType: "Spot",
    txSignature: "1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bDevnetMC",
    baseFeeBps: 15,
    dynamicFeeBps: 15,
    totalFeeBps: 30,
    reason: "Reference market closed: deployed defensive wide Spot (±80 bins, ~±12%) to immunize LPs against overnight news gaps.",
    status: "CONFIRMED",
    poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
    explorerUrl: "https://explorer.solana.com/tx/1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bDevnetMC?cluster=devnet",
  },
];

const BACKTEST_FALLBACK: BacktestData = {
  scenarioName: "SYNTHETIC SCENARIO: Friday Close to Monday Open Gap",
  disclaimer:
    "HONEST DISCLOSURE: Synthetic model calibrated against Meteora DLMM discrete bin math and dynamic-fee volatility accumulator mechanics. Labeled synthetic per hackathon guidelines.",
  tokenPair: "TSLA / USDC (Tokenized Equity DLMM)",
  timeWindow: "Friday 16:00 ET (Close) -> Monday 09:30 ET (Open) [65.5 Hours]",
  priceMovement: {
    startPrice: 184.5,
    endPrice: 191.51,
    priceShockPct: 3.8,
    shockEvent: "Off-market Sunday macro/earnings surprise triggering +3.8% fair value repricing.",
  },
  marketClock: {
    strategyName: "MarketClock Schedule-Aware Reshaper",
    initialTvlUsd: 100000,
    finalTvlUsd: 100483.41,
    feesEarnedUsd: 665.0,
    feesEarnedPct: 0.67,
    adverseSelectionLossUsd: 19.99,
    adverseSelectionLossPct: 0.02,
    netPnlUsd: 645.01,
    netPnlPct: 0.65,
    maxDrawdownPct: 0.02,
    capitalEfficiencyRatio: 33.27,
  },
  staticBaseline: {
    strategyName: "Static Concentrated LP (±25 Bins Baseline)",
    initialTvlUsd: 100000,
    finalTvlUsd: 99838.4,
    feesEarnedUsd: 262.5,
    feesEarnedPct: 0.26,
    adverseSelectionLossUsd: 100.9,
    adverseSelectionLossPct: 0.1,
    netPnlUsd: 161.6,
    netPnlPct: 0.16,
    maxDrawdownPct: 0.1,
    capitalEfficiencyRatio: 2.6,
  },
  delta: {
    netPnlAdvantageUsd: 483.41,
    netPnlAdvantagePct: 0.49,
    adverseSelectionAvoidedUsd: 80.91,
    feeImprovementUsd: 402.5,
  },
};

export default function Home() {
  const [activeTab, setActiveTab] = React.useState<ActiveTabId>("reshaper");
  const [selectedTimeMode, setSelectedTimeMode] = React.useState<string>("LIVE");
  const [currentTime, setCurrentTime] = React.useState<Date>(new Date());
  const [logs, setLogs] = React.useState<RebalanceLogItem[]>(INITIAL_LOGS_FALLBACK);
  const [backtestData, setBacktestData] = React.useState<BacktestData>(BACKTEST_FALLBACK);
  const [activeBinId, setActiveBinId] = React.useState<number>(1500);
  const [activePrice, setActivePrice] = React.useState<number>(184.25);

  // Poll real clock if LIVE mode
  React.useEffect(() => {
    if (selectedTimeMode !== "LIVE") return;

    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, [selectedTimeMode]);

  // Compute simulated date when mode button is clicked
  const effectiveDate = React.useMemo(() => {
    if (selectedTimeMode === "LIVE") {
      return currentTime;
    }
    // Simulation baseline: Wednesday April 15, 2026 (Regular session)
    switch (selectedTimeMode) {
      case "OPEN":
        return createNyseDate(2026, 4, 15, 11, 30, 0);
      case "PRE_CLOSE":
        return createNyseDate(2026, 4, 15, 15, 52, 0);
      case "CLOSED":
        return createNyseDate(2026, 4, 15, 20, 0, 0);
      case "PRE_OPEN":
        return createNyseDate(2026, 4, 15, 9, 30, 0);
      case "COOL_DOWN":
        return createNyseDate(2026, 4, 15, 9, 35, 0);
      default:
        return currentTime;
    }
  }, [selectedTimeMode, currentTime]);

  // Evaluate pure TS state machine
  const stateResult: MarketClockStateResult = React.useMemo(() => {
    return getMarketClockState(effectiveDate);
  }, [effectiveDate]);

  // Compute target bin range based on state
  const targetRange = React.useMemo(() => {
    return computeTargetBinRange(stateResult, activeBinId, 25);
  }, [stateResult, activeBinId]);

  // Dynamic fee calculation based on state
  const feeInfo = React.useMemo(() => {
    const baseFeeBps = 15; // 0.15% base fee
    let dynamicFeeBps = 0;
    let volatilityAccumulator = 0;

    if (stateResult.state === "OPEN") {
      dynamicFeeBps = 0; // Decayed to base fee floor
      volatilityAccumulator = 0;
    } else if (stateResult.state === "PRE_CLOSE") {
      const factor = stateResult.preCloseWideningFactor ?? 0.5;
      dynamicFeeBps = Math.round(15 * factor);
      volatilityAccumulator = Math.round(18000 * factor);
    } else if (stateResult.state === "CLOSED") {
      dynamicFeeBps = 15;
      volatilityAccumulator = 24000;
    } else if (stateResult.state === "COOL_DOWN") {
      dynamicFeeBps = 8;
      volatilityAccumulator = 8500;
    } else if (stateResult.state === "PRE_OPEN") {
      dynamicFeeBps = 12;
      volatilityAccumulator = 15000;
    }

    return {
      baseFeeBps,
      dynamicFeeBps,
      totalFeeBps: baseFeeBps + dynamicFeeBps,
      volatilityAccumulator,
    };
  }, [stateResult]);

  // Handle simulate button clicks: smoothly glide active bin & prepend animated keeper log
  const handleSelectTimeMode = React.useCallback(
    (mode: string) => {
      setSelectedTimeMode(mode);
      if (mode === "LIVE") return;

      let simDate = currentTime;
      let simBin = 1500;
      let simPrice = 184.25;
      let reasonText = "";

      switch (mode) {
        case "OPEN":
          simDate = createNyseDate(2026, 4, 15, 11, 30, 0);
          simBin = 1502;
          simPrice = 184.45;
          reasonText = "Simulated tick: Transitioned to OPEN. Concentrated liquidity reshaped into Curve (±10 bins) around active price.";
          break;
        case "PRE_CLOSE":
          simDate = createNyseDate(2026, 4, 15, 15, 52, 0);
          simBin = 1498;
          simPrice = 183.85;
          reasonText = "Simulated tick: Transitioned to PRE_CLOSE. Volatility widening factor active, expanding range towards closing bell.";
          break;
        case "CLOSED":
          simDate = createNyseDate(2026, 4, 15, 20, 0, 0);
          simBin = 1500;
          simPrice = 184.25;
          reasonText = "Simulated tick: Reference market closed. Deployed defensive wide Spot (±80 bins) to immunize against gaps.";
          break;
        case "PRE_OPEN":
          simDate = createNyseDate(2026, 4, 15, 9, 30, 0);
          simBin = 1501;
          simPrice = 184.30;
          reasonText = "Simulated tick: PRE_OPEN auction imbalance buffer. Widened Curve with elevated dynamic fee.";
          break;
        case "COOL_DOWN":
          simDate = createNyseDate(2026, 4, 15, 9, 35, 0);
          simBin = 1503;
          simPrice = 184.55;
          reasonText = "Simulated tick: COOL_DOWN decay phase. Waiting for on-chain volatility accumulator to reset before narrowing.";
          break;
        default:
          break;
      }

      // Smoothly glide active bin in heatmap
      setActiveBinId(simBin);
      setActivePrice(simPrice);

      // Compute simulated state & range for newly prepended log item
      const simState = getMarketClockState(simDate);
      const simRange = computeTargetBinRange(simState, simBin, 25);
      const feeBps = simState.state === "OPEN" ? 15 : simState.state === "CLOSED" ? 30 : 25;

      const newLogEntry: RebalanceLogItem = {
        id: `reb_sim_${Date.now()}`,
        timestamp: simDate.toISOString(),
        state: simState.state,
        nyseTimeFormatted: simDate.toLocaleString("en-US", { timeZone: "America/New_York", hour12: false }) + " ET",
        activeBin: simBin,
        activePrice: simPrice,
        oldRange: [targetRange.minBinId, targetRange.maxBinId],
        newRange: [simRange.minBinId, simRange.maxBinId],
        strategyType: simRange.strategyTypeName as "Curve" | "Spot",
        txSignature: Array.from({ length: 44 }, () => "abcdefghijklmnopqrstuvwxyz0123456789"[Math.floor(Math.random() * 36)]).join(""),
        baseFeeBps: 15,
        dynamicFeeBps: feeBps - 15,
        totalFeeBps: feeBps,
        reason: reasonText,
        status: "CONFIRMED",
        poolAddress: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
        explorerUrl: "https://explorer.solana.com/address/118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo?cluster=devnet",
      };

      setLogs((prev) => [newLogEntry, ...prev.slice(0, 24)]);
    },
    [currentTime, targetRange]
  );

  // Fetch telemetry logs from static JSON or API
  React.useEffect(() => {
    fetch("/data/rebalance-log.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && Array.isArray(data) && data.length > 0) {
          setLogs(data);
          if (data[0].activeBin) setActiveBinId(data[0].activeBin);
          if (data[0].activePrice) setActivePrice(data[0].activePrice);
        }
      })
      .catch(() => {});

    fetch("/data/backtest-results.json")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.marketClock) {
          setBacktestData(data);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <main className="min-h-screen flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-graphite-800/80 bg-graphite-950/80 backdrop-blur sticky top-0 z-50 px-6 py-4">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {/* Clock icon */}
            <div className="w-8 h-8 rounded-lg bg-graphite-850 border border-graphite-700 flex items-center justify-center">
              <span className="font-mono text-base text-state-open font-bold">⏱</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-mono text-base font-bold tracking-tight text-graphite-100">
                  MarketClock
                </h1>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-state-open/10 border border-state-open/30 text-state-open font-semibold">
                  Meteora DLMM • Stocklana
                </span>
              </div>
              <span className="text-xs font-sans text-graphite-500">
                Schedule-Aware Liquidity Manager for Tokenized Stocks
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-graphite-900 border border-graphite-800">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse-slow" />
              <span className="text-graphite-100">Solana Devnet</span>
              <span className="text-graphite-500">•</span>
              <span className="text-graphite-500">Pool: 118MVR...Mo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Unified Navigation Hub Tabs */}
      <NavigationTabs activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Main Content Container */}
      <div className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full space-y-16 md:space-y-20">
        {activeTab === "reshaper" && (
          <>
            {/* Section 1: Hero Radial Dial (Floating prominently with generous whitespace) */}
            <section id="hero-clock" className="pt-4 pb-6 md:pt-6 md:pb-10 flex flex-col items-center">
              <div className="text-center mb-6">
                <h2 className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
                  Section 1 • 24h NYSE Market State Engine
                </h2>
                <p className="text-xs font-sans text-graphite-500 mt-0.5">
                  Pure deterministic state machine aligned to Wall Street market sessions and trading hours.
                </p>
              </div>
              <MarketClockDial
                stateResult={stateResult}
                selectedTimeMode={selectedTimeMode}
                onSelectTimeMode={handleSelectTimeMode}
              />
            </section>

            {/* Section 2: Active Bin Liquidity Heatmap */}
            <section id="bin-heatmap">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
                    Section 2 • Live DLMM Liquidity Profile
                  </h2>
                  <p className="text-xs font-sans text-graphite-500 mt-0.5">
                    Dynamic bin distribution automatically reshaped around Wall Street session hours.
                  </p>
                </div>
                <div className="text-right font-mono text-xs text-graphite-500">
                  Bin Step: <span className="text-graphite-100">25 bps (0.25%)</span>
                </div>
              </div>

              <BinLiquidityHeatmap
                state={stateResult.state}
                activeBinId={activeBinId}
                activePrice={activePrice}
                targetRange={targetRange}
                feeInfo={feeInfo}
                volatilityAccumulator={feeInfo.volatilityAccumulator}
              />
            </section>

            {/* Two-Column Grid: Session Ticker & Impact Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Section 3: Session Ticker / Structured Keeper Telemetry */}
              <section id="session-ticker" className="flex flex-col">
                <div className="mb-3">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
                    Section 3 • Keeper Rebalance Event Log
                  </h2>
                  <p className="text-xs font-sans text-graphite-500 mt-0.5">
                    Structured machine-readable feed recorded to <code>rebalance-log.json</code>.
                  </p>
                </div>
                <SessionTicker logs={logs} />
              </section>

              {/* Section 4: Impact Panel / Comparative Simulation */}
              <section id="impact-panel" className="flex flex-col">
                <div className="mb-3">
                  <h2 className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
                    Section 4 • Capital Protection Impact
                  </h2>
                  <p className="text-xs font-sans text-graphite-500 mt-0.5">
                    MarketClock dynamic reshaper vs. static 60-bin concentrated LP baseline.
                  </p>
                </div>
                <ImpactPanel data={backtestData} />
              </section>
            </div>
          </>
        )}

        {/* Tab 2: DBC Launchpad Studio (Novel Curves & End-to-End Stack Flow) */}
        {activeTab === "launchpad" && <DbcLaunchpadStudio />}

        {/* Tab 3: DBC Config Preset Marketplace */}
        {activeTab === "marketplace" && <PresetMarketplace />}

        {/* Tab 4: Developer Data Streams & SDK Tooling */}
        {activeTab === "developer" && <DevDataStreamPanel />}
      </div>

      {/* Section 5: Footer with Program IDs & Mechanism Details */}
      <Footer />
    </main>
  );
}
