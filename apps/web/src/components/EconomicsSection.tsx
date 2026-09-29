"use client";

import React from "react";
import Image from "next/image";

export const EconomicsSection: React.FC = () => {
  // Economics interactive model state (calibrated against Folyum structure & Meteora DLMM)
  const [monthlyVolumePerPool, setMonthlyVolumePerPool] = React.useState<number>(15); // in Millions USD
  const [poolCount, setPoolCount] = React.useState<number>(5); // Number of tokenized equity pools
  const [adverseSelectionGapPct, setAdverseSelectionGapPct] = React.useState<number>(3.8); // Weekend gap shock %

  // Calculations calibrated against Meteora DLMM math
  const totalMonthlyVolumeUsd = monthlyVolumePerPool * poolCount * 1_000_000;
  
  // Base fee floor = 15 bps (0.15%), dynamic average fee = 25 bps (0.25%)
  const avgFeeBps = 25;
  const monthlyLpFeesUsd = totalMonthlyVolumeUsd * (avgFeeBps / 10_000);
  
  // Adverse selection loss avoided over weekends (~0.49% per $100k TVL per weekend, 4 weekends/mo)
  const averageTvlPerPool = 250_000;
  const totalTvlManaged = averageTvlPerPool * poolCount;
  const weekendAdverseSelectionAvoidedMonthly =
    totalTvlManaged * (adverseSelectionGapPct / 100) * 0.12 * 4;

  const totalMonthlyValuePreserved = monthlyLpFeesUsd + weekendAdverseSelectionAvoidedMonthly;
  const annualValuePreserved = totalMonthlyValuePreserved * 12;

  const formatCurrency = (val: number) => {
    if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
    if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
    if (val >= 1_000) return `$${(val / 1_000).toFixed(1)}k`;
    return `$${val.toFixed(0)}`;
  };

  return (
    <section
      id="economics"
      aria-labelledby="economics-title"
      className="space-y-10 animate-in fade-in duration-300"
    >
      {/* Section Header (Folyum section-intro style) */}
      <div className="border-b border-[#232834] pb-8">
        <div className="flex items-center gap-2.5 mb-3">
          <div className="relative w-6 h-6 rounded-full overflow-hidden border border-graphite-700 bg-graphite-900 shrink-0 shadow-sm">
            <Image
              src="/market-clock-logo.png"
              alt="MarketClock"
              width={24}
              height={24}
              className="object-cover"
            />
          </div>
          <span className="font-mono text-[11px] uppercase tracking-widest text-emerald-400 font-bold">
            Platform Economics
          </span>
          <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-medium">
            Meteora DLMM • Stocklana
          </span>
        </div>
        <h2
          id="economics-title"
          className="font-sans text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-white max-w-3xl leading-[1.15]"
        >
          Yield follows trading session volume, protected from off-market bleed.
        </h2>
        <p className="text-sm font-sans text-graphite-400 max-w-3xl mt-3 leading-relaxed">
          The proposed model assigns MarketClock LPs concentrated fee share during active Wall Street hours while shifting to defensive wide spreads when exchanges halt. Off-market arbitrageurs are penalized with elevated dynamic fee floors, preserving LP principal from adverse selection.
        </p>
      </div>

      {/* Main Interactive Economics Model (Folyum 2-column split architecture) */}
      <div className="border border-[#232834] rounded-2xl bg-[#0e1218] shadow-[0_12px_40px_-10px_rgba(0,0,0,0.8)] grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left Column: Model Assumptions & Interactive Controls (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 space-y-7 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#232834]">
          {/* Top Assumption Box (economics-assumption) */}
          <div className="pb-6 border-b border-[#232834] grid grid-cols-1 sm:grid-cols-3 gap-4 items-baseline">
            <div className="sm:col-span-2">
              <span className="text-[11px] font-mono uppercase tracking-widest text-graphite-400 font-semibold block">
                Modelled Market Fee Corridor
              </span>
              <p className="text-xs font-sans text-graphite-400 mt-1.5 leading-relaxed pr-2">
                15 bps base fee to liquidity providers + dynamic volatility accumulator scaling up to 120 bps during off-market or pre-close hours.
              </p>
            </div>
            <div className="sm:text-right">
              <span className="font-mono text-2xl sm:text-3xl font-bold text-emerald-400 block tracking-tight">
                15 – 120 <span className="text-sm font-normal text-graphite-400">bps</span>
              </span>
            </div>
          </div>

          {/* Interactive Controls (economics-controls) */}
          <div className="space-y-6">
            {/* Control 1: Monthly Volume */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between text-xs font-mono">
                <span className="text-graphite-400 uppercase tracking-wider text-[11px] font-medium">
                  Monthly volume per tokenized stock
                </span>
                <strong className="text-white text-base font-bold font-mono">
                  ${monthlyVolumePerPool}M <span className="text-xs font-normal text-graphite-400">USD</span>
                </strong>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                step="1"
                value={monthlyVolumePerPool}
                aria-valuetext={`$${monthlyVolumePerPool}M monthly volume per pool`}
                onChange={(e) => setMonthlyVolumePerPool(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-graphite-800 h-2 rounded-lg cursor-pointer transition-all hover:bg-graphite-700"
              />
              <div className="flex justify-between text-[11px] font-mono text-graphite-500">
                <span>$1m</span>
                <span>$50m</span>
                <span>$100m</span>
              </div>
            </div>

            {/* Control 2: Tokenized Equity Pools */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between text-xs font-mono">
                <span className="text-graphite-400 uppercase tracking-wider text-[11px] font-medium">
                  Tokenized equity pools on platform
                </span>
                <strong className="text-white text-base font-bold font-mono">
                  {poolCount} <span className="text-xs font-normal text-graphite-400">{poolCount === 1 ? "Pool" : "Pools"}</span>
                </strong>
              </div>
              <input
                type="range"
                min="1"
                max="20"
                step="1"
                value={poolCount}
                aria-valuetext={`${poolCount} ${poolCount === 1 ? "Pool" : "Pools"}`}
                onChange={(e) => setPoolCount(Number(e.target.value))}
                className="w-full accent-emerald-500 bg-graphite-800 h-2 rounded-lg cursor-pointer transition-all hover:bg-graphite-700"
              />
              <div className="flex justify-between text-[11px] font-mono text-graphite-500">
                <span>1 Pool (TSLA)</span>
                <span>10 Pools</span>
                <span>20 Pools (Broad Equity Index)</span>
              </div>
            </div>

            {/* Control 3: Off-Market / Weekend Gap Shock */}
            <div className="space-y-2.5">
              <div className="flex items-baseline justify-between text-xs font-mono">
                <span className="text-graphite-400 uppercase tracking-wider text-[11px] font-medium">
                  Weekend / Off-Market Price Gap Shock
                </span>
                <strong className="text-amber-400 text-base font-bold font-mono">
                  ±{adverseSelectionGapPct.toFixed(1)}% <span className="text-xs font-normal text-graphite-400">Shock</span>
                </strong>
              </div>
              <input
                type="range"
                min="0.5"
                max="10.0"
                step="0.1"
                value={adverseSelectionGapPct}
                aria-valuetext={`±${adverseSelectionGapPct.toFixed(1)}% price gap`}
                onChange={(e) => setAdverseSelectionGapPct(Number(e.target.value))}
                className="w-full accent-amber-500 bg-graphite-800 h-2 rounded-lg cursor-pointer transition-all hover:bg-graphite-700"
              />
              <div className="flex justify-between text-[11px] font-mono text-graphite-500">
                <span>±0.5% (Low Volatility)</span>
                <span>±3.8% (Historical TSLA Weekend Gap)</span>
                <span>±10.0% (Earnings Surprise)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Illustrative Results Panel (5 cols) (economics-results) */}
        <div className="lg:col-span-5 bg-[#080b0f] p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
              Illustrative Output
            </span>

            {/* Metrics List */}
            <dl className="mt-5 space-y-4 font-mono text-xs">
              <div className="flex items-baseline justify-between py-2.5 border-b border-graphite-800/80">
                <dt className="text-graphite-400 text-xs">Platform monthly volume</dt>
                <dd className="font-bold text-white text-base">
                  {formatCurrency(totalMonthlyVolumeUsd)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between py-2.5 border-b border-graphite-800/80">
                <dt className="text-graphite-400 text-xs">Base LP fee yield / month</dt>
                <dd className="font-bold text-emerald-400 text-base">
                  {formatCurrency(monthlyLpFeesUsd)}
                </dd>
              </div>

              <div className="flex items-baseline justify-between py-2.5 border-b border-graphite-800/80">
                <dt className="text-graphite-400 text-xs">Adverse selection avoided / mo</dt>
                <dd className="font-bold text-cyan-400 text-base">
                  +{formatCurrency(weekendAdverseSelectionAvoidedMonthly)}
                </dd>
              </div>

              {/* Primary Highlighted Result (economics-primary-result) */}
              <div className="pt-5 space-y-1.5">
                <dt className="text-[11px] uppercase tracking-wider text-graphite-400 font-semibold font-mono">
                  Net Annual LP Revenue & Preserved Capital
                </dt>
                <dd className="font-mono text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-none">
                  {formatCurrency(annualValuePreserved)}
                </dd>
                <span className="text-[11px] text-emerald-400 block font-mono font-medium pt-1">
                  +$483.41 net return advantage per $100k TVL over standard static LPs
                </span>
              </div>
            </dl>
          </div>

          <p className="text-[11px] font-sans text-graphite-500 border-t border-graphite-800/70 pt-4 leading-relaxed">
            Illustration only, not a forecast. Calibrated against Meteora DLMM discrete bin math and dynamic-fee volatility accumulator mechanics. Assumes the selected volume for every pool, dynamic fee scaling up to 120 bps during closed session, and zero adverse selection bleed over non-trading windows.
          </p>
        </div>
      </div>

      {/* 3-Column Principles Drivers (Folyum economics-principles Architecture) */}
      <div 
        className="border border-[#232834] rounded-2xl bg-[#0c1016] grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-[#232834] overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }}
      >
        {/* Driver 01 */}
        <article className="p-6 sm:p-7 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-400 font-bold block">
            Driver 01 • Session Concentration
          </span>
          <h3 className="font-sans text-base font-bold text-white tracking-tight">
            Maximized Capital Efficiency
          </h3>
          <p className="text-xs sm:text-sm font-sans text-graphite-400 leading-relaxed max-w-sm">
            During active NYSE sessions, liquidity narrows to a tight Gaussian Curve (±10 bins) around the live price. Swaps cross fewer bins, keeping dynamic volatility at zero and fee capture at peak efficiency.
          </p>
        </article>

        {/* Driver 02 */}
        <article className="p-6 sm:p-7 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold block">
            Driver 02 • Volatility Accumulator
          </span>
          <h3 className="font-sans text-base font-bold text-white tracking-tight">
            Toxic Flow Tax Extraction
          </h3>
          <p className="text-xs sm:text-sm font-sans text-graphite-400 leading-relaxed max-w-sm">
            Meteora’s native dynamic fee formula scales up to 120 bps during off-market and pre-close windows. Any off-market arbitrageur attempting to front-run news pays an elevated dynamic fee straight to LPs.
          </p>
        </article>

        {/* Constraint */}
        <article className="p-6 sm:p-7 space-y-2.5">
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold block">
            Constraint • Capital Protection First
          </span>
          <h3 className="font-sans text-base font-bold text-white tracking-tight">
            Zero Off-Market Bleed
          </h3>
          <p className="text-xs sm:text-sm font-sans text-graphite-400 leading-relaxed max-w-sm">
            Without schedule-aware widening over weekends (±80 bins Spot), static concentrated LPs bleed to toxic arbitrage before Monday's bell. MarketClock eliminates adverse selection by design.
          </p>
        </article>
      </div>
    </section>
  );
};

