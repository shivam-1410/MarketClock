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

  // Calculate current hand angle on a 24-hour clock face (0h at top = -90 deg)
  const hourFraction = (nyseLocalTime.hour + nyseLocalTime.minute / 60 + nyseLocalTime.second / 3600) / 24;
  const handAngleDeg = hourFraction * 360 - 90;

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

  // Helper to convert time fraction to SVG polar coordinates
  // Center is (160, 160), radius is 115
  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  };

  const describeArc = (x: number, y: number, radius: number, startAngle: number, endAngle: number) => {
    const start = polarToCartesian(x, y, radius, endAngle);
    const end = polarToCartesian(x, y, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    return ["M", start.x, start.y, "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y].join(" ");
  };

  // 24-hour circle angles (00:00 = 0 deg, 09:30 = 142.5 deg, 16:00 = 240 deg)
  const sessionArc = describeArc(160, 160, 115, (9.5 / 24) * 360, (16.0 / 24) * 360);
  const preCloseArc = describeArc(160, 160, 115, (15.75 / 24) * 360, (16.0 / 24) * 360);
  const coolDownArc = describeArc(160, 160, 115, (9.5 / 24) * 360, ((9.5 + 10 / 60) / 24) * 360);

  return (
    <div className="flex flex-col items-center">
      {/* Radial Dial Container with dynamic state-driven glow */}
      <div
        className={`relative w-72 h-72 md:w-80 md:h-80 rounded-full bg-graphite-900 border border-graphite-800 flex items-center justify-center state-transition ${stateTheme.glowClass}`}
        style={{
          boxShadow: `0 0 60px -10px ${stateTheme.accentHex}40`,
        }}
      >
        <svg viewBox="0 0 320 320" className="w-full h-full">
          <defs>
            {/* Ambient inner glow */}
            <radialGradient id="dialGlow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#12151A" />
              <stop offset="95%" stopColor={stateTheme.accentHex} stopOpacity="0.12" />
              <stop offset="100%" stopColor={stateTheme.accentHex} stopOpacity="0.25" />
            </radialGradient>
          </defs>

          {/* Dial Face Background */}
          <circle cx="160" cy="160" r="140" fill="url(#dialGlow)" stroke="#1C2028" strokeWidth="2" />

          {/* Full 24H Track Ring */}
          <circle cx="160" cy="160" r="115" fill="none" stroke="#1C2028" strokeWidth="8" />

          {/* Regular NYSE Session Arc (09:30 - 16:00 ET) */}
          <path d={sessionArc} fill="none" stroke="#E8B34A" strokeWidth="8" strokeOpacity="0.4" strokeLinecap="round" />

          {/* Cool-Down Arc Marker (09:30 - 09:40 ET) */}
          <path d={coolDownArc} fill="none" stroke="#2FBF9E" strokeWidth="9" strokeLinecap="round" />

          {/* Pre-Close Arc Marker (15:45 - 16:00 ET) */}
          <path d={preCloseArc} fill="none" stroke="#E0793C" strokeWidth="9" strokeLinecap="round" />

          {/* 24-Hour Markers */}
          {[0, 3, 6, 9, 12, 15, 18, 21].map((h) => {
            const angle = (h / 24) * 360 - 90;
            const pt1 = polarToCartesian(160, 160, 128, angle + 90);
            const pt2 = polarToCartesian(160, 160, 134, angle + 90);
            const textPt = polarToCartesian(160, 160, 100, angle + 90);
            return (
              <g key={h}>
                <line x1={pt1.x} y1={pt1.y} x2={pt2.x} y2={pt2.y} stroke="#8A8F9B" strokeWidth="1.5" strokeOpacity="0.6" />
                <text
                  x={textPt.x}
                  y={textPt.y + 3}
                  textAnchor="middle"
                  fill="#8A8F9B"
                  fontSize="9"
                  fontFamily="JetBrains Mono, monospace"
                  opacity="0.8"
                >
                  {String(h).padStart(2, "0")}h
                </text>
              </g>
            );
          })}

          {/* Market Open Pin (09:30) */}
          {(() => {
            const pt = polarToCartesian(160, 160, 115, (9.5 / 24) * 360);
            return <circle cx={pt.x} cy={pt.y} r="3" fill="#2FBF9E" />;
          })()}

          {/* Market Close Pin (16:00) */}
          {(() => {
            const pt = polarToCartesian(160, 160, 115, (16.0 / 24) * 360);
            return <circle cx={pt.x} cy={pt.y} r="3" fill="#E0793C" />;
          })()}

          {/* Live Hand Pointer */}
          {(() => {
            const handAngleRad = (handAngleDeg * Math.PI) / 180;
            const handLength = 98;
            const tipX = 160 + handLength * Math.cos(handAngleRad);
            const tipY = 160 + handLength * Math.sin(handAngleRad);

            const backX = 160 - 18 * Math.cos(handAngleRad);
            const backY = 160 - 18 * Math.sin(handAngleRad);

            return (
              <g className="state-transition">
                <line
                  x1={backX}
                  y1={backY}
                  x2={tipX}
                  y2={tipY}
                  stroke={stateTheme.accentHex}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
                <circle cx={tipX} cy={tipY} r="4" fill={stateTheme.accentHex} />
              </g>
            );
          })()}

          {/* Center Hub */}
          <circle cx="160" cy="160" r="10" fill="#1C2028" stroke={stateTheme.accentHex} strokeWidth="2" />
          <circle cx="160" cy="160" r="4" fill="#E8E9EC" />
        </svg>

        {/* Center Overlay Time Badge */}
        <div className="absolute flex flex-col items-center pointer-events-none mt-24">
          <span className="font-mono text-xs text-graphite-500 tracking-wider uppercase">NYSE Time</span>
          <span className="font-mono text-sm font-semibold text-graphite-100">
            {String(nyseLocalTime.hour).padStart(2, "0")}:{String(nyseLocalTime.minute).padStart(2, "0")}:{String(nyseLocalTime.second).padStart(2, "0")} ET
          </span>
        </div>
      </div>

      {/* State Badge & Countdown Display */}
      <div className="mt-6 flex flex-col items-center text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono font-semibold tracking-wide uppercase state-transition">
          <span className="w-2 h-2 rounded-full animate-pulse-slow" style={{ backgroundColor: stateTheme.dotColor }} />
          <span className={stateTheme.accentText}>{stateTheme.name}</span>
          <span className="text-graphite-500">•</span>
          <span className="text-graphite-100">{stateTheme.label}</span>
        </div>

        {/* Countdown */}
        <div className="mt-3 flex items-baseline gap-2">
          <span className="font-mono text-3xl md:text-4xl font-bold tracking-tight text-graphite-100">
            {formatCountdown(nextTransition.remainingSeconds)}
          </span>
          <span className="font-mono text-xs uppercase tracking-wider text-graphite-500">
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
