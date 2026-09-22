import { MarketClockState } from "@market-clock/core";
import { DlmmStrategyType } from "@market-clock/bin-scheduler";

export interface RebalanceLogEntry {
  id: string;
  timestamp: string; // ISO 8601
  blockTime?: number;
  state: MarketClockState;
  nyseTimeFormatted: string;
  activeBin: number;
  activePrice: number;
  oldRange: [number, number] | null;
  newRange: [number, number];
  strategyType: "Spot" | "Curve" | "BidAsk";
  strategyTypeEnum: DlmmStrategyType;
  txSignature: string;
  baseFeeBps: number;
  dynamicFeeBps: number;
  totalFeeBps: number;
  volatilityAccumulator?: number;
  reason: string;
  status: "CONFIRMED" | "SIMULATED";
  poolAddress: string;
  explorerUrl: string;
}

export interface KeeperConfig {
  rpcUrl: string;
  poolAddress: string;
  keypairPath?: string;
  dryRun?: boolean;
  pollIntervalMs?: number;
  cluster?: "devnet" | "mainnet-beta";
}
