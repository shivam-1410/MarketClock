import {
  MarketClockOptions,
  MarketClockState,
  MarketClockStateResult,
  NextTransitionInfo,
} from "./types.js";
import {
  createNyseDate,
  getNyseLocalDateTime,
  getSessionType,
  NYSE_EARLY_CLOSES_2026,
  getDateKey,
} from "./calendar.js";

const DEFAULT_DECAY_PERIOD_MINUTES = 10;
const PRE_CLOSE_WINDOW_MINUTES = 15;

/**
 * Finds the next trading day starting from a given date.
 */
export function getNextTradingDay(startDate: Date, timeZone = "America/New_York"): Date {
  const current = new Date(startDate.getTime());
  while (true) {
    current.setUTCDate(current.getUTCDate() + 1);
    const local = getNyseLocalDateTime(current, timeZone);
    const session = getSessionType(local);
    if (session === "REGULAR" || session === "EARLY_CLOSE") {
      return createNyseDate(local.year, local.month, local.day, 9, 30, 0, timeZone);
    }
  }
}

/**
 * Evaluates the MarketClock state machine for a specific point in time.
 */
export function getMarketClockState(
  date: Date = new Date(),
  options: MarketClockOptions = {}
): MarketClockStateResult {
  const timeZone = options.timeZone ?? "America/New_York";
  const decayPeriodMinutes = options.decayPeriodMinutes ?? DEFAULT_DECAY_PERIOD_MINUTES;

  const nyseLocalTime = getNyseLocalDateTime(date, timeZone);
  const sessionType = getSessionType(nyseLocalTime);
  const isMarketDay = sessionType === "REGULAR" || sessionType === "EARLY_CLOSE";

  // If not a market trading day (weekend or holiday), state is strictly CLOSED
  if (!isMarketDay) {
    const nextOpen = getNextTradingDay(date, timeZone);
    const remainingSeconds = Math.max(0, Math.floor((nextOpen.getTime() - date.getTime()) / 1000));

    return {
      state: "CLOSED",
      isMarketDay: false,
      sessionType,
      nyseLocalTime,
      sessionTimes: {
        openTime: nextOpen,
        coolDownEndTime: new Date(nextOpen.getTime() + decayPeriodMinutes * 60 * 1000),
        preCloseStartTime: new Date(nextOpen.getTime() + (6.5 * 60 - PRE_CLOSE_WINDOW_MINUTES) * 60 * 1000),
        closeTime: new Date(nextOpen.getTime() + 6.5 * 60 * 60 * 1000),
      },
      nextTransition: {
        targetState: "PRE_OPEN",
        targetTime: nextOpen,
        remainingSeconds,
      },
    };
  }

  // Determine market hours for today
  const dateKey = getDateKey(nyseLocalTime);
  const earlyCloseConfig = NYSE_EARLY_CLOSES_2026[dateKey];
  const closeHour = earlyCloseConfig ? earlyCloseConfig.closeHour : 16;
  const closeMinute = earlyCloseConfig ? earlyCloseConfig.closeMinute : 0;

  const openTime = createNyseDate(nyseLocalTime.year, nyseLocalTime.month, nyseLocalTime.day, 9, 30, 0, timeZone);
  const coolDownEndTime = new Date(openTime.getTime() + decayPeriodMinutes * 60 * 1000);
  const closeTime = createNyseDate(nyseLocalTime.year, nyseLocalTime.month, nyseLocalTime.day, closeHour, closeMinute, 0, timeZone);
  const preCloseStartTime = new Date(closeTime.getTime() - PRE_CLOSE_WINDOW_MINUTES * 60 * 1000);

  const t = date.getTime();
  const openMs = openTime.getTime();
  const coolDownEndMs = coolDownEndTime.getTime();
  const preCloseStartMs = preCloseStartTime.getTime();
  const closeMs = closeTime.getTime();

  let state: MarketClockState;
  let preCloseWideningFactor: number | undefined;
  let nextTransition: NextTransitionInfo;

  if (t < openMs) {
    // Before market opens on trading day
    state = "CLOSED";
    nextTransition = {
      targetState: "PRE_OPEN",
      targetTime: openTime,
      remainingSeconds: Math.max(0, Math.floor((openMs - t) / 1000)),
    };
  } else if (t === openMs) {
    // Exact instant of open
    state = "PRE_OPEN";
    nextTransition = {
      targetState: "COOL_DOWN",
      targetTime: new Date(openMs + 1000),
      remainingSeconds: 1,
    };
  } else if (t < coolDownEndMs) {
    // In post-open cooling period
    state = "COOL_DOWN";
    nextTransition = {
      targetState: "OPEN",
      targetTime: coolDownEndTime,
      remainingSeconds: Math.max(0, Math.floor((coolDownEndMs - t) / 1000)),
    };
  } else if (t < preCloseStartMs) {
    // Regular open session
    state = "OPEN";
    nextTransition = {
      targetState: "PRE_CLOSE",
      targetTime: preCloseStartTime,
      remainingSeconds: Math.max(0, Math.floor((preCloseStartMs - t) / 1000)),
    };
  } else if (t < closeMs) {
    // Pre-close widening session
    state = "PRE_CLOSE";
    const elapsed = t - preCloseStartMs;
    const duration = closeMs - preCloseStartMs;
    preCloseWideningFactor = Math.min(1.0, Math.max(0.0, elapsed / duration));

    nextTransition = {
      targetState: "CLOSED",
      targetTime: closeTime,
      remainingSeconds: Math.max(0, Math.floor((closeMs - t) / 1000)),
    };
  } else {
    // After close
    state = "CLOSED";
    const nextOpen = getNextTradingDay(date, timeZone);
    nextTransition = {
      targetState: "PRE_OPEN",
      targetTime: nextOpen,
      remainingSeconds: Math.max(0, Math.floor((nextOpen.getTime() - t) / 1000)),
    };
  }

  return {
    state,
    isMarketDay: true,
    sessionType,
    nyseLocalTime,
    sessionTimes: {
      openTime,
      coolDownEndTime,
      preCloseStartTime,
      closeTime,
    },
    preCloseWideningFactor,
    nextTransition,
  };
}
