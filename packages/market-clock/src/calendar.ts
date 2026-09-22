import { MarketSessionType, NyseLocalDateTime } from "./types.js";

/**
 * 2026 NYSE Official Holidays (exchange closed all day).
 * Keys are formatted as "YYYY-MM-DD" in US Eastern Time.
 */
export const NYSE_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "New Year's Day",
  "2026-01-19": "Martin Luther King, Jr. Day",
  "2026-02-16": "Washington's Birthday (Presidents' Day)",
  "2026-04-03": "Good Friday",
  "2026-05-25": "Memorial Day",
  "2026-06-19": "Juneteenth National Independence Day",
  "2026-07-03": "Independence Day (Observed)",
  "2026-09-07": "Labor Day",
  "2026-11-26": "Thanksgiving Day",
  "2026-12-25": "Christmas Day",
};

/**
 * 2026 NYSE Early Close Sessions (exchange closes at 13:00 ET instead of 16:00 ET).
 */
export const NYSE_EARLY_CLOSES_2026: Record<string, { name: string; closeHour: number; closeMinute: number }> = {
  "2026-07-02": { name: "Day before Independence Day", closeHour: 13, closeMinute: 0 },
  "2026-11-27": { name: "Day after Thanksgiving", closeHour: 13, closeMinute: 0 },
  "2026-12-24": { name: "Christmas Eve", closeHour: 13, closeMinute: 0 },
};

/**
 * Parses a Date into Eastern Time components using standard Intl.DateTimeFormat.
 */
export function getNyseLocalDateTime(date: Date, timeZone = "America/New_York"): NyseLocalDateTime {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    weekday: "short",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const map: Record<string, string> = {};
  for (const part of parts) {
    map[part.type] = part.value;
  }

  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  const year = parseInt(map.year, 10);
  const month = parseInt(map.month, 10);
  const day = parseInt(map.day, 10);
  const hour = parseInt(map.hour, 10);
  const minute = parseInt(map.minute, 10);
  const second = parseInt(map.second, 10);
  const dayOfWeek = weekdayMap[map.weekday] ?? 0;

  const yStr = String(year).padStart(4, "0");
  const mStr = String(month).padStart(2, "0");
  const dStr = String(day).padStart(2, "0");
  const hStr = String(hour).padStart(2, "0");
  const minStr = String(minute).padStart(2, "0");
  const sStr = String(second).padStart(2, "0");

  return {
    year,
    month,
    day,
    hour,
    minute,
    second,
    dayOfWeek,
    formatted: `${yStr}-${mStr}-${dStr} ${hStr}:${minStr}:${sStr} ET`,
  };
}

/**
 * Returns the date key formatted as "YYYY-MM-DD".
 */
export function getDateKey(nyseTime: NyseLocalDateTime): string {
  const yStr = String(nyseTime.year).padStart(4, "0");
  const mStr = String(nyseTime.month).padStart(2, "0");
  const dStr = String(nyseTime.day).padStart(2, "0");
  return `${yStr}-${mStr}-${dStr}`;
}

/**
 * Determines the market session type for a given date in NY local time.
 */
export function getSessionType(nyseTime: NyseLocalDateTime): MarketSessionType {
  // Weekend
  if (nyseTime.dayOfWeek === 0 || nyseTime.dayOfWeek === 6) {
    return "WEEKEND";
  }

  const dateKey = getDateKey(nyseTime);

  // Holiday
  if (NYSE_HOLIDAYS_2026[dateKey]) {
    return "HOLIDAY";
  }

  // Early Close
  if (NYSE_EARLY_CLOSES_2026[dateKey]) {
    return "EARLY_CLOSE";
  }

  return "REGULAR";
}

/**
 * Constructs a UTC Date corresponding to a specific year, month, day, hour, minute in America/New_York.
 * Uses iterative offset solving to guarantee exact DST accuracy.
 */
export function createNyseDate(
  year: number,
  month: number, // 1-12
  day: number,
  hour: number,
  minute: number,
  second = 0,
  timeZone = "America/New_York"
): Date {
  // Initial estimate assuming UTC
  const utcEstimate = new Date(Date.UTC(year, month - 1, day, hour, minute, second));
  
  // Calculate NY time of the estimate
  const nyseLocal = getNyseLocalDateTime(utcEstimate, timeZone);
  
  // Difference between target and current local representation
  const targetUtcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  const actualLocalUtcMs = Date.UTC(
    nyseLocal.year,
    nyseLocal.month - 1,
    nyseLocal.day,
    nyseLocal.hour,
    nyseLocal.minute,
    nyseLocal.second
  );

  const diffMs = targetUtcMs - actualLocalUtcMs;
  return new Date(utcEstimate.getTime() + diffMs);
}
