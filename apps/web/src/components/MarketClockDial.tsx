"use client";

import React from "react";
import { MarketClockState, MarketClockStateResult } from "@market-clock/core";

interface MarketClockDialProps {
  stateResult: MarketClockStateResult;
  selectedTimeMode: string;
  onSelectTimeMode: (mode: string) => void;
}

export const MarketClockDial: React.FC<MarketClockDialProps> = ({
  stateResult,
  selectedTimeMode,
  onSelectTimeMode,
}) => {
  const { state, nyseLocalTime, nextTransition, isMarketDay, sessionType } = stateResult;

  // Map state to corresponding accent color and shadow
  const stateTheme = React.useMemo(() => {
    switch (state) {
      case "OPEN":
        return {
          name: "OPEN",
          label: "Regular Trading Session",
          accentHex: "#E8B34A",
          glowClass: "shadow-glow-open",
          bgBadge: "bg-state-open/10 border-state-open text-state-open",
          accentText: "text-state-open",
          dotColor: "#E8B34A",
        };
      case "PRE_CLOSE":
        return {
          name: "PRE_CLOSE",
          label: "Pre-Close Auction Widening",
          accentHex: "#E0793C",
          glowClass: "shadow-glow-preclose",
          bgBadge: "bg-state-preclose/10 border-state-preclose text-state-preclose",
          accentText: "text-state-preclose",
          dotColor: "#E0793C",
        };
      case "CLOSED":
        return {
          name: "CLOSED",
          label: "Reference Market Closed (Wide Range)",
          accentHex: "#3A5CE0",
          glowClass: "shadow-glow-closed",
          bgBadge: "bg-state-closed/15 border-state-closed text-[#6E8DFF]",
          accentText: "text-[#6E8DFF]",
          dotColor: "#3A5CE0",
        };
      case "PRE_OPEN":
      case "COOL_DOWN":
      default:
        return {
          name: state === "PRE_OPEN" ? "PRE_OPEN" : "COOL_DOWN",
          label: state === "PRE_OPEN" ? "Market Reopen (Buffer Tick)" : "Post-Open Volatility Cool-Down",
          accentHex: "#2FBF9E",
          glowClass: "shadow-glow-cooldown",
          bgBadge: "bg-state-cooldown/10 border-state-cooldown text-state-cooldown",
          accentText: "text-state-cooldown",
          dotColor: "#2FBF9E",
        };
    }
  }, [state]);

  // Format countdown string
  const formatCountdown = (totalSec: number) => {
    const hours = Math.floor(totalSec / 3600);
    const mins = Math.floor((totalSec % 3600) / 60);
    const secs = totalSec % 60;
    if (hours > 0) {
      return `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    }
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 1. Current NYSE time fraction and angle on 24-hour dial (0h = top, clockwise)
  const currentHour = nyseLocalTime.hour + nyseLocalTime.minute / 60 + nyseLocalTime.second / 3600;
  const currentAngleDeg = (currentHour / 24) * 360;

  // Helper to extract NYSE hour fraction (0.0 - 24.0) from Date
  const getNyseHourFraction = (d: Date) => {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: "America/New_York",
        hour: "numeric",
        minute: "numeric",
        second: "numeric",
        hour12: false,
      }).formatToParts(d);
      const h = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
      const m = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
      const s = parseInt(parts.find((p) => p.type === "second")?.value || "0", 10);
      return (h % 24) + m / 60 + s / 3600;
    } catch {
      return d.getUTCHours() - 4 + d.getUTCMinutes() / 60;
    }
  };

  // Phase start and end angles for the CURRENT phase (not static 24h)
  const { startAngleDeg, endAngleDeg } = React.useMemo(() => {
    let startH = 0;
    let endH = 24;

    const { sessionTimes, nextTransition } = stateResult;
    endH = getNyseHourFraction(nextTransition.targetTime);

    switch (state) {
      case "OPEN":
        startH = getNyseHourFraction(sessionTimes.coolDownEndTime);
        break;
      case "COOL_DOWN":
        startH = getNyseHourFraction(sessionTimes.openTime);
        break;
      case "PRE_CLOSE":
        startH = getNyseHourFraction(sessionTimes.preCloseStartTime);
        break;
      case "PRE_OPEN":
        startH = getNyseHourFraction(sessionTimes.openTime) - 15 / 3600;
        break;
      case "CLOSED":
      default:
        startH = getNyseHourFraction(sessionTimes.closeTime);
        break;
    }

    return {
      startAngleDeg: (startH / 24) * 360,
      endAngleDeg: (endH / 24) * 360,
    };
  }, [state, stateResult]);

  // Helper to convert time fraction to SVG polar coordinates
  // Center is (160, 160), radius is 115; 0 deg = top (00h)
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeClockArc = (centerX: number, centerY: number, radius: number, startAngle: number, endAngle: number) => {
    let sweep = endAngle - startAngle;
    while (sweep < 0) sweep += 360;
    if (sweep >= 360) sweep = 359.99;
    if (sweep < 0.5) return "";

    const start = polarToCartesian(centerX, centerY, radius, startAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle + sweep);
    const largeArcFlag = sweep > 180 ? "1" : "0";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 1, end.x, end.y].join(" ");
  };

  // Encoding 1: Elapsed arc vs Remaining arc in the CURRENT phase
  const elapsedArcPath = describeClockArc(160, 160, 115, startAngleDeg, currentAngleDeg);
  const remainingArcPath = describeClockArc(160, 160, 115, currentAngleDeg, endAngleDeg);

  // Next transition boundary marker position
  const transPt = polarToCartesian(160, 160, 115, endAngleDeg);

  // Encoding 2: Live Hand Pointer coordinates
  const handPt = polarToCartesian(160, 160, 96, currentAngleDeg);
  const backPt = polarToCartesian(160, 160, 16, currentAngleDeg + 180);

  return (
    <div className="flex flex-col items-center">
      {/* Radial Dial Container with soft atmospheric glow */}
      <div className="relative flex items-center justify-center">
        {/* Soft Radial Glow behind dial with 350ms crossfade on state change */}
        <div
          className="absolute -inset-8 md:-inset-14 rounded-full pointer-events-none blur-3xl opacity-30 transition-all duration-350 ease-out -z-10"
          style={{
            background: `radial-gradient(circle at 50% 50%, ${stateTheme.accentHex} 0%, transparent 68%)`,
          }}
        />

        <div
          className={`relative w-72 h-72 md:w-80 md:h-80 rounded-full bg-graphite-900 border border-graphite-800 flex items-center justify-center state-transition ${stateTheme.glowClass}`}
          style={{
            boxShadow: `0 0 50px -10px ${stateTheme.accentHex}40`,
          }}
        >
          <svg viewBox="0 0 320 320" className="w-full h-full">
            <defs>
              {/* Ambient inner dial gradient */}
              <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
                <stop offset="60%" stopColor="#12151A" />
                <stop offset="95%" stopColor={stateTheme.accentHex} stopOpacity="0.08" />
                <stop offset="100%" stopColor={stateTheme.accentHex} stopOpacity="0.20" />
              </radialGradient>
            </defs>

            {/* Dial Face Background */}
            <circle cx="160" cy="160" r="140" fill="url(#dialGlow)" stroke="#1C2028" strokeWidth="2" />

            {/* Base 24H Track Ring */}
            <circle cx="160" cy="160" r="115" fill="none" stroke="#1C2028" strokeWidth="8" />

            {/* Encoding 1: Arc showing elapsed vs. remaining time in CURRENT phase */}
            {/* Remaining portion of current phase */}
            {remainingArcPath && (
              <path
                d={remainingArcPath}
                fill="none"
                stroke={stateTheme.accentHex}
                strokeWidth="8"
                strokeOpacity="0.22"
                strokeLinecap="round"
                className="transition-all duration-350 ease-out"
              />
            )}

            {/* Elapsed portion of current phase */}
            {elapsedArcPath && (
              <path
                d={elapsedArcPath}
                fill="none"
                stroke={stateTheme.accentHex}
                strokeWidth="8"
                strokeLinecap="round"
                className="transition-all duration-350 ease-out"
              />
            )}

            {/* 24-Hour Markers */}
            {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
              const angle = (h / 24) * 360;
              const pt1 = polarToCartesian(160, 160, 127, angle);
              const pt2 = polarToCartesian(160, 160, 133, angle);
              const textPt = polarToCartesian(160, 160, 100, angle);
              return (
                <g key={h}>
                  <line x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y} stroke="#8A8F9B" strokeWidth="1.5" strokeOpacity="0.5" />
                  <text
                    x={textPt.x}
                    y={textPt.y + 3}
                    textAnchor="middle"
                    fill="#8A8F9B"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                    opacity="0.75"
                  >
                    {String(h).padStart(2, "0")}h
                  </text>
                </g>
              );
            })}

            {/* Next Transition Boundary Marker (Rotates smoothly with 350ms cubic-bezier transition) */}
            <g
              style={{
                transform: `rotate(${endAngleDeg}deg)`,
                transformOrigin: "160px 160px",
                transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <circle
                cx="160"
                cy="45"
                r="4.5"
                fill="#FFFFFF"
                stroke={stateTheme.accentHex}
                strokeWidth="2"
                className="transition-colors duration-350"
              />
            </g>

            {/* Encoding 2: Live Hand Pointer (Rotates smoothly to new hour with 350ms cubic-bezier transition) */}
            <g
              style={{
                transform: `rotate(${currentAngleDeg}deg)`,
                transformOrigin: "160px 160px",
                transition: "transform 350ms cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <line
                x1="160"
                y1="176"
                x2="160"
                y2="64"
                stroke={stateTheme.accentHex}
                strokeWidth="2.5"
                strokeLinecap="round"
                className="transition-colors duration-350"
              />
              <circle
                cx="160"
                cy="64"
                r="4"
                fill="#FFFFFF"
                stroke={stateTheme.accentHex}
                strokeWidth="2"
                className="transition-colors duration-350"
              />
            </g>

            {/* Center Hub */}
            <circle cx="160" cy="160" r="9" fill="#1C2028" stroke={stateTheme.accentHex} strokeWidth="2" className="transition-colors duration-350" />
            <circle cx="160" cy="160" r="3.5" fill="#E8E9EC" />
          </svg>

          {/* Center Overlay Time Badge (Tier 1 Display) */}
          <div className="absolute flex flex-col items-center pointer-events-none mt-20">
            <span className="font-mono text-[10px] font-medium text-graphite-400 tracking-widest uppercase">NYSE Time</span>
            <span className="font-mono text-base font-bold text-white tracking-tight">
              {String(nyseLocalTime.hour).padStart(2, "0")}:{String(nyseLocalTime.minute).padStart(2, "0")}:{String(nyseLocalTime.second).padStart(2, "0")} ET
            </span>
          </div>
        </div>
      </div>

      {/* One-line inline legend in small caps explaining dial encodings */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-5 text-[10px] font-mono tracking-widest uppercase text-graphite-500">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full" style={{ backgroundColor: stateTheme.accentHex }} />
          <span>Elapsed Phase</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 rounded-full opacity-35" style={{ backgroundColor: stateTheme.accentHex }} />
          <span>Remaining</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full border border-white" style={{ backgroundColor: stateTheme.accentHex }} />
          <span>Next Transition</span>
        </span>
      </div>

      {/* State Badge & Countdown Display */}
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold tracking-wide uppercase state-transition">
          <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ backgroundColor: stateTheme.dotColor }} />
          <span className={stateTheme.accentText}>{stateTheme.name}</span>
          <span className="text-graphite-500">•</span>
          <span className="text-graphite-100">{stateTheme.label}</span>
        </div>

        {/* Countdown (Tier 1 Display: Monospace, Largest, Highest Contrast) */}
        <div className="mt-3 flex items-baseline gap-2.5">
          <span className="font-mono text-4xl md:text-5xl font-extrabold tracking-tight text-white drop-shadow-[0_2px_16px_rgba(255,255,255,0.15)]">
            {formatCountdown(nextTransition.remainingSeconds)}
          </span>
          <span className="font-mono text-xs uppercase tracking-widest text-graphite-400 font-semibold">
            to {nextTransition.targetState}
          </span>
        </div>

        {/* Context metadata */}
        <div className="mt-1 flex items-center gap-3 text-xs text-graphite-500 font-sans">
          <span>Session: {sessionType}</span>
          <span>•</span>
          <span>Market Day: {isMarketDay ? "Active" : "Closed (Weekend/Holiday)"}</span>
        </div>
      </div>

      {/* Interactive Time-Travel / Mode Selector for Judges */}
      <div className="mt-5 flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-graphite-900/90 border border-graphite-800 rounded-xl">
        <span className="text-[11px] font-mono text-graphite-500 px-2 uppercase">Simulate:</span>
        {[
          { id: "LIVE", label: "Live Clock" },
          { id: "OPEN", label: "OPEN (11:30)" },
          { id: "PRE_CLOSE", label: "PRE_CLOSE (15:52)" },
          { id: "CLOSED", label: "CLOSED (20:00)" },
          { id: "PRE_OPEN", label: "PRE_OPEN (09:30)" },
          { id: "COOL_DOWN", label: "COOL_DOWN (09:35)" },
        ].map((mode) => {
          const isActive = selectedTimeMode === mode.id;
          return (
            <button
              key={mode.id}
              id={`simulate-btn-${mode.id.toLowerCase()}`}
              onClick={() => onSelectTimeMode(mode.id)}
              className={`px-2.5 py-1 text-xs font-mono rounded-lg transition-colors cursor-pointer ${
                isActive
                  ? "bg-graphite-800 text-graphite-100 border border-graphite-700 shadow-sm"
                  : "text-graphite-500 hover:text-graphite-100 hover:bg-graphite-850"
              }`}
            >
              {mode.label}
            </button>
          );
        })}
      </div>
    </div>
  );
};
