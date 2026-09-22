export type MarketClockState = "OPEN" | "PRE_CLOSE" | "CLOSED" | "PRE_OPEN" | "COOL_DOWN";

export type MarketSessionType = "REGULAR" | "EARLY_CLOSE" | "HOLIDAY" | "WEEKEND";

export interface NyseLocalDateTime {
  year: number;
  month: number; // 1 - 12
  day: number;
  hour: number;
  minute: number;
  second: number;
  dayOfWeek: number; // 0 (Sun) - 6 (Sat)
  formatted: string;
}

export interface MarketClockOptions {
  /**
   * Length of the post-open cooling down period in minutes.
   * Corresponds to the Meteora DLMM pool's decay_period.
   * Default: 10 minutes (600 seconds).
   */
  decayPeriodMinutes?: number;

  /**
   * Target reference timezone.
   * Default: "America/New_York".
   */
  timeZone?: string;
}

export interface NextTransitionInfo {
  targetState: MarketClockState;
  targetTime: Date;
  remainingSeconds: number;
}

export interface MarketClockStateResult {
  state: MarketClockState;
  isMarketDay: boolean;
  sessionType: MarketSessionType;
  nyseLocalTime: NyseLocalDateTime;
  sessionTimes: {
    openTime: Date;
    coolDownEndTime: Date;
    preCloseStartTime: Date;
    closeTime: Date;
  };
  /**
   * Monotonically increases from 0.0 at preCloseStartTime to 1.0 at closeTime.
   * Only present/relevant when state === "PRE_CLOSE".
   */
  preCloseWideningFactor?: number;
  nextTransition: NextTransitionInfo;
}
