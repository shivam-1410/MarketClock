import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "fs";
import * as path from "path";
import { createNyseDate } from "@market-clock/core";
import { RebalanceLogger, DlmmKeeperManager, runKeeperCycle, seedRealisticHistory } from "../src/index.js";

describe("Keeper Bot & Telemetry Logger", () => {
  const testDataDir = path.resolve(process.cwd(), "test-data");
  const testLogFile = path.join(testDataDir, "test-rebalance-log.json");

  beforeEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDataDir)) {
      fs.rmSync(testDataDir, { recursive: true, force: true });
    }
  });

  it("seeds and retrieves structured rebalance history", () => {
    const logger = new RebalanceLogger(testLogFile);
    seedRealisticHistory(logger, "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo");

    const logs = logger.getLogs();
    expect(logs.length).toBeGreaterThanOrEqual(5);

    // Verify presence of each key phase
    const states = logs.map((l) => l.state);
    expect(states).toContain("CLOSED");
    expect(states).toContain("PRE_OPEN");
    expect(states).toContain("COOL_DOWN");
    expect(states).toContain("OPEN");
    expect(states).toContain("PRE_CLOSE");

    // Verify fields
    const first = logs[0];
    expect(first.txSignature).toBeDefined();
    expect(first.newRange).toBeDefined();
    expect(first.explorerUrl).toContain("explorer.solana.com");
  });

  it("executes simulated keeper rebalance cycle on schedule trigger", async () => {
    const logger = new RebalanceLogger(testLogFile);
    const manager = new DlmmKeeperManager(
      "https://api.devnet.solana.com",
      "118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo",
      undefined,
      logger
    );

    // Run cycle during OPEN
    const openDate = createNyseDate(2026, 4, 15, 11, 0, 0);
    const entry = await runKeeperCycle(manager, openDate);

    expect(entry).not.toBeNull();
    expect(entry?.state).toBe("OPEN");
    expect(entry?.strategyType).toBe("Curve");
    expect(entry?.txSignature).toContain("DevnetMC");
  });
});
