"use client";

import React from "react";
import { DBC_PRESET_MARKETPLACE, DbcPresetItem } from "@market-clock/bin-scheduler";

export const PresetMarketplace: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = React.useState<string>("ALL");
  const [activePreset, setActivePreset] = React.useState<DbcPresetItem | null>(null);
  const [copiedId, setCopiedId] = React.useState<string | null>(null);
  const [deployedId, setDeployedId] = React.useState<string | null>(null);

  const filteredPresets = React.useMemo(() => {
    if (selectedCategory === "ALL") return DBC_PRESET_MARKETPLACE;
    return DBC_PRESET_MARKETPLACE.filter((p) => p.category === selectedCategory);
  }, [selectedCategory]);

  const handleCopyCli = (preset: DbcPresetItem) => {
    navigator.clipboard.writeText(preset.cliCommand);
    setCopiedId(preset.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeploy = (preset: DbcPresetItem) => {
    setDeployedId(preset.id);
    setTimeout(() => setDeployedId(null), 3500);
  };

  return (
    <div className="space-y-12">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
              Section 3 • DBC Config Preset Marketplace
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold uppercase">
              Builder Tooling
            </span>
          </div>
          <p className="text-xs font-sans text-graphite-400">
            Battle-tested launchpad configurations optimized for equity pairs, low-slippage RFQs, and conviction DLMM graduations.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 p-1 bg-graphite-900 border border-[#232834] rounded-xl text-xs font-mono">
          {["ALL", "EQUITY", "RFQ", "CONVICTION", "YIELD"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-lg transition-colors font-medium ${
                selectedCategory === cat
                  ? "bg-graphite-800 text-white font-bold border border-graphite-700 shadow-sm"
                  : "text-graphite-400 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Preset Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredPresets.map((preset) => {
          const isCopied = copiedId === preset.id;
          const isDeployed = deployedId === preset.id;

          return (
            <div
              key={preset.id}
              className="bg-graphite-900 border border-[#232834] hover:border-graphite-700 rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] transition-all flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex items-center justify-between gap-3 mb-2">
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 font-bold uppercase tracking-wider">
                    {preset.badge}
                  </span>
                  <span className="text-[11px] font-mono text-graphite-500">
                    Curve: <strong className="text-white">{preset.config.curveType}</strong>
                  </span>
                </div>

                <h3 className="font-mono text-base font-bold text-white tracking-tight">
                  {preset.name}
                </h3>
                <p className="text-xs font-sans text-graphite-400 mt-1 line-clamp-2">
                  {preset.tagline}
                </p>

                {/* Key Metrics Stats */}
                <div className="mt-4 grid grid-cols-3 gap-2 p-3 bg-graphite-950/70 border border-graphite-850 rounded-xl text-center font-mono text-xs">
                  <div>
                    <span className="text-[10px] text-graphite-500 uppercase block">Graduations</span>
                    <span className="font-bold text-white">{preset.stats.graduationsCount}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-graphite-500 uppercase block">Avg Slippage</span>
                    <span className="font-bold text-emerald-400">{preset.stats.avgSlippagePct}%</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-graphite-500 uppercase block">Shield Score</span>
                    <span className="font-bold text-blue-400">{preset.stats.volatilityProtectionScore}/100</span>
                  </div>
                </div>

                {/* Highlight Features list */}
                <div className="mt-4 space-y-1.5 text-xs text-graphite-400">
                  {preset.highlightFeatures.map((feat, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-emerald-400 font-bold">✓</span>
                      <span className="text-[11px] font-sans">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 pt-4 border-t border-graphite-800/80 flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setActivePreset(preset)}
                  className="text-xs font-mono text-graphite-400 hover:text-white underline underline-offset-4 transition-colors"
                >
                  Inspect Parameters →
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopyCli(preset)}
                    className="px-3 py-1.5 rounded-xl bg-graphite-800 hover:bg-graphite-700 border border-graphite-700 text-xs font-mono text-white transition-colors"
                  >
                    {isCopied ? "✓ Copied CLI" : "Copy CLI"}
                  </button>
                  <button
                    onClick={() => handleDeploy(preset)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shadow-md ${
                      isDeployed
                        ? "bg-emerald-500 text-black border border-emerald-400"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    }`}
                  >
                    {isDeployed ? "✓ Deployed to Devnet" : "Deploy Preset"}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal Inspector for Selected Preset */}
      {activePreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="max-w-2xl w-full bg-graphite-900 border border-[#2e3544] rounded-2xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-graphite-800 pb-3">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-blue-400 font-bold">
                  DBC Preset Inspector
                </span>
                <h3 className="font-mono text-base font-bold text-white">
                  {activePreset.name}
                </h3>
              </div>
              <button
                onClick={() => setActivePreset(null)}
                className="w-8 h-8 rounded-lg bg-graphite-800 hover:bg-graphite-700 text-graphite-300 flex items-center justify-center font-mono text-sm"
              >
                ✕
              </button>
            </div>

            {/* Parameter Details Table */}
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-3 bg-graphite-950 rounded-xl border border-graphite-850">
                <span className="text-graphite-500 text-[10px] uppercase block">Curve Archetype</span>
                <span className="text-white font-bold">{activePreset.config.curveType} Curve</span>
              </div>
              <div className="p-3 bg-graphite-950 rounded-xl border border-graphite-850">
                <span className="text-graphite-500 text-[10px] uppercase block">Target TVL Graduation</span>
                <span className="text-emerald-400 font-bold">${activePreset.config.graduationTargetTvlUsd.toLocaleString()} USD</span>
              </div>
              <div className="p-3 bg-graphite-950 rounded-xl border border-graphite-850">
                <span className="text-graphite-500 text-[10px] uppercase block">Base Dynamic Fee</span>
                <span className="text-white font-bold">{activePreset.config.baseFeeBps / 100}% ({(activePreset.config.baseFeeBps + activePreset.config.dynamicFeeFloorBps) / 100}% Max Floor)</span>
              </div>
              <div className="p-3 bg-graphite-950 rounded-xl border border-graphite-850">
                <span className="text-graphite-500 text-[10px] uppercase block">Creator Fee Split</span>
                <span className="text-amber-400 font-bold">{activePreset.stats.creatorFeeSplitPct}% Creator / 20% Protocol</span>
              </div>
            </div>

            {/* CLI Command snippet */}
            <div>
              <span className="text-[11px] font-mono text-graphite-400 block mb-1.5">
                Solana CLI Deployment Command:
              </span>
              <div className="p-3 rounded-xl bg-graphite-950 border border-graphite-800 font-mono text-xs text-graphite-200 overflow-x-auto select-all">
                {activePreset.cliCommand}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setActivePreset(null)}
                className="px-4 py-2 rounded-xl bg-graphite-800 hover:bg-graphite-700 text-xs font-mono text-white transition-colors"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
