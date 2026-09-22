import { describe, it, expect } from "vitest";
import { createNyseDate, getMarketClockState } from "@market-clock/core";
import {
  computeTargetBinRange,
  computeRebalanceNeed,
  DlmmStrategyType,
} from "../src/index.js";

describe("Bin Scheduler Math & Invariants", () => {
  const activeBin = 1500;

  describe("1. State-to-Range Mapping", () => {
    it("assigns tight Curve for OPEN", () => {
      // 10:30 ET Wednesday
      const time = createNyseDate(2026, 4, 15, 10, 30, 0);
      const stateResult = getMarketClockState(time);
      expect(stateResult.state).toBe("OPEN");

      const target = computeTargetBinRange(stateResult, activeBin);
      expect(target.minBinId).toBe(1490);
      expect(target.maxBinId).toBe(1510);
      expect(target.totalBins).toBe(21);
      expect(target.strategyType).toBe(DlmmStrategyType.Curve);
      expect(target.strategyTypeName).toBe("Curve");
    });

    it("assigns wide Spot for CLOSED", () => {
      // 20:00 ET Wednesday (after close)
      const time = createNyseDate(2026, 4, 15, 20, 0, 0);
      const stateResult = getMarketClockState(time);
      expect(stateResult.state).toBe("CLOSED");

      const target = computeTargetBinRange(stateResult, activeBin);
      expect(target.minBinId).toBe(1420);
      expect(target.maxBinId).toBe(1580);
      expect(target.totalBins).toBe(161);
      expect(target.strategyType).toBe(DlmmStrategyType.Spot);
      expect(target.strategyTypeName).toBe("Spot");
    });

    it("assigns medium Curve for PRE_OPEN and COOL_DOWN", () => {
      // 09:30:00 ET -> PRE_OPEN
      const preOpenTime = createNyseDate(2026, 4, 15, 9, 30, 0);
      const preOpenResult = getMarketClockState(preOpenTime);
      expect(preOpenResult.state).toBe("PRE_OPEN");

      const preOpenTarget = computeTargetBinRange(preOpenResult, activeBin);
      expect(preOpenTarget.minBinId).toBe(1460); // ±40
      expect(preOpenTarget.maxBinId).toBe(1540);
      expect(preOpenTarget.strategyType).toBe(DlmmStrategyType.Curve);

      // 09:35:00 ET -> COOL_DOWN
      const coolDownTime = createNyseDate(2026, 4, 15, 9, 35, 0);
      const coolDownResult = getMarketClockState(coolDownTime);
      expect(coolDownResult.state).toBe("COOL_DOWN");

      const coolDownTarget = computeTargetBinRange(coolDownResult, activeBin);
      expect(coolDownTarget.minBinId).toBe(1465); // ±35
      expect(coolDownTarget.maxBinId).toBe(1535);
      expect(coolDownTarget.strategyType).toBe(DlmmStrategyType.Curve);
    });
  });

  describe("2. PRE_CLOSE Monotonic Widening & Overshoot Protection", () => {
    it("widens monotonically from ±20 to ±50 bins and never overshoots", () => {
      let lastHalfWidth = 0;

      // Sample every 15 seconds during PRE_CLOSE (15:45:00 to 15:59:45)
      for (let s = 0; s < 15 * 60; s += 15) {
        const min = 45 + Math.floor(s / 60);
        const sec = s % 60;
        const time = createNyseDate(2026, 4, 15, 15, min, sec);
        const stateResult = getMarketClockState(time);
        expect(stateResult.state).toBe("PRE_CLOSE");

        const target = computeTargetBinRange(stateResult, activeBin);
        expect(target.halfWidth).toBeGreaterThanOrEqual(lastHalfWidth);
        expect(target.halfWidth).toBeGreaterThanOrEqual(20);
        expect(target.halfWidth).toBeLessThanOrEqual(50);
        expect(target.minBinId).toBe(activeBin - target.halfWidth);
        expect(target.maxBinId).toBe(activeBin + target.halfWidth);

        lastHalfWidth = target.halfWidth;
      }
    });

    it("switches strategy from Curve to Spot as widening progresses", () => {
      // Early pre-close (15:46 ET)
      const earlyTime = createNyseDate(2026, 4, 15, 15, 46, 0);
      const earlyTarget = computeTargetBinRange(getMarketClockState(earlyTime), activeBin);
      expect(earlyTarget.strategyType).toBe(DlmmStrategyType.Curve);

      // Late pre-close (15:58 ET)
      const lateTime = createNyseDate(2026, 4, 15, 15, 58, 0);
      const lateTarget = computeTargetBinRange(getMarketClockState(lateTime), activeBin);
      expect(lateTarget.strategyType).toBe(DlmmStrategyType.Spot);
    });
  });

  describe("3. computeRebalanceNeed Filtering", () => {
    it("identifies material change when no current position exists", () => {
      const target = computeTargetBinRange(
        getMarketClockState(createNyseDate(2026, 4, 15, 10, 0, 0)),
        activeBin
      );
      const evalResult = computeRebalanceNeed(null, target);
      expect(evalResult.isMaterial).toBe(true);
    });

    it("suppresses rebalance if drift is below threshold", () => {
      const target = computeTargetBinRange(
        getMarketClockState(createNyseDate(2026, 4, 15, 10, 0, 0)),
        activeBin
      );
      // Current position is identical to target
      const currentPos = {
        minBinId: target.minBinId,
        maxBinId: target.maxBinId,
        strategyType: target.strategyType,
      };
      const evalResult = computeRebalanceNeed(currentPos, target, 2);
      expect(evalResult.isMaterial).toBe(false);

      // Current position has only 1 bin drift (within threshold 2)
      const driftedPos = {
        minBinId: target.minBinId - 1,
        maxBinId: target.maxBinId + 1,
        strategyType: target.strategyType,
      };
      const evalDrift = computeRebalanceNeed(driftedPos, target, 2);
      expect(evalDrift.isMaterial).toBe(false);
    });

    it("triggers rebalance when range drifts by threshold or strategyType changes", () => {
      const target = computeTargetBinRange(
        getMarketClockState(createNyseDate(2026, 4, 15, 10, 0, 0)),
        activeBin
      );

      // Range drifted by 4 bins
      const driftedPos = {
        minBinId: target.minBinId - 4,
        maxBinId: target.maxBinId + 4,
        strategyType: target.strategyType,
      };
      const evalDrift = computeRebalanceNeed(driftedPos, target, 2);
      expect(evalDrift.isMaterial).toBe(true);

      // Strategy changed even if bins match
      const strategyChangedPos = {
        minBinId: target.minBinId,
        maxBinId: target.maxBinId,
        strategyType: DlmmStrategyType.Spot,
      };
      const evalStrategy = computeRebalanceNeed(strategyChangedPos, target, 2);
      expect(evalStrategy.isMaterial).toBe(true);
      expect(evalStrategy.strategyTypeChanged).toBe(true);
    });
  });
});
