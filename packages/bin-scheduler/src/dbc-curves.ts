import { MarketClockState } from "@market-clock/core";
import { DlmmStrategyType } from "./types.js";

/**
 * Novel DBC (Dynamic Bonding Curve) mathematical configurations for tokenized equity launches.
 * Integrates price discovery tailored for xStocks, Backpack Onchain, and Ondo RFQ catalogs.
 */

export type DbcCurveType = "FLAT" | "EXPONENTIAL" | "LONG" | "SIGMOID";

export interface DbcCurveConfig {
  id: string;
  name: string;
  curveType: DbcCurveType;
  description: string;
  initialPriceUsd: number;
  targetPriceUsd: number;
  graduationTargetTvlUsd: number;
  totalSupply: number;
  steepness: number;
  reserveToken: "USDC" | "SOL";
  baseFeeBps: number;
  dynamicFeeFloorBps: number;
  targetEquitySymbol: string;
  equityCatalog: "xStocks" | "Backpack Onchain" | "Ondo RFQ" | "Stocklana";
}

export interface DbcCurvePoint {
  supplyPct: number;
  tokensSold: number;
  priceUsd: number;
  tvlRaisedUsd: number;
  tvlRaisedAnalyticalUsd: number;
  slippageBps: number;
  feeBps: number;
}

export interface GraduationMetrics {
  currentTvlUsd: number;
  targetTvlUsd: number;
  progressPct: number;
  isGraduated: boolean;
  tokensSold: number;
  remainingTokens: number;
  graduationStage: "DBC_DISCOVERY" | "DLMM_CONVICTION_MIGRATION" | "DAMM_V2_COMPOUNDING";
  dlmmStartRange: [number, number];
  projectedCompoundingApyPct: number;
}

export interface DynamicFeeSimulationResult {
  marketState: MarketClockState;
  baseFeeBps: number;
  dynamicFeeFloorBps: number;
  offMarketPenaltyBps: number;
  effectiveFeeBps: number;
  effectiveFeePct: number;
  isToxicFlowPenalized: boolean;
  volatilityDecayRemainingSeconds: number;
  rationale: string;
}

export interface DlmmMigrationPlan {
  configId: string;
  targetSymbol: string;
  reserveToken: "USDC" | "SOL";
  graduationPriceUsd: number;
  graduationTvlUsd: number;
  activeBinId: number;
  minBinId: number;
  maxBinId: number;
  halfWidth: number;
  totalBins: number;
  binStepBps: number;
  minPriceUsd: number;
  maxPriceUsd: number;
  strategyType: DlmmStrategyType;
  strategyName: "Spot" | "Curve" | "BidAsk";
  marketState: MarketClockState;
  tokenAllocation: {
    tokenXPercent: number;
    tokenYPercent: number;
    tokenXAmount: number;
    tokenYAmount: number;
  };
  solanaInstructionPayload: {
    programId: string;
    instruction: "initializePositionAndAddLiquidityByStrategy";
    poolAddress: string;
    activeId: number;
    minBinId: number;
    maxBinId: number;
    strategyType: number;
    baseFeeBps: number;
    liquidityUsd: number;
  };
}

/**
 * Calculate price at a given sold supply ratio [0..1]
 */
export function calculateDbcPrice(config: DbcCurveConfig, ratio: number): number {
  const r = Math.max(0, Math.min(1, ratio));
  const { curveType, initialPriceUsd, targetPriceUsd, steepness } = config;

  switch (curveType) {
    case "FLAT": {
      // Linear shallow slope providing massive depth with minimal slippage for RFQ/thin-float
      return initialPriceUsd + (targetPriceUsd - initialPriceUsd) * Math.pow(r, 1.2);
    }
    case "EXPONENTIAL": {
      // Exponential curve rewarding high conviction early buyers
      const k = steepness || 2.4;
      const factor = (Math.exp(k * r) - 1) / (Math.exp(k) - 1);
      return initialPriceUsd + (targetPriceUsd - initialPriceUsd) * factor;
    }
    case "LONG": {
      // Long runway curve: extended low-price discovery with late acceleration
      const power = steepness || 3.2;
      return initialPriceUsd + (targetPriceUsd - initialPriceUsd) * Math.pow(r, power);
    }
    case "SIGMOID":
    default: {
      // Bounded Equity S-Curve: centered on fair-value anchor with floor & cap dampeners
      const midpoint = 0.45;
      const k = steepness || 9;
      const sig = 1 / (1 + Math.exp(-k * (r - midpoint)));
      const sigMin = 1 / (1 + Math.exp(k * midpoint));
      const sigMax = 1 / (1 + Math.exp(-k * (1 - midpoint)));
      const normalizedSig = (sig - sigMin) / (sigMax - sigMin);
      return initialPriceUsd + (targetPriceUsd - initialPriceUsd) * normalizedSig;
    }
  }
}

/**
 * Analytical (closed-form) TVL raised integration for supply ratio r in [0, 1].
 * Calculates exact integral ∫ P(s) ds from s=0 to s=r*totalSupply.
 */
export function calculateDbcTvlAnalytical(config: DbcCurveConfig, ratio: number): number {
  const r = Math.max(0, Math.min(1, ratio));
  if (r === 0) return 0;

  const { initialPriceUsd: p0, targetPriceUsd: p1, totalSupply, steepness, curveType } = config;
  const deltaP = p1 - p0;

  let integralNormalized = 0; // ∫_0^r f(u) du

  switch (curveType) {
    case "FLAT": {
      // f(u) = u^1.2 => ∫_0^r u^1.2 du = r^2.2 / 2.2
      integralNormalized = Math.pow(r, 2.2) / 2.2;
      break;
    }
    case "EXPONENTIAL": {
      // f(u) = (e^(k*u) - 1) / (e^k - 1)
      // ∫_0^r f(u) du = ((e^(k*r) - 1)/k - r) / (e^k - 1)
      const k = steepness || 2.4;
      const denom = Math.exp(k) - 1;
      const num = (Math.exp(k * r) - 1) / k - r;
      integralNormalized = denom !== 0 ? num / denom : r;
      break;
    }
    case "LONG": {
      // f(u) = u^p => ∫_0^r u^p du = r^(p+1) / (p+1)
      const p = steepness || 3.2;
      integralNormalized = Math.pow(r, p + 1) / (p + 1);
      break;
    }
    case "SIGMOID":
    default: {
      // f(u) = (σ(k*(u - m)) - σ(-k*m)) / (σ(k*(1 - m)) - σ(-k*m))
      // with σ(x) = 1 / (1 + e^-x)
      // ∫ σ(k*(u - m)) du = (1/k) * ln(1 + e^(k*(u - m)))
      const m = 0.45;
      const k = steepness || 9.0;
      const sigMin = 1 / (1 + Math.exp(k * m)); // σ(-k*m)
      const sigMax = 1 / (1 + Math.exp(-k * (1 - m))); // σ(k*(1-m))
      const denom = sigMax - sigMin;

      const logTermAtR = Math.log(1 + Math.exp(k * (r - m)));
      const logTermAt0 = Math.log(1 + Math.exp(-k * m));
      const sigIntegral = (logTermAtR - logTermAt0) / k;

      integralNormalized = denom !== 0 ? (sigIntegral - sigMin * r) / denom : r;
      break;
    }
  }

  const tvl = totalSupply * (p0 * r + deltaP * integralNormalized);
  return Math.max(0, +tvl.toFixed(2));
}

/**
 * Numerical TVL integration using composite trapezoidal rule for cross-verification.
 */
export function calculateDbcTvlNumerical(config: DbcCurveConfig, ratio: number, steps: number = 200): number {
  const r = Math.max(0, Math.min(1, ratio));
  if (r === 0) return 0;
  let totalTvl = 0;
  const deltaR = r / steps;
  let prevPrice = calculateDbcPrice(config, 0);

  for (let i = 1; i <= steps; i++) {
    const curR = i * deltaR;
    const curPrice = calculateDbcPrice(config, curR);
    const avgPrice = (prevPrice + curPrice) / 2;
    const deltaTokens = config.totalSupply * deltaR;
    totalTvl += deltaTokens * avgPrice;
    prevPrice = curPrice;
  }
  return +totalTvl.toFixed(2);
}

/**
 * Inverts the TVL function to find the exact sold supply ratio [0..1] required to reach target TVL.
 * Employs deterministic Newton-Raphson with bisection fallback.
 */
export function calculateGraduationRatio(config: DbcCurveConfig, targetTvlUsd?: number): number {
  const target = targetTvlUsd ?? config.graduationTargetTvlUsd;
  const maxTvl = calculateDbcTvlAnalytical(config, 1.0);
  if (target >= maxTvl) return 1.0;
  if (target <= 0) return 0.0;

  let low = 0;
  let high = 1.0;
  let r = target / maxTvl;

  for (let iter = 0; iter < 25; iter++) {
    const tvl = calculateDbcTvlAnalytical(config, r);
    const diff = tvl - target;
    if (Math.abs(diff) < 0.01) break;

    if (diff > 0) {
      high = r;
    } else {
      low = r;
    }

    const price = calculateDbcPrice(config, r);
    const derivative = config.totalSupply * price;
    if (derivative > 0) {
      const nextR = r - diff / derivative;
      if (nextR > low && nextR < high) {
        r = nextR;
        continue;
      }
    }
    r = (low + high) / 2;
  }

  return +Math.max(0, Math.min(1, r)).toFixed(4);
}

/**
 * Simulates dynamic fee behavior across different market clock states.
 * Verifies that during CLOSED hours, fee floors rise to penalize off-market toxic arbitrage,
 * while during OPEN hours fees decay to base fee floor.
 */
export function simulateDbcDynamicFee(
  config: DbcCurveConfig,
  marketState: MarketClockState = "OPEN",
  decayElapsedSeconds: number = 600,
  decayPeriodSeconds: number = 600
): DynamicFeeSimulationResult {
  const baseFee = config.baseFeeBps;
  let penaltyBps = 0;
  let decayRemaining = 0;
  let isToxicFlowPenalized = false;
  let rationale = "";

  switch (marketState) {
    case "CLOSED": {
      // Exchange closed: overnight, weekend, or holiday.
      // Triple dynamic floor + 80 bps base to penalize off-market toxic arbitrage and news front-running.
      penaltyBps = Math.round(config.dynamicFeeFloorBps * 3.0 + 80);
      isToxicFlowPenalized = true;
      rationale = "Wall Street is CLOSED. Off-market toxic flow penalty applied (+80-140 bps) to protect LP capital.";
      break;
    }
    case "PRE_CLOSE": {
      // 15:45 - 16:00 ET: widens monotonically to absorb MOC cross
      penaltyBps = Math.round(config.dynamicFeeFloorBps * 1.5);
      isToxicFlowPenalized = true;
      rationale = "PRE_CLOSE: Widening bin range and ramping dynamic fee to absorb market-on-close volume.";
      break;
    }
    case "PRE_OPEN": {
      // Opening bell tick: maximum volatility accumulator
      penaltyBps = Math.round(config.dynamicFeeFloorBps * 2.5);
      decayRemaining = decayPeriodSeconds;
      isToxicFlowPenalized = true;
      rationale = "PRE_OPEN: Opening bell volatility spike detected. Range buffered at ±40 bins with peak dynamic fee.";
      break;
    }
    case "COOL_DOWN": {
      // Post-open 10 min window: fee decays linearly towards 0
      const remainingSec = Math.max(0, decayPeriodSeconds - decayElapsedSeconds);
      decayRemaining = remainingSec;
      const decayRatio = remainingSec / Math.max(1, decayPeriodSeconds);
      penaltyBps = Math.round(config.dynamicFeeFloorBps * 1.8 * decayRatio);
      isToxicFlowPenalized = penaltyBps > 0;
      rationale = `COOL_DOWN: Volatility accumulator decaying to 0 (${remainingSec}s remaining). Fee returning to floor.`;
      break;
    }
    case "OPEN":
    default: {
      // Normal continuous trading: zero penalty, fee at absolute floor = baseFee
      penaltyBps = 0;
      decayRemaining = 0;
      isToxicFlowPenalized = false;
      rationale = "OPEN: Continuous session trading. Volatility accumulator is 0; fees at minimum base floor.";
      break;
    }
  }

  const effectiveFeeBps = baseFee + penaltyBps;

  return {
    marketState,
    baseFeeBps: baseFee,
    dynamicFeeFloorBps: config.dynamicFeeFloorBps,
    offMarketPenaltyBps: penaltyBps,
    effectiveFeeBps,
    effectiveFeePct: +(effectiveFeeBps / 100).toFixed(2),
    isToxicFlowPenalized,
    volatilityDecayRemainingSeconds: decayRemaining,
    rationale,
  };
}

/**
 * Calculates exact bin allocations and synthesized instruction payload for DLMM migration
 * upon hitting the DBC graduation TVL threshold.
 */
export function calculateDlmmMigrationBins(
  config: DbcCurveConfig,
  marketState: MarketClockState = "OPEN",
  binStepBps: number = 20,
  poolAddress: string = "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo"
): DlmmMigrationPlan {
  const graduationPriceUsd = calculateDbcPrice(config, 1.0);
  const binStepFrac = binStepBps / 10000;

  // Meteora DLMM formula: Price = (1 + binStep)^activeBinId
  const activeBinId = Math.round(Math.log(graduationPriceUsd) / Math.log(1 + binStepFrac));

  let halfWidth = 10;
  let strategyType = DlmmStrategyType.Curve;
  let strategyName: "Spot" | "Curve" | "BidAsk" = "Curve";

  switch (marketState) {
    case "CLOSED":
      halfWidth = 80;
      strategyType = DlmmStrategyType.Spot;
      strategyName = "Spot";
      break;
    case "PRE_CLOSE":
      halfWidth = 50;
      strategyType = DlmmStrategyType.Spot;
      strategyName = "Spot";
      break;
    case "PRE_OPEN":
      halfWidth = 40;
      strategyType = DlmmStrategyType.Curve;
      strategyName = "Curve";
      break;
    case "COOL_DOWN":
      halfWidth = 35;
      strategyType = DlmmStrategyType.Curve;
      strategyName = "Curve";
      break;
    case "OPEN":
    default:
      halfWidth = 10;
      strategyType = DlmmStrategyType.Curve;
      strategyName = "Curve";
      break;
  }

  const minBinId = activeBinId - halfWidth;
  const maxBinId = activeBinId + halfWidth;
  const totalBins = 2 * halfWidth + 1;

  const minPriceUsd = +(Math.pow(1 + binStepFrac, minBinId)).toFixed(4);
  const maxPriceUsd = +(Math.pow(1 + binStepFrac, maxBinId)).toFixed(4);

  const tokenXAllocationPct = 50;
  const tokenYAllocationPct = 50;
  const tokenYAmount = config.graduationTargetTvlUsd * 0.5;
  const tokenXAmount = (config.graduationTargetTvlUsd * 0.5) / graduationPriceUsd;

  return {
    configId: config.id,
    targetSymbol: config.targetEquitySymbol,
    reserveToken: config.reserveToken,
    graduationPriceUsd: +graduationPriceUsd.toFixed(2),
    graduationTvlUsd: config.graduationTargetTvlUsd,
    activeBinId,
    minBinId,
    maxBinId,
    halfWidth,
    totalBins,
    binStepBps,
    minPriceUsd,
    maxPriceUsd,
    strategyType,
    strategyName,
    marketState,
    tokenAllocation: {
      tokenXPercent: tokenXAllocationPct,
      tokenYPercent: tokenYAllocationPct,
      tokenXAmount: +tokenXAmount.toFixed(2),
      tokenYAmount: +tokenYAmount.toFixed(2),
    },
    solanaInstructionPayload: {
      programId: "LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo",
      instruction: "initializePositionAndAddLiquidityByStrategy",
      poolAddress,
      activeId: activeBinId,
      minBinId,
      maxBinId,
      strategyType: strategyType as number,
      baseFeeBps: config.baseFeeBps,
      liquidityUsd: config.graduationTargetTvlUsd,
    },
  };
}

/**
 * Generates curve data points for SVG charting and interactive simulator
 */
export function generateDbcCurvePoints(config: DbcCurveConfig, steps: number = 40): DbcCurvePoint[] {
  const points: DbcCurvePoint[] = [];
  let cumulativeTvl = 0;

  for (let i = 0; i <= steps; i++) {
    const supplyPct = (i / steps) * 100;
    const ratio = i / steps;
    const priceUsd = calculateDbcPrice(config, ratio);
    const tokensSold = (config.totalSupply * supplyPct) / 100;

    // Approximate TVL through numerical integration
    if (i > 0) {
      const prevPrice = points[i - 1].priceUsd;
      const deltaTokens = tokensSold - points[i - 1].tokensSold;
      const avgPrice = (prevPrice + priceUsd) / 2;
      cumulativeTvl += deltaTokens * avgPrice;
    }

    const analyticalTvl = calculateDbcTvlAnalytical(config, ratio);

    // Slippage estimation based on curve derivative
    const dP = i > 0 ? (priceUsd - points[i - 1].priceUsd) / priceUsd : 0;
    const slippageBps = Math.min(500, Math.round(dP * 10000 * (config.curveType === "FLAT" ? 0.3 : 1.2)));

    // Dynamic fee floor adjustment based on slope
    const feeBps = Math.round(config.baseFeeBps + (slippageBps / 500) * config.dynamicFeeFloorBps);

    points.push({
      supplyPct,
      tokensSold,
      priceUsd: +priceUsd.toFixed(2),
      tvlRaisedUsd: +cumulativeTvl.toFixed(2),
      tvlRaisedAnalyticalUsd: +analyticalTvl.toFixed(2),
      slippageBps,
      feeBps,
    });
  }

  return points;
}

/**
 * Evaluates graduation state across the end-to-end stack:
 * DBC -> DLMM Conviction Pool -> DAMM v2 Compounding
 */
export function evaluateDbcGraduation(
  config: DbcCurveConfig,
  currentTvlUsd: number,
  marketState: MarketClockState = "OPEN"
): GraduationMetrics {
  const progressPct = Math.min(100, Math.round((currentTvlUsd / config.graduationTargetTvlUsd) * 100));
  const isGraduated = progressPct >= 100;

  let graduationStage: GraduationMetrics["graduationStage"] = "DBC_DISCOVERY";
  if (isGraduated) {
    if (marketState === "CLOSED") {
      graduationStage = "DAMM_V2_COMPOUNDING";
    } else {
      graduationStage = "DLMM_CONVICTION_MIGRATION";
    }
  }

  const tokensSold = (config.totalSupply * progressPct) / 100;
  const remainingTokens = config.totalSupply - tokensSold;

  return {
    currentTvlUsd,
    targetTvlUsd: config.graduationTargetTvlUsd,
    progressPct,
    isGraduated,
    tokensSold,
    remainingTokens,
    graduationStage,
    dlmmStartRange: isGraduated ? (marketState === "CLOSED" ? [-80, 80] : [-10, 10]) : [0, 0],
    projectedCompoundingApyPct: isGraduated ? 28.4 : 0,
  };
}
