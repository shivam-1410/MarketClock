"use client";

import React from "react";

export const DevDataStreamPanel: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = React.useState<"ts" | "react" | "python" | "curl">("ts");
  const [streamLogs, setStreamLogs] = React.useState<string[]>([]);
  const [isStreaming, setIsStreaming] = React.useState<boolean>(true);
  const [copiedSnippet, setCopiedSnippet] = React.useState<boolean>(false);
  const eventSourceRef = React.useRef<EventSource | null>(null);

  // Connect to live SSE stream
  React.useEffect(() => {
    if (!isStreaming) {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      return;
    }

    try {
      const es = new EventSource("/api/stream");
      eventSourceRef.current = es;

      es.onmessage = (event) => {
        setStreamLogs((prev) => [event.data, ...prev.slice(0, 15)]);
      };

      es.addEventListener("telemetry", (event: any) => {
        try {
          const parsed = JSON.parse(event.data);
          const formatted = JSON.stringify(parsed, null, 2);
          setStreamLogs((prev) => [formatted, ...prev.slice(0, 15)]);
        } catch {
          setStreamLogs((prev) => [event.data, ...prev.slice(0, 15)]);
        }
      });

      es.onerror = () => {
        // Fallback simulation if running in dev without persistent SSE
        const fallbackTick = {
          event: "DBC_TELEMETRY_TICK",
          timestamp: new Date().toISOString(),
          activeAsset: "xTSLA/USDC",
          state: "OPEN",
          currentPriceUsd: +(184.25 + (Math.random() - 0.5) * 0.4).toFixed(2),
          raisedTvlUsd: 74200,
          targetTvlUsd: 100000,
          progressPct: 74.2,
          dlmmReshaper: {
            activeBinId: 1500,
            feeBps: 15,
            halfWidth: 10,
            strategyType: "Curve",
          },
        };
        setStreamLogs((prev) => [JSON.stringify(fallbackTick, null, 2), ...prev.slice(0, 15)]);
      };

      return () => {
        es.close();
      };
    } catch {
      // Ignored
    }
  }, [isStreaming]);

  const codeSnippets = {
    ts: `import { MarketClockClient } from "@market-clock/sdk";
import { Connection, PublicKey } from "@solana/web3.js";

// Initialize client connected to Meteora DLMM pool
const connection = new Connection("https://api.devnet.solana.com");
const client = new MarketClockClient({
  connection,
  poolAddress: new PublicKey("118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo"),
});

// Subscribe to schedule-aware state transitions & bonding curve events
client.on("stateChange", ({ state, nextTransition, targetRange }) => {
  console.log(\`[MarketClock] Session State: \${state} | Next Bell in \${nextTransition.remainingSeconds}s\`);
  console.log(\`[DLMM Reshaper] Target Bins: [\${targetRange.minBinId} ... \${targetRange.maxBinId}]\`);
});

// Launch a new tokenized equity with DBC bonded discovery
const launchTx = await client.dbc.createLaunch({
  tokenPair: "xNVDA/USDC",
  curveType: "FLAT", // Optimized for low-slippage RFQ orders
  initialPrice: 128.50,
  targetTvlUsd: 100000,
  migrationStrategy: "DLMM_CONVICTION_POOL",
});`,

    react: `import { useMarketClock, useDbcLaunch } from "@market-clock/react";

export function EquityTradingTerminal() {
  const { sessionState, nyseTime, countdown, activeBin } = useMarketClock();
  const { progressPct, currentPrice, isGraduated } = useDbcLaunch("xTSLA");

  return (
    <div className="terminal-card">
      <h3>\${sessionState} (Bell in {countdown})</h3>
      <p>Active Price: \${currentPrice} | Bonded: {progressPct}%</p>
      {isGraduated && <span>Graduated to DLMM Conviction Pool</span>}
    </div>
  );
}`,

    python: `import requests
import json

# Subscribe to real-time MarketClock SSE stream for keeper bot execution
url = "https://market-clock.solana.com/api/stream"
headers = {"Accept": "text/event-stream"}

response = requests.get(url, headers=headers, stream=True)
for line in response.iter_lines():
    if line and line.startswith(b"data: "):
        payload = json.loads(line[6:].decode("utf-8"))
        print(f"[{payload.get('timestamp')}] {payload.get('activeAsset')} Price: \\\${payload.get('bondingCurve', {}).get('currentPriceUsd')}")
        # Execute automated Meteora DLMM rebalance or swap
        if payload.get("marketState") == "PRE_CLOSE":
            trigger_preclose_widening_tx()`,

    curl: `curl -N -H "Accept: text/event-stream" \\
  https://market-clock.solana.com/api/stream`,
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeSnippets[activeCodeTab]);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  return (
    <div className="space-y-12">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-graphite-500 font-semibold">
              Section 4 • Developer Data Stream & SDK Tooling
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 font-bold uppercase">
              Trading Terminals & Builders
            </span>
          </div>
          <p className="text-xs font-sans text-graphite-400">
            Plug-and-play Server-Sent Events (SSE) telemetry feed and client SDKs for terminal integrations (Jupiter, Birdeye, DexScreener, Backpack).
          </p>
        </div>

        {/* Live SSE Stream Status Indicator */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-graphite-900 border border-[#232834]">
            <span className={`w-2 h-2 rounded-full ${isStreaming ? "bg-emerald-400 animate-pulse" : "bg-red-400"}`} />
            <span className="text-white">{isStreaming ? "SSE Live Stream Active" : "Stream Paused"}</span>
          </div>
          <button
            onClick={() => setIsStreaming(!isStreaming)}
            className="px-3 py-1.5 rounded-xl bg-graphite-800 hover:bg-graphite-700 border border-graphite-700 text-graphite-200"
          >
            {isStreaming ? "Pause" : "Resume"}
          </button>
        </div>
      </div>

      {/* Two Column Grid: Code Generator (Left) & Real-time Stream Console (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Multi-Language SDK Snippets (6 cols) */}
        <div className="lg:col-span-6 bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-graphite-800 pb-3 mb-4">
              <span className="text-[10px] font-mono uppercase tracking-widest text-graphite-500 font-semibold">
                Developer Integration SDK
              </span>

              {/* Language Tabs */}
              <div className="flex items-center gap-1">
                {[
                  { id: "ts", label: "TypeScript" },
                  { id: "react", label: "React Hook" },
                  { id: "python", label: "Python" },
                  { id: "curl", label: "cURL SSE" },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveCodeTab(tab.id as any)}
                    className={`px-2.5 py-1 text-[11px] font-mono rounded-lg transition-colors ${
                      activeCodeTab === tab.id
                        ? "bg-purple-500/20 text-purple-400 border border-purple-500/40 font-bold"
                        : "text-graphite-400 hover:text-white"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Block Container */}
            <div className="relative rounded-xl bg-graphite-950 border border-graphite-800 p-4 font-mono text-xs text-graphite-200 overflow-x-auto max-h-[380px]">
              <pre className="text-[11px] leading-relaxed select-all">
                {codeSnippets[activeCodeTab]}
              </pre>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-800/80 flex items-center justify-between">
            <span className="text-[11px] text-graphite-500 font-mono">
              Ready to paste into your terminal or launchpad backend
            </span>
            <button
              onClick={handleCopyCode}
              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-mono font-bold text-white transition-all shadow-md"
            >
              {copiedSnippet ? "✓ Copied Snippet" : "Copy Code Snippet"}
            </button>
          </div>
        </div>

        {/* Right: Live SSE Stream Console (6 cols) */}
        <div className="lg:col-span-6 bg-graphite-900 border border-[#232834] rounded-2xl p-6 shadow-[0_4px_24px_-2px_rgba(0,0,0,0.5)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-graphite-800 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs uppercase tracking-wider text-graphite-200 font-semibold">
                  Live JSON Telemetry Stream (/api/stream)
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-graphite-800 text-graphite-300 border border-graphite-700">
                SSE • 2.5s Interval
              </span>
            </div>

            {/* Stream Terminal Window */}
            <div className="rounded-xl bg-graphite-950 border border-graphite-850 p-4 font-mono text-xs text-emerald-400 overflow-y-auto max-h-[380px] space-y-3">
              {streamLogs.length === 0 ? (
                <div className="text-graphite-500 text-center py-12">
                  Connecting to Server-Sent Events stream...
                </div>
              ) : (
                streamLogs.map((log, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-graphite-900/60 border border-graphite-800/80 text-[11px] leading-relaxed text-graphite-300 font-mono whitespace-pre-wrap animate-in fade-in duration-150"
                  >
                    {log}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-graphite-800/80 flex items-center justify-between text-xs font-mono">
            <span className="text-graphite-500">
              Payload: <strong className="text-graphite-300">DBC_TELEMETRY_TICK</strong>
            </span>
            <span className="text-[11px] text-purple-400">
              Compatible with Jupiter, Birdeye & Backpack API specs
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
