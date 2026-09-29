import { describe, it, expect } from "vitest";
import {
  calculateDbcPrice,
  calculateDbcTvlAnalytical,
  calculateDbcTvlNumerical,
  calculateGraduationRatio,
  simulateDbcDynamicFee,
  calculateDlmmMigrationBins,
  DbcCurveConfig,
} from "../src/dbc-curves.js";
import { DlmmStrategyType } from "../src/types.js";

const baseConfig: DbcCurveConfig = {
  id: "test_cfg",
  name: "Test Config",
  curveType: "SIGMOID",
  description: "Test description",
  initialPriceUsd: 100,
  targetPriceUsd: 200,
  graduationTargetTvlUsd: 150000,
  totalSupply: 1000000,
  steepness: 9.0,
  reserveToken: "USDC",
  baseFeeBps: 25,
  dynamicFeeFloorBps: 20,
  targetEquitySymbol: "xTSLA",
  equityCatalog: "xStocks",
};

describe("DBC Mathematical Curves & Closed-Form TVL Integration", () => {
  it("computes analytical TVL within 1% of composite numerical trapezoid integration across all curves", () => {
    const curveTypes: DbcCurveConfig["curveType"][] = ["FLAT", "EXPONENTIAL", "LONG", "SIGMOID"];

    for (const type of curveTypes) {
      const cfg: DbcCurveConfig = { ...baseConfig, curveType: type };
      const analyticalTvl = calculateDbcTvlAnalytical(cfg, 1.0);
      const numericalTvl = calculateDbcTvlNumerical(cfg, 1.0, 500);

      expect(analyticalTvl).toBeGreaterThan(0);
      expect(numericalTvl).toBeGreaterThan(0);

      // Relative difference between analytical and composite numerical should be < 0.5%
      const diffPct = Math.abs(analyticalTvl - numericalTvl) / analyticalTvl;
      expect(diffPct).toBeLessThan(0.005);
    }
  });

  it("inverts TVL deterministically to find exact graduation ratio", () => {
    const cfg: DbcCurveConfig = { ...baseConfig, graduationTargetTvlUsd: 120000 };
    const gradRatio = calculateGraduationRatio(cfg);

    expect(gradRatio).toBeGreaterThan(0);
    expect(gradRatio).toBeLessThanOrEqual(1.0);

    const tvlAtGradRatio = calculateDbcTvlAnalytical(cfg, gradRatio);
    expect(Math.abs(tvlAtGradRatio - 120000)).toBeLessThan(150);
  });
});

describe("DBC Dynamic Fee Schedule Simulation", () => {
  it("escalates dynamic fee floor significantly during CLOSED market hours to penalize toxic flow", () => {
    const feeClosed = simulateDbcDynamicFee(baseConfig, "CLOSED");
    const feeOpen = simulateDbcDynamicFee(baseConfig, "OPEN");

    expect(feeClosed.isToxicFlowPenalized).toBe(true);
    expect(feeOpen.isToxicFlowPenalized).toBe(false);

    // CLOSED fee should be much higher than OPEN base fee floor
    expect(feeClosed.effectiveFeeBps).toBeGreaterThan(feeOpen.effectiveFeeBps * 3);
    expect(feeOpen.effectiveFeeBps).toBe(baseConfig.baseFeeBps);
  });

  it("handles COOL_DOWN volatility decay gradually returning to floor", () => {
    const feeCoolingStart = simulateDbcDynamicFee(baseConfig, "COOL_DOWN", 0, 600);
    const feeCoolingMid = simulateDbcDynamicFee(baseConfig, "COOL_DOWN", 300, 600);
    const feeCoolingEnd = simulateDbcDynamicFee(baseConfig, "COOL_DOWN", 600, 600);

    expect(feeCoolingStart.effectiveFeeBps).toBeGreaterThan(feeCoolingMid.effectiveFeeBps);
    expect(feeCoolingMid.effectiveFeeBps).toBeGreaterThanOrEqual(feeCoolingEnd.effectiveFeeBps);
    expect(feeCoolingEnd.effectiveFeeBps).toBe(baseConfig.baseFeeBps);
  });
});

describe("DLMM Migration Bin Allocations", () => {
  it("calculates exact DLMM migration bin bounds matching Meteora formula", () => {
    const planOpen = calculateDlmmMigrationBins(baseConfig, "OPEN", 20);
    const planClosed = calculateDlmmMigrationBins(baseConfig, "CLOSED", 20);

    expect(planOpen.graduationPriceUsd).toBe(200);
    expect(planOpen.activeBinId).toBeGreaterThan(0);
    expect(planOpen.totalBins).toBe(21); // 2 * 10 + 1
    expect(planOpen.strategyType).toBe(DlmmStrategyType.Curve);

    expect(planClosed.totalBins).toBe(161); // 2 * 80 + 1
    expect(planClosed.strategyType).toBe(DlmmStrategyType.Spot);

    // Verify token amounts sum to TVL
    expect(planOpen.tokenAllocation.tokenYAmount).toBe(75000);
    expect(planOpen.solanaInstructionPayload.instruction).toBe("initializePositionAndAddLiquidityByStrategy");
  });
});
