"use client";

import React from "react";

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 border-t border-graphite-800/80 bg-graphite-950/90 py-10 px-6 text-xs text-graphite-500 font-mono">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        {/* Core Invention Technical Summary */}
        <div className="p-4 rounded-xl bg-graphite-900 border border-graphite-800">
          <span className="text-[11px] text-state-open font-semibold uppercase tracking-wider block mb-1">
            Core DLMM Dynamic-Fee Invention Summary
          </span>
          <p className="font-sans text-xs text-graphite-100 leading-relaxed">
            DLMM dynamic fee is defined as <code>total_fee = base_fee + variable_fee</code>, where variable fee is bounded below by 0. The on-chain volatility accumulator resets to 0 exclusively when the elapsed time since the previous trade reaches <code>decay_period</code>. MarketClock’s state machine enforces a deliberate <code>COOL_DOWN</code> phase at market open to allow this accumulator decay to complete before narrowing liquidity into a tight <code>Curve</code>, preventing residual overnight/weekend volatility from being applied to a thin range.
          </p>
        </div>

        {/* Addresses & Reference Links */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
          <div className="space-y-1">
            <div>
              <span className="text-graphite-500">Meteora DLMM Program: </span>
              <a
                href="https://explorer.solana.com/address/LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-graphite-100 hover:text-state-open underline"
              >
                LBUZKhRxPF3XUpBCjp4YzTKgLccjZhTSDM9YuVaPwxo
              </a>
            </div>
            <div>
              <span className="text-graphite-500">Live Devnet Pool: </span>
              <a
                href="https://explorer.solana.com/address/118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo?cluster=devnet"
                target="_blank"
                rel="noopener noreferrer"
                className="text-graphite-100 hover:text-state-open underline"
              >
                118MVR5DAKXHkNtRMhyHyjuQZzDN44c3gGT1if1mYMo
              </a>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <a
              href="https://docs.meteora.ag/core-products/dlmm/formulas"
              target="_blank"
              rel="noopener noreferrer"
              className="text-graphite-500 hover:text-graphite-100 underline"
            >
              Meteora DLMM Formulas
            </a>
            <span>•</span>
            <a
              href="https://pyth.network/developers/hermes"
              target="_blank"
              rel="noopener noreferrer"
              className="text-graphite-500 hover:text-graphite-100 underline"
            >
              Pyth Hermes Reference
            </a>
            <span>•</span>
            <span className="text-graphite-500">Meteora Hackathon (Stocklana Track)</span>
          </div>
        </div>

        <div className="text-center text-[11px] text-graphite-500 pt-2 border-t border-graphite-850">
          MarketClock — Post-Graduation Schedule-Aware Liquidity Manager for Meteora DLMM
        </div>
      </div>
    </footer>
  );
};
