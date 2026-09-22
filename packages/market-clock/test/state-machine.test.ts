import { describe, it, expect } from "vitest";
import {
  createNyseDate,
  getMarketClockState,
  getNyseLocalDateTime,
  NYSE_HOLIDAYS_2026,
} from "../src/index.js";

describe("MarketClock State Machine & 2026 Calendar", () => {
  describe("1. Daily Session State Cycle & Invariant Sequencing", () => {
    it("strictly follows CLOSED -> PRE_OPEN -> COOL_DOWN -> OPEN -> PRE_CLOSE -> CLOSED", () => {
      // Regular Wednesday: April 15, 2026
      const year = 2026;
      const month = 4;
      const day = 15;

      // 09:29:59 ET -> CLOSED
      const preMarket = createNyseDate(year, month, day, 9, 29, 59);
      const preState = getMarketClockState(preMarket);
      expect(preState.state).toBe("CLOSED");
      expect(preState.nextTransition.targetState).toBe("PRE_OPEN");

      // 09:30:00 ET -> PRE_OPEN (Snap tick)
      const openTick = createNyseDate(year, month, day, 9, 30, 0);
      const openTickState = getMarketClockState(openTick);
      expect(openTickState.state).toBe("PRE_OPEN");

      // 09:30:01 to 09:39:59 ET -> COOL_DOWN (Decay period = 10 min)
      const coolDownTick = createNyseDate(year, month, day, 9, 35, 0);
      const coolDownState = getMarketClockState(coolDownTick);
      expect(coolDownState.state).toBe("COOL_DOWN");
      expect(coolDownState.nextTransition.targetState).toBe("OPEN");

      // 09:40:00 ET -> Full OPEN
      const fullOpen = createNyseDate(year, month, day, 9, 40, 0);
      const fullOpenState = getMarketClockState(fullOpen);
      expect(fullOpenState.state).toBe("OPEN");
      expect(fullOpenState.nextTransition.targetState).toBe("PRE_CLOSE");

      // 15:44:59 ET -> Still OPEN
      const lateOpen = createNyseDate(year, month, day, 15, 44, 59);
      expect(getMarketClockState(lateOpen).state).toBe("OPEN");

      // 15:45:00 ET -> PRE_CLOSE starts
      const preCloseStart = createNyseDate(year, month, day, 15, 45, 0);
      const preCloseState = getMarketClockState(preCloseStart);
      expect(preCloseState.state).toBe("PRE_CLOSE");
      expect(preCloseState.preCloseWideningFactor).toBeCloseTo(0.0, 4);

      // 15:59:59 ET -> PRE_CLOSE ends
      const preCloseEnd = createNyseDate(year, month, day, 15, 59, 59);
      const preCloseEndState = getMarketClockState(preCloseEnd);
      expect(preCloseEndState.state).toBe("PRE_CLOSE");
      expect(preCloseEndState.preCloseWideningFactor).toBeGreaterThan(0.99);
      expect(preCloseEndState.preCloseWideningFactor).toBeLessThanOrEqual(1.0);

      // 16:00:00 ET -> CLOSED
      const closeBell = createNyseDate(year, month, day, 16, 0, 0);
      const closeBellState = getMarketClockState(closeBell);
      expect(closeBellState.state).toBe("CLOSED");
    });

    it("COOL_DOWN invariant: never transitions straight to OPEN without COOL_DOWN", () => {
      const day = 15;
      // Sample every minute from 09:25 to 09:45
      const states: string[] = [];
      for (let m = 25; m <= 45; m++) {
        const time = createNyseDate(2026, 4, day, 9, m, 0);
        states.push(getMarketClockState(time).state);
      }

      // Check that "COOL_DOWN" exists and occurs before "OPEN"
      const coolDownIdx = states.indexOf("COOL_DOWN");
      const openIdx = states.indexOf("OPEN");
      expect(coolDownIdx).toBeGreaterThan(-1);
      expect(openIdx).toBeGreaterThan(coolDownIdx);
    });
  });

  describe("2. Monotonic Widening in PRE_CLOSE (Never Overshoots)", () => {
    it("asserts widening factor increases monotonically from 0 to 1 and never overshoots", () => {
      const year = 2026;
      const month = 5;
      const day = 13; // Regular Wednesday

      let lastFactor = -1;
      // Check every 10 seconds across the 15-minute pre-close window (15:45:00 to 15:59:50)
      for (let s = 0; s < 15 * 60; s += 10) {
        const min = 45 + Math.floor(s / 60);
        const sec = s % 60;
        const time = createNyseDate(year, month, day, 15, min, sec);
        const stateResult = getMarketClockState(time);

        expect(stateResult.state).toBe("PRE_CLOSE");
        const factor = stateResult.preCloseWideningFactor;
        expect(factor).toBeDefined();
        expect(factor!).toBeGreaterThanOrEqual(lastFactor);
        expect(factor!).toBeGreaterThanOrEqual(0.0);
        expect(factor!).toBeLessThanOrEqual(1.0);
        lastFactor = factor!;
      }

      // Right before 16:00:00
      const finalSec = createNyseDate(year, month, day, 15, 59, 59);
      const finalResult = getMarketClockState(finalSec);
      expect(finalResult.preCloseWideningFactor!).toBeLessThanOrEqual(1.0);
      expect(finalResult.preCloseWideningFactor!).toBeGreaterThan(0.998);
    });
  });

  describe("3. 2026 NYSE Holidays", () => {
    it("is strictly CLOSED on Good Friday (2026-04-03)", () => {
      const midday = createNyseDate(2026, 4, 3, 12, 0, 0);
      const state = getMarketClockState(midday);
      expect(state.isMarketDay).toBe(false);
      expect(state.sessionType).toBe("HOLIDAY");
      expect(state.state).toBe("CLOSED");
      // Next open is Monday April 6, 2026 at 09:30 ET
      const targetLocal = getNyseLocalDateTime(state.nextTransition.targetTime);
      expect(targetLocal.year).toBe(2026);
      expect(targetLocal.month).toBe(4);
      expect(targetLocal.day).toBe(6);
      expect(targetLocal.hour).toBe(9);
      expect(targetLocal.minute).toBe(30);
    });

    it("is strictly CLOSED on all 2026 official NYSE holidays", () => {
      for (const [dateStr, name] of Object.entries(NYSE_HOLIDAYS_2026)) {
        const [y, m, d] = dateStr.split("-").map(Number);
        const testDate = createNyseDate(y, m, d, 11, 0, 0);
        const result = getMarketClockState(testDate);
        expect(result.isMarketDay).toBe(false);
        expect(result.sessionType).toBe("HOLIDAY");
        expect(result.state).toBe("CLOSED");
      }
    });

    it("is strictly CLOSED on weekends", () => {
      // Saturday May 16, 2026
      const saturday = createNyseDate(2026, 5, 16, 14, 0, 0);
      const satResult = getMarketClockState(saturday);
      expect(satResult.isMarketDay).toBe(false);
      expect(satResult.sessionType).toBe("WEEKEND");
      expect(satResult.state).toBe("CLOSED");

      // Sunday May 17, 2026
      const sunday = createNyseDate(2026, 5, 17, 14, 0, 0);
      const sunResult = getMarketClockState(sunday);
      expect(sunResult.isMarketDay).toBe(false);
      expect(sunResult.sessionType).toBe("WEEKEND");
      expect(sunResult.state).toBe("CLOSED");
    });
  });

  describe("4. 2026 Early Close Session (Day before Independence Day: 2026-07-02)", () => {
    it("closes at 13:00 ET and triggers PRE_CLOSE at 12:45 ET", () => {
      // 12:44:00 ET -> OPEN
      const openTime = createNyseDate(2026, 7, 2, 12, 44, 0);
      expect(getMarketClockState(openTime).state).toBe("OPEN");

      // 12:45:00 ET -> PRE_CLOSE
      const preCloseTime = createNyseDate(2026, 7, 2, 12, 45, 0);
      const preClose = getMarketClockState(preCloseTime);
      expect(preClose.state).toBe("PRE_CLOSE");
      expect(preClose.sessionType).toBe("EARLY_CLOSE");
      expect(preClose.nextTransition.targetState).toBe("CLOSED");

      // 13:00:00 ET -> CLOSED
      const closeTime = createNyseDate(2026, 7, 2, 13, 0, 0);
      expect(getMarketClockState(closeTime).state).toBe("CLOSED");
    });
  });

  describe("5. 2026 Daylight Saving Time (DST) Transitions", () => {
    it("correctly handles Spring Forward boundary (March 8, 2026)", () => {
      // Friday March 6, 2026 (EST, UTC-5)
      const friOpen = createNyseDate(2026, 3, 6, 9, 30, 0);
      // 09:30 EST is 14:30 UTC
      expect(friOpen.toISOString()).toBe("2026-03-06T14:30:00.000Z");

      // Monday March 9, 2026 (EDT, UTC-4 after Spring Forward on March 8)
      const monOpen = createNyseDate(2026, 3, 9, 9, 30, 0);
      // 09:30 EDT is 13:30 UTC
      expect(monOpen.toISOString()).toBe("2026-03-09T13:30:00.000Z");

      // Verify state machine identifies both as 09:30 ET opening tick
      expect(getMarketClockState(friOpen).state).toBe("PRE_OPEN");
      expect(getMarketClockState(monOpen).state).toBe("PRE_OPEN");
    });

    it("correctly handles Fall Back boundary (November 1, 2026)", () => {
      // Friday October 30, 2026 (EDT, UTC-4)
      const friOpen = createNyseDate(2026, 10, 30, 9, 30, 0);
      expect(friOpen.toISOString()).toBe("2026-10-30T13:30:00.000Z");

      // Monday November 2, 2026 (EST, UTC-5 after Fall Back on Nov 1)
      const monOpen = createNyseDate(2026, 11, 2, 9, 30, 0);
      expect(monOpen.toISOString()).toBe("2026-11-02T14:30:00.000Z");

      expect(getMarketClockState(friOpen).state).toBe("PRE_OPEN");
      expect(getMarketClockState(monOpen).state).toBe("PRE_OPEN");
    });
  });
});
