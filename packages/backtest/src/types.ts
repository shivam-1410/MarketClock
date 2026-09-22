export interface BacktestScenarioConfig {
  scenarioName: string;
  isSynthetic: boolean;
  tokenPair: string;
  initialTvlUsd: number;
  startPrice: number;
  priceShockPct: number; // e.g. +3.8% or -4.5%
  binStepBps: number; // e.g. 25 bps = 0.25% per bin
  baseFeeBps: number; // e.g. 15 bps
  weekendVolumeUsd: number; // off-hours arbitrage flow
}

export interface StrategyPerformance {
  strategyName: string;
  isBaseline: boolean;
  initialTvlUsd: number;
  finalTvlUsd: number;
  feesEarnedUsd: number;
  feesEarnedPct: number;
  adverseSelectionLossUsd: number;
  adverseSelectionLossPct: number;
  netPnlUsd: number;
  netPnlPct: number;
  maxDrawdownPct: number;
  capitalEfficiencyRatio: number;
  binsTraversed: number;
  summary: string;
}

export interface BacktestComparisonReport {
  scenarioName: string;
  disclaimer: string;
  tokenPair: string;
  timeWindow: string;
  priceMovement: {
    startPrice: number;
    endPrice: number;
    priceShockPct: number;
    shockEvent: string;
  };
  marketClock: StrategyPerformance;
  staticBaseline: StrategyPerformance;
  delta: {
    netPnlAdvantageUsd: number;
    netPnlAdvantagePct: number;
    adverseSelectionAvoidedUsd: number;
    feeImprovementUsd: number;
  };
  generatedAt: string;
}
