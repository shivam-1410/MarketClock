import { MarketClockStateResult } from "@market-clock/core";
import {
  BinScheduleConfig,
  CurrentPositionInfo,
  DlmmStrategyType,
  RebalanceEvaluation,
  ScheduledPositionRange,
} from "./types.js";

export const DEFAULT_BIN_CONFIG: Required<BinScheduleConfig> = {
  openHalfWidth: 10,
  preCloseStartHalfWidth: 20,
  preCloseEndHalfWidth: 50,
  closedHalfWidth: 80,
  preOpenHalfWidth: 40,
  coolDownHalfWidth: 35,
};

/**
 * Computes the target bin range and DLMM strategy for a given market clock state and active bin.
 */
export function computeTargetBinRange(
  stateResult: MarketClockStateResult,
  activeBin: number,
  binStep = 25,
  customConfig: BinScheduleConfig = {}
): ScheduledPositionRange {
  const config = { ...DEFAULT_BIN_CONFIG, ...customConfig };

  let halfWidth: number;
  let strategyType: DlmmStrategyType;

  switch (stateResult.state) {
    case "OPEN":
      halfWidth = config.openHalfWidth;
      strategyType = DlmmStrategyType.Curve;
      break;

    case "PRE_CLOSE": {
      const factor = Math.min(1.0, Math.max(0.0, stateResult.preCloseWideningFactor ?? 0.0));
      const rangeSpan = config.preCloseEndHalfWidth - config.preCloseStartHalfWidth;
      halfWidth = Math.round(config.preCloseStartHalfWidth + factor * rangeSpan);

      // Transition from Curve towards Spot as the close approaches
      strategyType = factor >= 0.5 ? DlmmStrategyType.Spot : DlmmStrategyType.Curve;
      break;
    }

    case "CLOSED":
      halfWidth = config.closedHalfWidth;
      strategyType = DlmmStrategyType.Spot;
      break;

    case "PRE_OPEN":
      // Snaps to cool-down width on the initial open tick, NOT directly to tight OPEN
      halfWidth = config.preOpenHalfWidth;
      strategyType = DlmmStrategyType.Curve;
      break;

    case "COOL_DOWN":
      halfWidth = config.coolDownHalfWidth;
      strategyType = DlmmStrategyType.Curve;
      break;

    default:
      halfWidth = config.closedHalfWidth;
      strategyType = DlmmStrategyType.Spot;
  }

  const minBinId = activeBin - halfWidth;
  const maxBinId = activeBin + halfWidth;
  const totalBins = maxBinId - minBinId + 1;

  const strategyNameMap: Record<DlmmStrategyType, "Spot" | "Curve" | "BidAsk"> = {
    [DlmmStrategyType.Spot]: "Spot",
    [DlmmStrategyType.Curve]: "Curve",
    [DlmmStrategyType.BidAsk]: "BidAsk",
  };

  return {
    minBinId,
    maxBinId,
    strategyType,
    strategyTypeName: strategyNameMap[strategyType],
    halfWidth,
    totalBins,
    activeBin,
    state: stateResult.state,
  };
}

/**
 * Checks whether a keeper rebalance is materially necessary to avoid wasteful rebalancing transactions.
 */
export function computeRebalanceNeed(
  currentPosition: CurrentPositionInfo | null | undefined,
  targetSchedule: ScheduledPositionRange,
  thresholdBins = 2
): RebalanceEvaluation {
  if (!currentPosition) {
    return {
      isMaterial: true,
      reason: "No active position detected; initial placement required.",
      diffMin: targetSchedule.minBinId,
      diffMax: targetSchedule.maxBinId,
      strategyTypeChanged: true,
    };
  }

  const diffMin = Math.abs(currentPosition.minBinId - targetSchedule.minBinId);
  const diffMax = Math.abs(currentPosition.maxBinId - targetSchedule.maxBinId);
  const strategyTypeChanged =
    currentPosition.strategyType !== undefined &&
    currentPosition.strategyType !== targetSchedule.strategyType;

  if (strategyTypeChanged) {
    return {
      isMaterial: true,
      reason: `Strategy type changed (${currentPosition.strategyType} -> ${targetSchedule.strategyType})`,
      diffMin,
      diffMax,
      strategyTypeChanged: true,
    };
  }

  if (diffMin >= thresholdBins || diffMax >= thresholdBins) {
    return {
      isMaterial: true,
      reason: `Bin range shifted significantly (diffMin: ${diffMin}, diffMax: ${diffMax}, threshold: ${thresholdBins})`,
      diffMin,
      diffMax,
      strategyTypeChanged: false,
    };
  }

  return {
    isMaterial: false,
    reason: "Range difference within drift threshold; no rebalance needed.",
    diffMin,
    diffMax,
    strategyTypeChanged: false,
  };
}
