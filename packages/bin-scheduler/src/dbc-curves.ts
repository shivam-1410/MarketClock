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
  marketState: "OPEN" | "CLOSED" | "PRE_CLOSE" | "PRE_OPEN" | "COOL_DOWN" = "OPEN"
): GraduationMetrics {
  const progressPct = Math.min(100, Math.round((currentTvlUsd / config.graduationTargetTvlUsd) * 100));
  const isGraduated = progressPct >= 100;

  let graduationStage: GraduationMetrics["graduationStage"] = "DBC_DISCOVERY";
  if (isGraduated) {
    // If market is closed or in off-hours, route fees to DAMM v2 auto-compounding pool
    if (marketState === "CLOSED") {
      graduationStage = "DAMM_V2_COMPOUNDING";
    } else {
      // During active NYSE market hours, deploy into concentrated DLMM conviction pool
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
    dlmmStartRange: isGraduated ? [-10, 10] : [0, 0],
    projectedCompoundingApyPct: isGraduated ? 28.4 : 0,
  };
}
