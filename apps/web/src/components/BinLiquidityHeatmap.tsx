"use client";

import React from "react";
import { MarketClockState } from "@market-clock/core";
import { ScheduledPositionRange } from "@market-clock/bin-scheduler";

interface BinLiquidityHeatmapProps {
  state: MarketClockState;
  activeBinId: number;
  activePrice: number;
  targetRange: ScheduledPositionRange;
  feeInfo: {
    baseFeeBps: number;
    dynamicFeeBps: number;
    totalFeeBps: number;
  };
  volatilityAccumulator?: number;
}

export const BinLiquidityHeatmap: React.FC<BinLiquidityHeatmapProps> = ({
  state,
  activeBinId,
  activePrice,
  targetRange,
  feeInfo,
  volatilityAccumulator = 0,
}) => {
  // Accent color mapping
  const stateColor = React.useMemo(() => {
    switch (state) {
      case "OPEN":
        return "#E8B34A";
      case "PRE_CLOSE":
        return "#E0793C";
      case "CLOSED":
        return "#3A5CE0";
      case "PRE_OPEN":
      case "COOL_DOWN":
      default:
        return "#2FBF9E";
    }
  }, [state]);

  // Generate 71 display bins centered around active bin (-35 to +35)
  const displayWindowHalf = 35;
  const bins = React.useMemo(() => {
    const list = [];
    for (let offset = -displayWindowHalf; offset <= displayWindowHalf; offset++) {
      const binId = activeBinId + offset;
      const inRange = binId >= targetRange.minBinId && binId <= targetRange.maxBinId;
      const isActive = binId === activeBinId;

      // Modeled Liquidity Weight & Height/Opacity Mapping
      let weight = 0;
      let heightPct = 6;
      let opacity = 0.12;

      if (inRange) {
        if (targetRange.strategyTypeName === "Curve") {
          // Concentrated Gaussian bell curve for Curve strategy (OPEN, COOL_DOWN, PRE_OPEN)
          const sigma = Math.max(3, targetRange.halfWidth * 0.42);
          weight = Math.exp(-Math.pow(offset, 2) / (2 * Math.pow(sigma, 2)));
          // Range from 20% at boundary to 94% at center active peak
          heightPct = Math.round(20 + weight * 74);
          opacity = Math.min(1.0, +(0.38 + weight * 0.58).toFixed(3));
        } else {
          // Flat uniform distribution for Spot strategy (CLOSED, PRE_CLOSE wide)
          weight = 0.52;
          heightPct = 48; // Clean, uniform rectangular shelf of liquidity
          opacity = 0.70;
        }
      } else {
        // Outside managed position: minimal ambient floor
        weight = 0;
        heightPct = 6;
        opacity = 0.12;
      }

      list.push({
        binId,
        offset,
        inRange,
        isActive,
        weight,
        heightPct,
        opacity,
        price: activePrice * Math.pow(1.0025, offset), // 25 bps binStep
      });
    }
    return list;
  }, [activeBinId, activePrice, targetRange]);

  const minPrice = activePrice * Math.pow(1.0025, targetRange.minBinId - activeBinId);
  const maxPrice = activePrice * Math.pow(1.0025, targetRange.maxBinId - activeBinId);
  const spreadPct = ((maxPrice - minPrice) / activePrice) * 100;

  return (
    <div className="bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5),0_1px_1px_0_rgba(255,255,255,0.02)] state-transition">
      {/* Header bar with metrics */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite-800 pb-5">
        <div>
          <span className="text-xs font-mono uppercase tracking-wider text-graphite-500">
            Active DLMM Reference
          </span>
          <div className="flex items-baseline gap-3 mt-1">
            <span className="font-mono text-2xl font-bold text-graphite-100">
              ${activePrice.toFixed(2)}
            </span>
            <span className="font-mono text-xs text-graphite-500">
              Bin ID: <strong className="text-graphite-100">#{activeBinId}</strong>
            </span>
          </div>
        </div>

        {/* Dynamic Fee Engine Telemetry */}
        <div className="bg-graphite-850 border border-graphite-800 px-4 py-2.5 rounded-xl flex items-center gap-4">
          <div>
            <span className="text-[11px] font-mono text-graphite-500 uppercase block">
              Total DLMM Fee
            </span>
            <span className="font-mono text-lg font-bold" style={{ color: stateColor }}>
              {(feeInfo.totalFeeBps / 100).toFixed(2)}%
            </span>
          </div>
          <div className="h-7 w-px bg-graphite-800" />
          <div className="text-xs font-mono text-graphite-500 space-y-0.5">
            <div>
              Base: <span className="text-graphite-100">{(feeInfo.baseFeeBps / 100).toFixed(2)}%</span>
            </div>
            <div>
              Variable:{" "}
              <span className="font-semibold" style={{ color: stateColor }}>
                +{(feeInfo.dynamicFeeBps / 100).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Managed Range Parameters */}
        <div className="text-right">
          <span className="text-xs font-mono uppercase tracking-wider text-graphite-500 block">
            Keeper Position Width
          </span>
          <div className="mt-1 flex items-center gap-2 justify-end">
            <span className="font-mono text-sm font-semibold text-graphite-100">
              [{targetRange.minBinId} ... {targetRange.maxBinId}]
            </span>
            <span
              className="px-2 py-0.5 rounded text-[11px] font-mono font-bold uppercase"
              style={{
                backgroundColor: `${stateColor}1A`,
                color: stateColor,
                border: `1px solid ${stateColor}40`,
              }}
            >
              {targetRange.strategyTypeName}
            </span>
          </div>
          <span className="text-[11px] font-mono text-graphite-500 block mt-0.5">
            ±{targetRange.halfWidth} bins ({targetRange.totalBins} bins • ±{(spreadPct / 2).toFixed(1)}% spread)
          </span>
        </div>
      </div>

      {/* Heatmap visualization container */}
      <div className="mt-6">
        <div className="flex items-center justify-between text-xs font-mono text-graphite-500 mb-2">
          <span>Lower Price Bound: ${minPrice.toFixed(2)}</span>
          <span className="text-graphite-100 font-semibold flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-white" />
            Active Bin #{activeBinId}
          </span>
          <span>Upper Price Bound: ${maxPrice.toFixed(2)}</span>
        </div>

        {/* Heatmap Strip */}
        <div className="relative h-28 bg-graphite-950/80 rounded-xl border border-graphite-800/80 flex items-end gap-1 px-3 py-2 overflow-hidden">
          {bins.map((bin) => {
            return (
              <div
                key={bin.binId}
                className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
              >
                {/* Active marker indicator needle - restrained "you are here" cue */}
                {bin.isActive && (
                  <div className="absolute -top-1.5 flex flex-col items-center pointer-events-none z-10">
                    <span className="text-[9px] leading-none text-white/90 font-mono select-none">▼</span>
                  </div>
                )}

                {/* Bar with 300ms eased transition on height and opacity */}
                <div
                  className="w-full rounded-t-sm"
                  style={{
                    height: `${bin.heightPct}%`,
                    opacity: bin.isActive ? 1.0 : bin.opacity,
                    backgroundColor: bin.isActive
                      ? "#FFFFFF"
                      : bin.inRange
                      ? stateColor
                      : "#232832",
                    boxShadow: bin.isActive ? "0 0 4px rgba(255, 255, 255, 0.4)" : "none",
                    transition:
                      "height 300ms cubic-bezier(0.16, 1, 0.3, 1), opacity 300ms cubic-bezier(0.16, 1, 0.3, 1), background-color 300ms ease-out",
                  }}
                />

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center pointer-events-none z-20">
                  <div className="bg-graphite-800 border border-graphite-700 px-2 py-1 rounded text-[10px] font-mono text-graphite-100 whitespace-nowrap shadow-lg">
                    Bin #{bin.binId} • ${bin.price.toFixed(2)}
                    <br />
                    Weight: {(bin.weight * 100).toFixed(1)}% • {bin.inRange ? `Managed (${targetRange.strategyTypeName})` : "Unallocated"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Legend & Mechanism Note */}
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono text-graphite-500">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: stateColor }} />
              Managed DLMM Liquidity ({targetRange.strategyTypeName})
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2B313D]" />
              Empty / Stale Range
            </span>
          </div>

          <div>
            <span>Volatility Accumulator (VA): </span>
            <strong className="text-graphite-100">{volatilityAccumulator.toLocaleString()}</strong>
            <span className="text-graphite-500">
              {" "}• {state === "OPEN" ? "Decayed to 0 (Fee Floor)" : state === "COOL_DOWN" ? "Decaying to Floor" : "Elevated"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
