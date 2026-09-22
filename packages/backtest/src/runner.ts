import * as fs from "fs";
import * as path from "path";
import { runGapSimulation } from "./simulator.js";

const DATA_DIR = path.resolve(process.cwd(), "data");
const OUTPUT_FILE = path.join(DATA_DIR, "backtest-results.json");

const WEB_DATA_DIR = path.resolve(process.cwd(), "../../apps/web/public/data");
const WEB_OUTPUT_FILE = path.join(WEB_DATA_DIR, "backtest-results.json");

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    try {
      fs.mkdirSync(dir, { recursive: true });
    } catch {
      // Ignore
    }
  }
}

export function generateAndSaveReport() {
  const report = runGapSimulation();

  ensureDir(DATA_DIR);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8");

  try {
    ensureDir(WEB_DATA_DIR);
    fs.writeFileSync(WEB_OUTPUT_FILE, JSON.stringify(report, null, 2), "utf-8");
  } catch {
    // Ignore
  }

  console.log("======================================================================");
  console.log("📊 MARKETCLOCK COMPARATIVE BACKTEST / GAP SIMULATION REPORT");
  console.log(`Scenario: ${report.scenarioName}`);
  console.log(`Window:   ${report.timeWindow}`);
  console.log(`Asset:    ${report.tokenPair}`);
  console.log(`Shock:    ${report.priceMovement.priceShockPct}% (${report.priceMovement.startPrice} -> ${report.priceMovement.endPrice})`);
  console.log("======================================================================");
  console.log("");
  console.log("METRIC                       STATIC BASELINE        MARKETCLOCK DYNAMIC");
  console.log("----------------------------------------------------------------------");
  console.log(`Initial TVL                  $${report.staticBaseline.initialTvlUsd.toLocaleString()}            $${report.marketClock.initialTvlUsd.toLocaleString()}`);
  console.log(`Fee Capture                  $${report.staticBaseline.feesEarnedUsd} (+${report.staticBaseline.feesEarnedPct}%)       $${report.marketClock.feesEarnedUsd} (+${report.marketClock.feesEarnedPct}%)`);
  console.log(`Adverse Selection / Toxic IL -$${report.staticBaseline.adverseSelectionLossUsd} (-${report.staticBaseline.adverseSelectionLossPct}%)     -$${report.marketClock.adverseSelectionLossUsd} (-${report.marketClock.adverseSelectionLossPct}%)`);
  console.log(`Net Weekend PnL              -$${Math.abs(report.staticBaseline.netPnlUsd)} (${report.staticBaseline.netPnlPct}%)      -$${Math.abs(report.marketClock.netPnlUsd)} (${report.marketClock.netPnlPct}%)`);
  console.log(`Max Drawdown                 ${report.staticBaseline.maxDrawdownPct}%                  ${report.marketClock.maxDrawdownPct}%`);
  console.log("----------------------------------------------------------------------");
  console.log(`NET ADVANTAGE: +$${report.delta.netPnlAdvantageUsd} (+${report.delta.netPnlAdvantagePct}%) return preserved!`);
  console.log(`ADVERSE SELECTION AVOIDED: $${report.delta.adverseSelectionAvoidedUsd}`);
  console.log(`FEE REVENUE BOOST:         +$${report.delta.feeImprovementUsd}`);
  console.log("======================================================================");
  console.log(`* ${report.disclaimer}`);
  console.log(`Report saved to: ${OUTPUT_FILE}`);

  return report;
}

if (process.argv[1] && process.argv[1].endsWith("runner.js")) {
  generateAndSaveReport();
}
