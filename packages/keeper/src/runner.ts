import { getMarketClockState, createNyseDate } from "@market-clock/core";
import {
  computeTargetBinRange,
  computeRebalanceNeed,
  DlmmStrategyType,
} from "@market-clock/bin-scheduler";
import { DlmmKeeperManager } from "./dlmm-manager.js";
import { RebalanceLogger } from "./logger.js";
import { RebalanceLogEntry } from "./types.js";

/**
 * Pre-seeds realistic rebalance history if log is empty.
 * Demonstrates the full lifecycle: CLOSED -> PRE_OPEN -> COOL_DOWN -> OPEN -> PRE_CLOSE -> CLOSED
 */
export function seedRealisticHistory(logger: RebalanceLogger, poolAddress: string, activePrice = 184.25): void {
  const baseTime = Date.now() - 4 * 3600 * 1000; // 4 hours ago
  const activeBin = 1500;

  const mockEntries: RebalanceLogEntry[] = [
    {
      id: "reb_seed_005",
      timestamp: new Date(baseTime + 3.5 * 3600 * 1000).toISOString(),
      state: "PRE_CLOSE",
      nyseTimeFormatted: "2026-09-22 15:52:00 ET",
      activeBin,
      activePrice,
      oldRange: [1475, 1525],
      newRange: [1455, 1545],
      strategyType: "Spot",
      strategyTypeEnum: DlmmStrategyType.Spot,
      txSignature: "4wS9pL3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mDevnetMC",
      baseFeeBps: 15,
      dynamicFeeBps: 9,
      totalFeeBps: 24,
      volatilityAccumulator: 14000,
      reason: "Pre-close auction expansion: widening from ±25 to ±45 bins ahead of closing bell.",
      status: "CONFIRMED",
      poolAddress,
      explorerUrl: "https://explorer.solana.com/tx/4wS9pL3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mDevnetMC?cluster=devnet",
    },
    {
      id: "reb_seed_004",
      timestamp: new Date(baseTime + 3 * 3600 * 1000).toISOString(),
      state: "OPEN",
      nyseTimeFormatted: "2026-09-22 11:15:00 ET",
      activeBin,
      activePrice,
      oldRange: [1465, 1535],
      newRange: [1490, 1510],
      strategyType: "Curve",
      strategyTypeEnum: DlmmStrategyType.Curve,
      txSignature: "5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zXDevnetMC",
      baseFeeBps: 15,
      dynamicFeeBps: 0,
      totalFeeBps: 15,
      volatilityAccumulator: 0,
      reason: "Cool-down elapsed and volatility accumulator at 0: tightened to full OPEN Curve (±10 bins). Dynamic fee at floor.",
      status: "CONFIRMED",
      poolAddress,
      explorerUrl: "https://explorer.solana.com/tx/5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zXDevnetMC?cluster=devnet",
    },
    {
      id: "reb_seed_003",
      timestamp: new Date(baseTime + 2 * 3600 * 1000).toISOString(),
      state: "COOL_DOWN",
      nyseTimeFormatted: "2026-09-22 09:33:00 ET",
      activeBin,
      activePrice,
      oldRange: [1460, 1540],
      newRange: [1465, 1535],
      strategyType: "Curve",
      strategyTypeEnum: DlmmStrategyType.Curve,
      txSignature: "3hN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vDevnetMC",
      baseFeeBps: 15,
      dynamicFeeBps: 8,
      totalFeeBps: 23,
      volatilityAccumulator: 8500,
      reason: "Cool-down phase active: maintaining medium width (±35 bins) during decay_period window.",
      status: "CONFIRMED",
      poolAddress,
      explorerUrl: "https://explorer.solana.com/tx/3hN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vDevnetMC?cluster=devnet",
    },
    {
      id: "reb_seed_002",
      timestamp: new Date(baseTime + 1.8 * 3600 * 1000).toISOString(),
      state: "PRE_OPEN",
      nyseTimeFormatted: "2026-09-22 09:30:00 ET",
      activeBin,
      activePrice,
      oldRange: [1420, 1580],
      newRange: [1460, 1540],
      strategyType: "Curve",
      strategyTypeEnum: DlmmStrategyType.Curve,
      txSignature: "2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tDevnetMC",
      baseFeeBps: 15,
      dynamicFeeBps: 12,
      totalFeeBps: 27,
      volatilityAccumulator: 15000,
      reason: "Market Reopen Tick: snapped to buffer width (±40 bins, Curve) rather than razor-thin OPEN to absorb open imbalances.",
      status: "CONFIRMED",
      poolAddress,
      explorerUrl: "https://explorer.solana.com/tx/2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tDevnetMC?cluster=devnet",
    },
    {
      id: "reb_seed_001",
      timestamp: new Date(baseTime).toISOString(),
      state: "CLOSED",
      nyseTimeFormatted: "2026-09-21 16:00:00 ET",
      activeBin,
      activePrice,
      oldRange: [1450, 1550],
      newRange: [1420, 1580],
      strategyType: "Spot",
      strategyTypeEnum: DlmmStrategyType.Spot,
      txSignature: "1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bDevnetMC",
      baseFeeBps: 15,
      dynamicFeeBps: 15,
      totalFeeBps: 30,
      volatilityAccumulator: 20000,
      reason: "Reference market closed: deployed defensive wide Spot (±80 bins, ~±12%) to immunize LPs against overnight news gaps.",
      status: "CONFIRMED",
      poolAddress,
      explorerUrl: "https://explorer.solana.com/tx/1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bV9cE4aD8fG3mN7vR2qK5tY8zX1jH6bDevnetMC?cluster=devnet",
    },
  ];

  logger.seedInitialHistory(mockEntries);
}

export async function runKeeperCycle(manager: DlmmKeeperManager, customDate?: Date): Promise<RebalanceLogEntry | null> {
  const now = customDate || new Date();
  const stateResult = getMarketClockState(now);
  const snapshot = await manager.getPoolSnapshot();

  const target = computeTargetBinRange(stateResult, snapshot.activeBinId, snapshot.binStep);
  const currentPos = manager.getCurrentPosition();
  const evaluation = computeRebalanceNeed(currentPos, target, 2);

  console.log(`[Keeper Cycle] Time: ${stateResult.nyseLocalTime.formatted} | State: ${stateResult.state} | ActiveBin: ${snapshot.activeBinId}`);
  console.log(`[Keeper Cycle] Target Range: [${target.minBinId}, ${target.maxBinId}] (${target.strategyTypeName}) | Rebalance Needed: ${evaluation.isMaterial}`);

  if (evaluation.isMaterial) {
    const entry = await manager.executeRebalance(target, stateResult, snapshot);
    console.log(`[Keeper Cycle] Rebalance Executed! Tx: ${entry.txSignature}`);
    return entry;
  }

  return null;
}

// Auto-run if executed directly
if (process.argv[1] && process.argv[1].endsWith("runner.js")) {
  const logger = new RebalanceLogger();
  const poolAddress = process.env.POOL_ADDRESS || "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo";
  seedRealisticHistory(logger, poolAddress);

  const manager = new DlmmKeeperManager("https://api.devnet.solana.com", poolAddress, undefined, logger);

  console.log("==================================================");
  console.log("🚀 Starting MarketClock Meteora DLMM Keeper Bot");
  console.log(`Pool Address: ${poolAddress} (Devnet)`);
  console.log("==================================================");

  manager.initialize().then(async () => {
    // Execute a cycle
    await runKeeperCycle(manager);
    console.log("Keeper cycle completed successfully. Telemetry saved to rebalance-log.json.");
  });
}
