import * as fs from "fs";
import * as path from "path";
import { RebalanceLogEntry } from "./types.js";

const KEEPER_DATA_DIR = path.resolve(process.cwd(), "data");
const KEEPER_LOG_FILE = path.join(KEEPER_DATA_DIR, "rebalance-log.json");

// Optional path for web app mirror
const WEB_DATA_DIR = path.resolve(process.cwd(), "../../apps/web/public/data");
const WEB_LOG_FILE = path.join(WEB_DATA_DIR, "rebalance-log.json");

export class RebalanceLogger {
  private logPath: string;

  constructor(customPath?: string) {
    this.logPath = customPath || KEEPER_LOG_FILE;
    this.ensureDir(path.dirname(this.logPath));
  }

  private ensureDir(dir: string): void {
    if (!fs.existsSync(dir)) {
      try {
        fs.mkdirSync(dir, { recursive: true });
      } catch (err) {
        // Ignore if directory already exists
      }
    }
  }

  public getLogs(): RebalanceLogEntry[] {
    if (!fs.existsSync(this.logPath)) {
      return [];
    }
    try {
      const data = fs.readFileSync(this.logPath, "utf-8");
      return JSON.parse(data) as RebalanceLogEntry[];
    } catch {
      return [];
    }
  }

  public appendLog(entry: RebalanceLogEntry): void {
    const logs = this.getLogs();
    // Prepend latest entry so index 0 is most recent
    logs.unshift(entry);

    const serialized = JSON.stringify(logs, null, 2);
    this.ensureDir(path.dirname(this.logPath));
    fs.writeFileSync(this.logPath, serialized, "utf-8");

    // Mirror to web directory if it exists or can be created
    try {
      this.ensureDir(WEB_DATA_DIR);
      fs.writeFileSync(WEB_LOG_FILE, serialized, "utf-8");
    } catch {
      // Non-critical mirror failure
    }
  }

  public seedInitialHistory(seedEntries: RebalanceLogEntry[]): void {
    if (!fs.existsSync(this.logPath) || this.getLogs().length === 0) {
      this.ensureDir(path.dirname(this.logPath));
      fs.writeFileSync(this.logPath, JSON.stringify(seedEntries, null, 2), "utf-8");
      try {
        this.ensureDir(WEB_DATA_DIR);
        fs.writeFileSync(WEB_LOG_FILE, JSON.stringify(seedEntries, null, 2), "utf-8");
      } catch {
        // Ignore
      }
    }
  }
}
