import { describe, it, expect } from "vitest";
import { runGapSimulation } from "../src/index.js";

describe("MarketClock vs Static DLMM Gap Simulation", () => {
  it("generates complete report with explicit synthetic disclosure", () => {
    const report = runGapSimulation({ priceShockPct: 3.5 });

    expect(report.disclaimer).toContain("HONEST DISCLOSURE");
    expect(report.scenarioName).toContain("SYNTHETIC SCENARIO");
    expect(report.marketClock).toBeDefined();
    expect(report.staticBaseline).toBeDefined();
    expect(report.delta).toBeDefined();
  });

  it("proves MarketClock reduces adverse selection compared to static baseline", () => {
    const report = runGapSimulation({ priceShockPct: 4.0 });

    // MarketClock adverse selection loss must be significantly lower than static
    expect(report.marketClock.adverseSelectionLossUsd).toBeLessThan(
      report.staticBaseline.adverseSelectionLossUsd
    );
    expect(report.delta.adverseSelectionAvoidedUsd).toBeGreaterThan(0);
  });

  it("proves MarketClock captures higher dynamic fees during off-hours volatility", () => {
    const report = runGapSimulation({ priceShockPct: 3.8, weekendVolumeUsd: 200000 });

    expect(report.marketClock.feesEarnedUsd).toBeGreaterThan(
      report.staticBaseline.feesEarnedUsd
    );
    expect(report.delta.feeImprovementUsd).toBeGreaterThan(0);
  });

  it("proves net PnL advantage is positive over the weekend gap", () => {
    const report = runGapSimulation({ priceShockPct: 3.8 });

    expect(report.delta.netPnlAdvantageUsd).toBeGreaterThan(400); // Over $400 net advantage on $100k TVL in single weekend
    expect(report.delta.netPnlAdvantagePct).toBeGreaterThan(0.4);
  });
});
