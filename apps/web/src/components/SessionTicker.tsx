"use client";

import React from "react";

export interface RebalanceLogItem {
  id: string;
  timestamp: string;
  state: string;
  nyseTimeFormatted: string;
  activeBin: number;
  activePrice: number;
  oldRange: [number, number] | null;
  newRange: [number, number];
  strategyType: string;
  txSignature: string;
  baseFeeBps: number;
  dynamicFeeBps: number;
  totalFeeBps: number;
  reason: string;
  status: string;
  poolAddress: string;
  explorerUrl: string;
}

interface SessionTickerProps {
  logs: RebalanceLogItem[];
}

export const SessionTicker: React.FC<SessionTickerProps> = ({ logs }) => {
  const [filterState, setFilterState] = React.useState<string>("ALL");

  const filteredLogs = React.useMemo(() => {
    if (filterState === "ALL") return logs;
    return logs.filter((l) => l.state === filterState);
  }, [logs, filterState]);

  const getStateBadgeStyle = (state: string) => {
    switch (state) {
      case "OPEN":
        return "bg-state-open/10 border-state-open/30 text-state-open";
      case "PRE_CLOSE":
        return "bg-state-preclose/10 border-state-preclose/30 text-state-preclose";
      case "CLOSED":
        return "bg-state-closed/20 border-state-closed/40 text-[#6E8DFF]";
      case "PRE_OPEN":
      case "COOL_DOWN":
      default:
        return "bg-state-cooldown/10 border-state-cooldown/30 text-state-cooldown";
    }
  };

  return (
    <div className="bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5),0_1px_1px_0_rgba(255,255,255,0.02)] state-transition flex flex-col">
      {/* Terminal Title Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-graphite-800 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-[11px] text-graphite-400 font-medium ml-1.5">
            Meteora DLMM Keeper Telemetry Feed
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-graphite-800 text-graphite-100 border border-graphite-700">
            Devnet Live
          </span>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1">
          {["ALL", "OPEN", "PRE_CLOSE", "CLOSED", "COOL_DOWN"].map((s) => (
            <button
              key={s}
              onClick={() => setFilterState(s)}
              className={`px-2 py-0.5 text-[11px] font-mono rounded transition-colors ${
                filterState === s
                  ? "bg-graphite-800 text-graphite-100 border border-graphite-700 font-semibold"
                  : "text-graphite-500 hover:text-graphite-100 hover:bg-graphite-850"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Keyframe animation for new incoming log entries */}
      <style>{`
        @keyframes feedItemEntry {
          0% {
            opacity: 0;
            transform: translateY(-8px);
            border-color: rgba(47, 191, 158, 0.7);
            background-color: rgba(47, 191, 158, 0.12);
          }
          60% {
            border-color: rgba(47, 191, 158, 0.4);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
            border-color: #1f242e;
            background-color: rgba(15, 17, 23, 0.7);
          }
        }
      `}</style>

      {/* Log Feed Items */}
      <div className="mt-4 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="p-8 text-center font-mono text-xs text-graphite-500">
            No rebalance records found for the selected filter.
          </div>
        ) : (
          filteredLogs.map((entry) => (
            <div
              key={entry.id}
              className="bg-graphite-950/70 border border-graphite-850 hover:border-graphite-800 rounded-xl p-3.5 transition-colors font-mono text-xs text-graphite-100"
              style={
                entry.id.startsWith("reb_sim_")
                  ? {
                      animation: "feedItemEntry 250ms ease-out forwards",
                    }
                  : undefined
              }
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStateBadgeStyle(
                      entry.state
                    )}`}
                  >
                    {entry.state}
                  </span>
                  <span className="text-graphite-500 text-[11px]">
                    {entry.nyseTimeFormatted || entry.timestamp}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-graphite-500">
                    Fee: <strong className="text-graphite-100">{(entry.totalFeeBps / 100).toFixed(2)}%</strong>
                  </span>
                  <a
                    href={entry.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-graphite-500 hover:text-state-open underline transition-colors flex items-center gap-1"
                  >
                    <span>Tx: {entry.txSignature.slice(0, 8)}...{entry.txSignature.slice(-6)}</span>
                    <svg className="w-3 h-3 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Range transition description */}
              <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-graphite-500">Range:</span>
                  {entry.oldRange ? (
                    <span className="text-graphite-500">
                      [{entry.oldRange[0]} ... {entry.oldRange[1]}]
                    </span>
                  ) : (
                    <span className="text-graphite-500">[Initial]</span>
                  )}
                  <span className="text-graphite-500">➔</span>
                  <span className="text-graphite-100 font-semibold">
                    [{entry.newRange[0]} ... {entry.newRange[1]}] ({entry.strategyType})
                  </span>
                </div>

                <div className="text-[11px] text-graphite-500">
                  Ref Price: ${entry.activePrice ? entry.activePrice.toFixed(2) : "184.25"}
                </div>
              </div>

              {/* Rationale explanation */}
              <div className="mt-1.5 text-[11px] text-graphite-500 font-sans leading-relaxed">
                {entry.reason}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
