"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import {
  getDeskPrefs,
  setLtvPreset,
  addToWatchlist,
  removeFromWatchlist,
  type LtvPreset,
} from "@/lib/deskPrefs";
import { LISTED_TOKENS } from "@/lib/tokens";

export function WatchlistBar({ compact = false }: { compact?: boolean }) {
  const { address } = useAccount();
  const [prefs, setPrefs] = useState(() => getDeskPrefs(address));

  useEffect(() => {
    setPrefs(getDeskPrefs(address));
  }, [address]);

  const toggleWatchlist = (symbol: string) => {
    if (!address) return;
    if (prefs.watchlist.includes(symbol)) {
      removeFromWatchlist(address, symbol);
    } else {
      addToWatchlist(address, symbol);
    }
    setPrefs(getDeskPrefs(address));
  };

  const selectLtvPreset = (preset: LtvPreset) => {
    if (!address) return;
    setLtvPreset(address, preset);
    setPrefs(getDeskPrefs(address));
    window.dispatchEvent(
      new CustomEvent("borrowdesk:ltv-preset", { detail: preset }),
    );
  };

  const openTicket = (symbol: string) => {
    window.dispatchEvent(
      new CustomEvent("borrowdesk:ticket", {
        detail: { tab: "deposit", symbol },
      }),
    );
  };

  const presets: Array<{ id: LtvPreset; label: string; short: string }> = [
    { id: "conservative", label: "Conservative (40%)", short: "40%" },
    { id: "balanced", label: "Balanced (50%)", short: "50%" },
    { id: "max", label: "Max LTV", short: "Max" },
  ];

  const symbols = LISTED_TOKENS.slice(0, compact ? 10 : 12);

  return (
    <div className="panel panel-tight rounded-2xl">
      <div className="flex items-baseline justify-between gap-2">
        <div className="section-kicker">Watchlist</div>
        {!address && (
          <span className="text-[10px] text-rh-dim">Connect to save</span>
        )}
      </div>

      <div className={`mt-2 flex flex-wrap ${compact ? "gap-1.5" : "gap-2"}`}>
        {symbols.map((token) => {
          const on = prefs.watchlist.includes(token.symbol);
          return (
            <button
              key={token.symbol}
              type="button"
              onClick={() => toggleWatchlist(token.symbol)}
              onDoubleClick={() => openTicket(token.symbol)}
              title={
                !address
                  ? "Connect wallet to save watchlist"
                  : on
                    ? "Click to remove · double-click to open ticket"
                    : "Click to add · double-click to open ticket"
              }
              className={`chip transition ${compact ? "px-2 py-0.5 text-[11px]" : ""} ${
                on
                  ? "border border-rh-lime/40 bg-rh-lime/20 text-rh-lime"
                  : "border border-rh-border bg-black text-rh-muted hover:border-white/30"
              }`}
            >
              {token.symbol}
            </button>
          );
        })}
      </div>

      <div className={`${compact ? "mt-3" : "mt-4"}`}>
        <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
          LTV preset
        </div>
        <div className={`mt-1.5 grid grid-cols-3 ${compact ? "gap-1" : "gap-1.5"}`}>
          {presets.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => selectLtvPreset(preset.id)}
              className={`rounded-lg px-1.5 py-1.5 text-center text-[11px] font-medium transition ${
                prefs.ltvPreset === preset.id
                  ? "bg-rh-lime text-rh-on-lime"
                  : "border border-rh-border bg-black text-rh-muted hover:border-white/30 hover:text-white"
              }`}
              title={preset.label}
            >
              {compact ? preset.short : preset.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
