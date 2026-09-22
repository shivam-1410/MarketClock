"use client";

import React from "react";

export type ActiveTabId = "reshaper" | "launchpad" | "marketplace" | "developer";

interface NavigationTabsProps {
  activeTab: ActiveTabId;
  onSelectTab: (tab: ActiveTabId) => void;
}

export const NavigationTabs: React.FC<NavigationTabsProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    {
      id: "reshaper" as ActiveTabId,
      name: "Live Reshaper",
      subtitle: "24h NYSE State & DLMM Heatmap",
      icon: "⏱",
      badge: "LIVE DEVNET",
      badgeColor: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
    },
    {
      id: "launchpad" as ActiveTabId,
      name: "DBC Launchpad Studio",
      subtitle: "Novel Curves & Stack Flow",
      icon: "🚀",
      badge: "DBC • DLMM • DAMM",
      badgeColor: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    },
    {
      id: "marketplace" as ActiveTabId,
      name: "Preset Marketplace",
      subtitle: "Popular Launch Configs",
      icon: "⚡",
      badge: "4 PRESETS",
      badgeColor: "bg-blue-500/10 text-blue-400 border-blue-500/30",
    },
    {
      id: "developer" as ActiveTabId,
      name: "Dev Streams & SDK",
      subtitle: "Terminal Data Feeds & API",
      icon: "📡",
      badge: "SSE STREAM",
      badgeColor: "bg-purple-500/10 text-purple-400 border-purple-500/30",
    },
  ];

  return (
    <div className="w-full border-b border-[#232834] bg-graphite-950/60 backdrop-blur sticky top-[73px] z-40 px-6 py-3">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-3 overflow-x-auto pb-1 no-scrollbar">
        <div className="flex items-center gap-2">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`nav-tab-${tab.id}`}
                onClick={() => onSelectTab(tab.id)}
                className={`flex items-center gap-2.5 px-3.5 py-2 rounded-xl text-xs font-mono transition-all ${
                  isActive
                    ? "bg-graphite-900 border border-[#2e3544] text-white shadow-[0_2px_12px_rgba(0,0,0,0.5)]"
                    : "text-graphite-400 hover:text-graphite-200 hover:bg-graphite-900/60 border border-transparent"
                }`}
              >
                <span className="text-sm select-none">{tab.icon}</span>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <span className={`font-semibold tracking-tight ${isActive ? "text-white" : ""}`}>
                      {tab.name}
                    </span>
                    <span
                      className={`text-[9px] px-1.5 py-0.2 rounded border font-mono font-bold uppercase tracking-wider ${tab.badgeColor}`}
                    >
                      {tab.badge}
                    </span>
                  </div>
                  <span className="text-[10px] text-graphite-500 block font-sans">
                    {tab.subtitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
