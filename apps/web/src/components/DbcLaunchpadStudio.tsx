"use client";

import React from "react";
import {
  DbcCurveConfig,
  DbcCurveType,
  generateDbcCurvePoints,
  evaluateDbcGraduation,
} from "@market-clock/bin-scheduler";

const EQUITY_ASSETS = [
  {
    symbol: "xTSLA",
    name: "Tesla Inc. (Tokenized)",
    catalog: "xStocks",
    refPrice: 184.25,
    reserve: "USDC",
    defaultCurve: "SIGMOID" as DbcCurveType,
    targetTvl: 100000,
    supply: 1000000,
  },
  {
    symbol: "xNVDA",
    name: "NVIDIA Corp. (Tokenized)",
    catalog: "Ondo RFQ",
    refPrice: 128.50,
    reserve: "USDC",
    defaultCurve: "FLAT" as DbcCurveType,
    targetTvl: 75000,
    supply: 500000,
  },
  {
    symbol: "bTSLA",
    name: "Backpack TSLA Onchain",
    catalog: "Backpack Onchain",
    refPrice: 184.25,
    reserve: "SOL",
    defaultCurve: "EXPONENTIAL" as DbcCurveType,
    targetTvl: 150000,
    supply: 2000000,
  },
  {
    symbol: "xSPY",
    name: "S&P 500 ETF (Tokenized)",
    catalog: "Stocklana",
    refPrice: 550.00,
    reserve: "USDC",
    defaultCurve: "LONG" as DbcCurveType,
    targetTvl: 120000,
    supply: 1500000,
  },
];

export const DbcLaunchpadStudio: React.FC = () => {
  const [selectedAssetIdx, setSelectedAssetIdx] = React.useState<number>(0);
  const selectedAsset = EQUITY_ASSETS[selectedAssetIdx];

  const [curveType, setCurveType] = React.useState<DbcCurveType>(selectedAsset.defaultCurve);
  const [soldPercentage, setSoldPercentage] = React.useState<number>(68);
  const [marketStateSim, setMarketStateSim] = React.useState<"OPEN" | "CLOSED">("OPEN");

  // Synchronize default curve when asset changes
  React.useEffect(() => {
    setCurveType(selectedAsset.defaultCurve);
  }, [selectedAsset]);

  const config: DbcCurveConfig = React.useMemo(() => {
    let initialPrice = selectedAsset.refPrice * 0.90;
    let targetPrice = selectedAsset.refPrice * 1.15;
    let steepness = 9.0;

    if (curveType === "FLAT") {
      initialPrice = selectedAsset.refPrice * 0.96;
      targetPrice = selectedAsset.refPrice * 1.04;
      steepness = 1.1;
    } else if (curveType === "EXPONENTIAL") {
      initialPrice = selectedAsset.refPrice * 0.50;
      targetPrice = selectedAsset.refPrice * 2.10;
      steepness = 2.6;
    } else if (curveType === "LONG") {
      initialPrice = selectedAsset.refPrice * 0.85;
      targetPrice = selectedAsset.refPrice * 1.25;
      steepness = 3.5;
    }

    return {
      id: `cfg_${selectedAsset.symbol.toLowerCase()}`,
      name: `${selectedAsset.symbol} ${curveType} Bonding Curve`,
      curveType,
      description: `Configured for ${selectedAsset.name} via ${selectedAsset.catalog}`,
      initialPriceUsd: +initialPrice.toFixed(2),
      targetPriceUsd: +targetPrice.toFixed(2),
      graduationTargetTvlUsd: selectedAsset.targetTvl,
      totalSupply: selectedAsset.supply,
      steepness,
      reserveToken: selectedAsset.reserve as "USDC" | "SOL",
      baseFeeBps: curveType === "FLAT" ? 15 : 25,
      dynamicFeeFloorBps: curveType === "EXPONENTIAL" ? 40 : 20,
      targetEquitySymbol: selectedAsset.symbol,
      equityCatalog: selectedAsset.catalog as any,
    };
  }, [selectedAsset, curveType]);

  const curvePoints = React.useMemo(() => {
    return generateDbcCurvePoints(config, 40);
  }, [config]);

  // Current simulation point based on slider
  const currentRatio = soldPercentage / 100;
  const currentSimTvl = config.graduationTargetTvlUsd * currentRatio;
  const graduationMetrics = React.useMemo(() => {
    return evaluateDbcGraduation(config, currentSimTvl, marketStateSim);
  }, [config, currentSimTvl, marketStateSim]);

  // SVG Chart bounds
  const minPrice = Math.min(...curvePoints.map((p) => p.priceUsd));
  const maxPrice = Math.max(...curvePoints.map((p) => p.priceUsd));
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 30, bottom: 30, left: 55 };

  const getSvgX = (supplyPct: number) => {
    return padding.left + (supplyPct / 100) * (svgWidth - padding.left - padding.right);
  };

  const getSvgY = (price: number) => {
    const range = maxPrice - minPrice || 1;
    const norm = (price - minPrice) / range;
    return svgHeight - padding.bottom - norm * (svgHeight - padding.top - padding.bottom);
  };

  const pathD = React.useMemo(() => {
    return curvePoints
      .map((pt, i) => {
        const x = getSvgX(pt.supplyPct);
        const y = getSvgY(pt.priceUsd);
        return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
      })
      .join(" ");
  }, [curvePoints, minPrice, maxPrice]);

  const activeX = getSvgX(soldPercentage);
  const activePoint = curvePoints[Math.min(curvePoints.length - 1, Math.round((soldPercentage / 100) * (curvePoints.length - 1)))];
  const activeY = getSvgY(activePoint ? activePoint.priceUsd : minPrice);

  return (
    <div className="space-y-12">
      {/* Section Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
            Section 2 • DBC Launchpad Studio & Novel Curves
          </span>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 font-bold uppercase">
            Equity-Tuned Price Discovery
          </span>
        </div>
        <p className="text-xs font-sans text-graphite-400">
          Price discovery architecture for tokenized equities (xStocks, Backpack Onchain, Ondo RFQ) moving seamlessly into Meteora DLMM and DAMM v2.
        </p>
      </div>

      {/* Asset Catalog Selector Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-graphite-900 border border-[#232834] shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)]">
        <div>
          <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-500 font-medium block">
            Target Tokenized Equity Catalog
          </span>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {EQUITY_ASSETS.map((asset, idx) => (
              <button
                key={asset.symbol}
                onClick={() => setSelectedAssetIdx(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-2 ${
                  selectedAssetIdx === idx
                    ? "bg-graphite-800 border border-graphite-700 text-white font-bold shadow-md"
                    : "bg-graphite-950/60 border border-graphite-850 text-graphite-400 hover:text-white"
                }`}
              >
                <span>{asset.symbol}</span>
                <span className="text-[10px] text-graphite-500 font-sans">({asset.catalog})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Reference Price Anchor Badge */}
        <div className="text-right">
          <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-500 font-medium block">
            Pyth Reference Anchor
          </span>
          <div className="flex items-baseline gap-2 justify-end mt-1 font-mono">
            <span className="text-xl font-bold text-white">${selectedAsset.refPrice.toFixed(2)}</span>
            <span className="text-xs text-graphite-400 font-sans">USD</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-mono">Live Pyth Oracle Feed</span>
        </div>
      </div>

      {/* Main Studio Grid: Curve Designer & End-to-End Stack Flow */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Interactive Curve Simulator (7 cols) */}
        <div className="lg:col-span-7 bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite-800 pb-4 mb-5">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-500 font-medium block">
                  Novel DBC Curve Configuration
                </span>
                <h3 className="font-mono text-sm font-semibold text-graphite-200 mt-0.5">
                  {config.name}
                </h3>
              </div>

              {/* Curve Type Selector Buttons */}
              <div className="flex items-center gap-1.5 p-1 bg-graphite-950 rounded-xl border border-graphite-800">
                {(["SIGMOID", "FLAT", "EXPONENTIAL", "LONG"] as DbcCurveType[]).map((type) => (
                  <button
                    key={type}
                    onClick={() => setCurveType(type)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors font-medium ${
                      curveType === type
                        ? "bg-amber-500/20 border border-amber-500/40 text-amber-400 font-bold"
                        : "text-graphite-400 hover:text-white"
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive SVG Chart */}
            <div className="relative w-full overflow-hidden bg-graphite-950/70 border border-graphite-850 rounded-xl p-2">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto">
                <defs>
                  <linearGradient id="curveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
                    <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Grid Lines */}
                {[0.25, 0.5, 0.75].map((frac) => {
                  const y = padding.top + frac * (svgHeight - padding.top - padding.bottom);
                  return (
                    <line
                      key={frac}
                      x1={padding.left}
                      y1={y}
                      x2={svgWidth - padding.right}
                      y2={y}
                      stroke="#232834"
                      strokeDasharray="4 4"
                    />
                  );
                })}

                {/* Area under curve */}
                <path
                  d={`${pathD} L ${getSvgX(100)} ${svgHeight - padding.bottom} L ${getSvgX(0)} ${svgHeight - padding.bottom} Z`}
                  fill="url(#curveGradient)"
                />

                {/* Curve Line */}
                <path
                  d={pathD}
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />

                {/* Active Slider Indicator Line */}
                <line
                  x1={activeX}
                  y1={padding.top}
                  x2={activeX}
                  y2={svgHeight - padding.bottom}
                  stroke="#FFFFFF"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                  opacity="0.8"
                />

                {/* Active Marker Dot */}
                <circle
                  cx={activeX}
                  cy={activeY}
                  r="5"
                  fill="#FFFFFF"
                  stroke="#F59E0B"
                  strokeWidth="2.5"
                />

                {/* Y-Axis Labels */}
                <text x={padding.left - 8} y={getSvgY(maxPrice)} textAnchor="end" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  ${maxPrice.toFixed(0)}
                </text>
                <text x={padding.left - 8} y={getSvgY((minPrice + maxPrice) / 2)} textAnchor="end" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  ${((minPrice + maxPrice) / 2).toFixed(0)}
                </text>
                <text x={padding.left - 8} y={getSvgY(minPrice)} textAnchor="end" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  ${minPrice.toFixed(0)}
                </text>

                {/* X-Axis Labels */}
                <text x={getSvgX(0)} y={svgHeight - 10} textAnchor="start" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  0% Sold
                </text>
                <text x={getSvgX(50)} y={svgHeight - 10} textAnchor="middle" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  50% Supply
                </text>
                <text x={getSvgX(100)} y={svgHeight - 10} textAnchor="end" fill="#6B7280" fontSize="9" fontFamily="JetBrains Mono">
                  100% Target
                </text>
              </svg>
            </div>

            {/* Interactive Supply Slider */}
            <div className="mt-5 space-y-2">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-graphite-400">Simulate Bonding Curve Progress:</span>
                <span className="text-amber-400 font-bold">{soldPercentage}% Sold (${(currentSimTvl / 1000).toFixed(1)}k TVL Raised)</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={soldPercentage}
                onChange={(e) => setSoldPercentage(Number(e.target.value))}
                className="w-full accent-amber-500 bg-graphite-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          {/* Real-time Math Metrics Bar */}
          <div className="mt-6 pt-4 border-t border-graphite-800/80 grid grid-cols-3 gap-4 font-mono text-xs">
            <div>
              <span className="text-[10px] text-graphite-500 uppercase tracking-wider block">Current Price</span>
              <span className="text-base font-bold text-white">${activePoint ? activePoint.priceUsd.toFixed(2) : "0.00"}</span>
            </div>
            <div>
              <span className="text-[10px] text-graphite-500 uppercase tracking-wider block">Estimated Slippage</span>
              <span className="text-base font-bold text-emerald-400">
                {(activePoint ? activePoint.slippageBps / 100 : 0).toFixed(2)}%
              </span>
            </div>
            <div>
              <span className="text-[10px] text-graphite-500 uppercase tracking-wider block">Dynamic Fee Floor</span>
              <span className="text-base font-bold text-amber-400">
                {(activePoint ? activePoint.feeBps / 100 : 0.25).toFixed(2)}%
              </span>
            </div>
          </div>
        </div>

        {/* Right Column: End-to-End Stack Flow (5 cols) */}
        <div className="lg:col-span-5 bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="border-b border-graphite-800 pb-4 mb-5">
              <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-500 font-medium block">
                Full-Stack Architecture Lifecycle
              </span>
              <h3 className="font-mono text-sm font-semibold text-graphite-200 mt-0.5">
                DBC ➔ DLMM Conviction ➔ DAMM v2
              </h3>
            </div>

            {/* 3-Step Lifecycle Pipeline */}
            <div className="space-y-4 font-mono text-xs">
              {/* Step 1: DBC Discovery */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  graduationMetrics.graduationStage === "DBC_DISCOVERY"
                    ? "bg-amber-500/10 border-amber-500/40 shadow-lg"
                    : "bg-graphite-950/60 border-graphite-850 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 text-center text-xs font-bold leading-5">1</span>
                    <span className="font-bold text-white">DBC Price Discovery</span>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${graduationMetrics.isGraduated ? "bg-emerald-500/20 text-emerald-400" : "bg-amber-500/20 text-amber-400"}`}>
                    {graduationMetrics.isGraduated ? "COMPLETED" : "ACTIVE"}
                  </span>
                </div>
                <p className="text-[11px] text-graphite-400 font-sans mt-1">
                  Fair pre-market price discovery bounded by reference equity valuation. Immune to front-running bots.
                </p>
                <div className="mt-2 text-[10px] text-graphite-500">
                  Raised: <strong className="text-white">${(currentSimTvl / 1000).toFixed(1)}k</strong> / ${(config.graduationTargetTvlUsd / 1000).toFixed(1)}k Target
                </div>
              </div>

              {/* Step 2: DLMM Conviction Pool */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  graduationMetrics.graduationStage === "DLMM_CONVICTION_MIGRATION"
                    ? "bg-emerald-500/10 border-emerald-500/40 shadow-lg"
                    : "bg-graphite-950/60 border-graphite-850 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 text-center text-xs font-bold leading-5">2</span>
                    <span className="font-bold text-white">DLMM Conviction Pool</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-graphite-800 text-graphite-300">
                    OPEN SESSION
                  </span>
                </div>
                <p className="text-[11px] text-graphite-400 font-sans mt-1">
                  100% of bonded liquidity migrates into concentrated Gaussian Curve (±10 bins) around open bell price with volatility decay timers.
                </p>
                <div className="mt-2 text-[10px] text-graphite-500">
                  Target Bins: <strong className="text-emerald-400">[-10 ... 10] (Curve Strategy)</strong>
                </div>
              </div>

              {/* Step 3: DAMM v2 Auto-Compounding */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  graduationMetrics.graduationStage === "DAMM_V2_COMPOUNDING"
                    ? "bg-purple-500/10 border-purple-500/40 shadow-lg"
                    : "bg-graphite-950/60 border-graphite-850 opacity-70"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 text-center text-xs font-bold leading-5">3</span>
                    <span className="font-bold text-white">DAMM v2 Compounding</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded font-bold uppercase bg-graphite-800 text-graphite-300">
                    AFTER-HOURS
                  </span>
                </div>
                <p className="text-[11px] text-graphite-400 font-sans mt-1">
                  During closed market hours, liquidity rolls into an automated compounding invariant pool to capture passive yield and immunize LP capital.
                </p>
                <div className="mt-2 text-[10px] text-graphite-500">
                  Projected Yield: <strong className="text-purple-400">28.4% APY Compounding</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Simulation Toggles */}
          <div className="mt-5 pt-4 border-t border-graphite-800 flex items-center justify-between text-xs font-mono">
            <span className="text-graphite-500">Market Phase:</span>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMarketStateSim("OPEN")}
                className={`px-2.5 py-1 rounded text-[11px] ${marketStateSim === "OPEN" ? "bg-state-open text-black font-bold" : "bg-graphite-800 text-graphite-400"}`}
              >
                NYSE OPEN
              </button>
              <button
                onClick={() => setMarketStateSim("CLOSED")}
                className={`px-2.5 py-1 rounded text-[11px] ${marketStateSim === "CLOSED" ? "bg-state-closed text-white font-bold" : "bg-graphite-800 text-graphite-400"}`}
              >
                CLOSED (DAMM v2)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
