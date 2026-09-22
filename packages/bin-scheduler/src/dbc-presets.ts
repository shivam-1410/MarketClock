import { DbcCurveConfig } from "./dbc-curves.js";

export interface DbcPresetItem {
  id: string;
  badge: string;
  name: string;
  tagline: string;
  category: "EQUITY" | "RFQ" | "CONVICTION" | "YIELD";
  config: DbcCurveConfig;
  stats: {
    graduationsCount: number;
    avgSlippagePct: number;
    volatilityProtectionScore: number; // 0-100
    avgTimeBeforeBellHours: number;
    creatorFeeSplitPct: number; // e.g. 80
  };
  highlightFeatures: string[];
  cliCommand: string;
}

export const DBC_PRESET_MARKETPLACE: DbcPresetItem[] = [
  {
    id: "preset_equity_fair_launch",
    badge: "MOST POPULAR",
    name: "Equity Pre-IPO Fair Launch",
    tagline: "Sigmoid price discovery bounded to Wall Street reference fair value with anti-sniping protection.",
    category: "EQUITY",
    config: {
      id: "cfg_equity_fair",
      name: "Equity Bounded S-Curve",
      curveType: "SIGMOID",
      description: "Bounded price discovery centered on real-time Pyth reference anchor with anti-gap shields.",
      initialPriceUsd: 165.0,
      targetPriceUsd: 195.0,
      graduationTargetTvlUsd: 100000,
      totalSupply: 1000000,
      steepness: 9.0,
      reserveToken: "USDC",
      baseFeeBps: 25,
      dynamicFeeFloorBps: 20,
      targetEquitySymbol: "xTSLA",
      equityCatalog: "xStocks",
    },
    stats: {
      graduationsCount: 142,
      avgSlippagePct: 0.18,
      volatilityProtectionScore: 98,
      avgTimeBeforeBellHours: 1.5,
      creatorFeeSplitPct: 80,
    },
    highlightFeatures: [
      "Pyth reference fair-value bounds (±8% corridor)",
      "100% auto-migration into Meteora DLMM Conviction Pool",
      "Dynamic fee ramps up during pre-open volatility ticks",
      "Compatible with xStocks and Ondo equity wrappers",
    ],
    cliCommand: "npx @market-clock/cli launch --preset equity-fair-launch --pair xTSLA/USDC --migration-dlmm",
  },
  {
    id: "preset_thin_float_rfq",
    badge: "DEEP LIQUIDITY",
    name: "Thin-Float RFQ Depth Booster",
    tagline: "Ultra-flat shallow curve ensuring low price impact for micro-cap or illiquid equity offerings.",
    category: "RFQ",
    config: {
      id: "cfg_thin_rfq",
      name: "Flat RFQ Shelf Curve",
      curveType: "FLAT",
      description: "Linear depth optimized for OTC/RFQ tokenized stock orders with minimal execution friction.",
      initialPriceUsd: 48.0,
      targetPriceUsd: 52.5,
      graduationTargetTvlUsd: 75000,
      totalSupply: 500000,
      steepness: 1.2,
      reserveToken: "USDC",
      baseFeeBps: 15,
      dynamicFeeFloorBps: 10,
      targetEquitySymbol: "xNVDA",
      equityCatalog: "Ondo RFQ",
    },
    stats: {
      graduationsCount: 89,
      avgSlippagePct: 0.08,
      volatilityProtectionScore: 92,
      avgTimeBeforeBellHours: 2.2,
      creatorFeeSplitPct: 85,
    },
    highlightFeatures: [
      "Sub-10 bps price impact on institutional block trades",
      "Flat curve with massive reserve buffer",
      "Zero toxic flow leak before NYSE regular hours",
      "Direct RFQ integration with Backpack and Ondo conduits",
    ],
    cliCommand: "npx @market-clock/cli launch --preset thin-float-rfq --pair xNVDA/USDC --curve flat",
  },
  {
    id: "preset_conviction_exponential",
    badge: "HIGH CONVICTION",
    name: "High-Conviction Exponential IPO",
    tagline: "Accelerating price trajectory that heavily rewards early backers and locks long-term DLMM liquidity.",
    category: "CONVICTION",
    config: {
      id: "cfg_conviction_expo",
      name: "Exponential Conviction Curve",
      curveType: "EXPONENTIAL",
      description: "Aggressive slope for hot tokenized stock debuts, automatically converting into locked DLMM bins.",
      initialPriceUsd: 10.0,
      targetPriceUsd: 45.0,
      graduationTargetTvlUsd: 150000,
      totalSupply: 2000000,
      steepness: 2.6,
      reserveToken: "SOL",
      baseFeeBps: 30,
      dynamicFeeFloorBps: 40,
      targetEquitySymbol: "xAAPL",
      equityCatalog: "Backpack Onchain",
    },
    stats: {
      graduationsCount: 64,
      avgSlippagePct: 0.45,
      volatilityProtectionScore: 84,
      avgTimeBeforeBellHours: 0.8,
      creatorFeeSplitPct: 75,
    },
    highlightFeatures: [
      "Incentivizes early commitment before pre-market closes",
      "80% of raised TVL locked into DLMM Curve bins for 180 days",
      "Surge fee capture distributed to early token stakers",
      "Native Backpack Onchain wallet compatibility",
    ],
    cliCommand: "npx @market-clock/cli launch --preset conviction-exponential --pair xAAPL/SOL --lock-days 180",
  },
  {
    id: "preset_after_hours_harvester",
    badge: "PASSIVE YIELD",
    name: "After-Hours Volatility Harvester",
    tagline: "Extended runway DBC that seamlessly rolls into an auto-compounding DAMM v2 pool overnight.",
    category: "YIELD",
    config: {
      id: "cfg_after_hours_yield",
      name: "Long Runway Yield Curve",
      curveType: "LONG",
      description: "Extended bonding curve optimized for continuous 24/7 trading that compounds fees when NYSE is shut.",
      initialPriceUsd: 100.0,
      targetPriceUsd: 125.0,
      graduationTargetTvlUsd: 120000,
      totalSupply: 1500000,
      steepness: 3.5,
      reserveToken: "USDC",
      baseFeeBps: 20,
      dynamicFeeFloorBps: 80,
      targetEquitySymbol: "xSPY",
      equityCatalog: "Stocklana",
    },
    stats: {
      graduationsCount: 118,
      avgSlippagePct: 0.22,
      volatilityProtectionScore: 96,
      avgTimeBeforeBellHours: 3.0,
      creatorFeeSplitPct: 80,
    },
    highlightFeatures: [
      "Overnight auto-routing into Meteora DAMM v2 pools",
      "28.4% projected APY from compounding off-market dynamic fees",
      "Automatic defensive widening at 15:52 PRE_CLOSE",
      "Continuous schedule sync with Wall Street holiday calendar",
    ],
    cliCommand: "npx @market-clock/cli launch --preset after-hours-yield --pair xSPY/USDC --yield-compound",
  },
];
