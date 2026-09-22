import { NextRequest } from "next/server";
import { getMarketClockState } from "@market-clock/core";

export const dynamic = "force-dynamic";

/**
 * Server-Sent Events (SSE) data stream for trading terminals (Jupiter, Birdeye, DexScreener, Backpack).
 * Streams real-time NYSE market session state, DBC bonding curve ticks, and DLMM graduation telemetry.
 */
export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection packet
      const initPayload = {
        event: "CONNECTED",
        protocol: "MarketClock Streaming Telemetry API v1",
        timestamp: new Date().toISOString(),
        pool: "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
        network: "solana-devnet",
        supportedCatalogs: ["xStocks", "Backpack Onchain", "Ondo RFQ", "Stocklana"],
      };
      controller.enqueue(encoder.encode(`event: connected\ndata: ${JSON.stringify(initPayload)}\n\n`));

      // Emit recurring telemetry every 2.5 seconds
      let tickCount = 0;
      const interval = setInterval(() => {
        tickCount++;
        const now = new Date();
        const stateResult = getMarketClockState(now);

        // Simulated price tick around $184.25
        const priceVariation = (Math.sin(tickCount * 0.4) * 0.35);
        const activePrice = +(184.25 + priceVariation).toFixed(2);
        const dbcProgressPct = Math.min(100, +(72.4 + (tickCount * 0.4) % 27.6).toFixed(1));

        const tickData = {
          event: "DBC_TELEMETRY_TICK",
          sequence: tickCount,
          timestamp: now.toISOString(),
          marketState: stateResult.state,
          nyseHour: now.toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }),
          activeAsset: "xTSLA/USDC",
          catalog: "xStocks",
          bondingCurve: {
            curveType: "SIGMOID",
            currentPriceUsd: activePrice,
            targetPriceUsd: 195.0,
            raisedTvlUsd: +(dbcProgressPct * 1000).toFixed(2),
            targetTvlUsd: 100000,
            progressPct: dbcProgressPct,
            isGraduated: dbcProgressPct >= 100,
            activeStage: dbcProgressPct >= 100 ? "DLMM_CONVICTION_POOL" : "DBC_DISCOVERY",
          },
          dlmmReshaper: {
            activeBinId: 1500 + Math.round(priceVariation * 4),
            feeBps: stateResult.state === "OPEN" ? 15 : stateResult.state === "CLOSED" ? 30 : 25,
            halfWidth: stateResult.state === "OPEN" ? 10 : stateResult.state === "CLOSED" ? 80 : 35,
            strategyType: stateResult.state === "CLOSED" ? "Spot" : "Curve",
          },
        };

        try {
          controller.enqueue(encoder.encode(`event: telemetry\ndata: ${JSON.stringify(tickData)}\n\n`));
        } catch {
          clearInterval(interval);
        }
      }, 2500);

      req.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
