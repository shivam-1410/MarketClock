import { MarketClockState } from "@market-clock/core";

/**
 * Matches Meteora DLMM StrategyType enum.
 */
export enum DlmmStrategyType {
  Spot = 0,
  Curve = 1,
  BidAsk = 2,
}

export interface BinScheduleConfig {
  /**
   * Half-width (±bins) during OPEN state.
   * Default: 10 bins (total 21 bins).
   */
  openHalfWidth?: number;

  /**
   * Starting half-width at the beginning of PRE_CLOSE.
   * Default: 20 bins.
   */
  preCloseStartHalfWidth?: number;

  /**
   * Ending half-width at the end of PRE_CLOSE right before close.
   * Default: 50 bins.
   */
  preCloseEndHalfWidth?: number;

  /**
   * Fixed half-width during CLOSED state.
   * Default: 80 bins (~±12% price cushion for typical 15-25 bps binStep).
   */
  closedHalfWidth?: number;

  /**
   * Half-width for PRE_OPEN (initial tick).
   * Default: 40 bins.
   */
  preOpenHalfWidth?: number;

  /**
   * Half-width during COOL_DOWN period.
   * Default: 35 bins.
   */
  coolDownHalfWidth?: number;
}

export interface ScheduledPositionRange {
  minBinId: number;
  maxBinId: number;
  strategyType: DlmmStrategyType;
  strategyTypeName: "Spot" | "Curve" | "BidAsk";
  halfWidth: number;
  totalBins: number;
  activeBin: number;
  state: MarketClockState;
}

export interface CurrentPositionInfo {
  minBinId: number;
  maxBinId: number;
  strategyType?: DlmmStrategyType;
}

export interface RebalanceEvaluation {
  isMaterial: boolean;
  reason: string;
  diffMin: number;
  diffMax: number;
  strategyTypeChanged: boolean;
}
