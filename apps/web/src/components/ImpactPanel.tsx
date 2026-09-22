"use client";

import React from "react";

export interface BacktestData {
  scenarioName: string;
  disclaimer: string;
  tokenPair: string;
  timeWindow: string;
  priceMovement: {
    startPrice: number;
    endPrice: number;
    priceShockPct: number;
    shockEvent: string;
  };
  marketClock: {
    strategyName: string;
    initialTvlUsd: number;
    finalTvlUsd: number;
    feesEarnedUsd: number;
    feesEarnedPct: number;
    adverseSelectionLossUsd: number;
    adverseSelectionLossPct: number;
    netPnlUsd: number;
    netPnlPct: number;
    maxDrawdownPct: number;
    capitalEfficiencyRatio: number;
  };
  staticBaseline: {
    strategyName: string;
    initialTvlUsd: number;
    finalTvlUsd: number;
    feesEarnedUsd: number;
    feesEarnedPct: number;
    adverseSelectionLossUsd: number;
    adverseSelectionLossPct: number;
    netPnlUsd: number;
    netPnlPct: number;
    maxDrawdownPct: number;
    capitalEfficiencyRatio: number;
  };
  delta: {
    netPnlAdvantageUsd: number;
    netPnlAdvantagePct: number;
    adverseSelectionAvoidedUsd: number;
    feeImprovementUsd: number;
  };
}

interface ImpactPanelProps {
  data: BacktestData;
}

export const ImpactPanel: React.FC<ImpactPanelProps> = ({ data }) => {
  const { marketClock, staticBaseline, delta, priceMovement } = data;

  return (
    <div className="bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5),0_1px_1px_0_rgba(255,255,255,0.02)] state-transition flex flex-col">
      {/* Header with Disclosure */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite-800 pb-4">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-graphite-500 block">
            Comparative Gap Analysis (Friday Close ➔ Monday Open)
          </span>
          <h2 className="font-sans text-lg font-bold text-graphite-100 mt-0.5">
            MarketClock Reshaper vs. Static 60-Bin DLMM LP
          </h2>
        </div>

        {/* Honest Disclosure Tag */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400 uppercase tracking-wide">
            Simulated Backtest Scenario
          </span>
        </div>
      </div>

      {/* Scenario Parameters Bar */}
      <div className="mt-4 p-3 bg-graphite-950/80 border border-graphite-850 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div>
          <span className="text-graphite-500">Asset: </span>
          <span className="text-graphite-100 font-semibold">{data.tokenPair}</span>
        </div>
        <div>
          <span className="text-graphite-500">Weekend Shock: </span>
          <span className="text-state-open font-semibold">+{priceMovement.priceShockPct}%</span>
          <span className="text-graphite-500 text-[11px]"> (${priceMovement.startPrice} ➔ ${priceMovement.endPrice})</span>
        </div>
        <div>
          <span className="text-graphite-500">Window: </span>
          <span className="text-graphite-100">65.5 Hours (Closed)</span>
        </div>
      </div>

      {/* Two Thin Comparison Bars (Readable in under 3 seconds) */}
      <div className="mt-6 space-y-5">
        {/* Metric 1: Adverse Selection / Toxic Flow Loss Avoided */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-graphite-500">1. Adverse Selection (Toxic Flow Loss)</span>
            <span className="text-state-cooldown font-semibold">
              Avoided +${delta.adverseSelectionAvoidedUsd.toFixed(2)} in Toxic Drain
            </span>
          </div>

          <div className="space-y-1.5">
            {/* MarketClock Bar */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-mono text-graphite-100 font-medium truncate">
                MarketClock:
              </span>
              <div className="flex-1 h-3 bg-graphite-950 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-state-cooldown rounded-full state-transition"
                  style={{ width: `${Math.max(4, (marketClock.adverseSelectionLossUsd / staticBaseline.adverseSelectionLossUsd) * 100)}%` }}
                />
              </div>
              <span className="w-28 text-right text-xs font-mono text-state-cooldown font-semibold">
                -${marketClock.adverseSelectionLossUsd.toFixed(2)} (-{marketClock.adverseSelectionLossPct}%)
              </span>
            </div>

            {/* Static Baseline Bar */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-mono text-graphite-500 truncate">
                Static LP:
              </span>
              <div className="flex-1 h-3 bg-graphite-950 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-500/80 rounded-full w-full state-transition" />
              </div>
              <span className="w-28 text-right text-xs font-mono text-red-400 font-semibold">
                -${staticBaseline.adverseSelectionLossUsd.toFixed(2)} (-{staticBaseline.adverseSelectionLossPct}%)
              </span>
            </div>
          </div>
        </div>

        {/* Metric 2: Fee Capture Efficiency */}
        <div>
          <div className="flex items-center justify-between text-xs font-mono mb-1.5">
            <span className="text-graphite-500">2. DLMM Fee Capture (Base + Dynamic Volatility)</span>
            <span className="text-state-open font-semibold">
              +${delta.feeImprovementUsd.toFixed(2)} Fee Revenue Boost (+153%)
            </span>
          </div>

          <div className="space-y-1.5">
            {/* MarketClock Bar */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-mono text-graphite-100 font-medium truncate">
                MarketClock:
              </span>
              <div className="flex-1 h-3 bg-graphite-950 rounded-full overflow-hidden flex">
                <div className="h-full bg-state-open rounded-full w-full state-transition" />
              </div>
              <span className="w-28 text-right text-xs font-mono text-state-open font-semibold">
                +${marketClock.feesEarnedUsd.toFixed(2)} (+{marketClock.feesEarnedPct}%)
              </span>
            </div>

            {/* Static Baseline Bar */}
            <div className="flex items-center gap-3">
              <span className="w-24 text-[11px] font-mono text-graphite-500 truncate">
                Static LP:
              </span>
              <div className="flex-1 h-3 bg-graphite-950 rounded-full overflow-hidden flex">
                <div
                  className="h-full bg-graphite-700 rounded-full state-transition"
                  style={{ width: `${Math.round((staticBaseline.feesEarnedUsd / marketClock.feesEarnedUsd) * 100)}%` }}
                />
              </div>
              <span className="w-28 text-right text-xs font-mono text-graphite-500">
                +${staticBaseline.feesEarnedUsd.toFixed(2)} (+{staticBaseline.feesEarnedPct}%)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Net Summary Banner */}
      <div className="mt-6 p-4 rounded-xl bg-graphite-950 border border-graphite-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono text-graphite-500 uppercase block">
            Net Weekend Return Preserved (Single Gap)
          </span>
          <span className="font-mono text-2xl font-bold text-state-open">
            +${delta.netPnlAdvantageUsd.toFixed(2)}{" "}
            <span className="text-sm text-graphite-500 font-normal">
              (+{delta.netPnlAdvantagePct.toFixed(2)}% on $100k TVL)
            </span>
          </span>
        </div>

        <div className="text-right text-[11px] font-mono text-graphite-500 max-w-sm font-sans leading-tight">
          By deploying wide Spot during the closed period, MarketClock prevents toxic flow arbitrage while capturing elevated dynamic fees.
        </div>
      </div>
    </div>
  );
};
