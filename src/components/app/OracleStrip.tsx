"use client";

import { useMemo } from "react";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { formatUsd } from "@/lib/utils";

const MAX_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

export function OracleStrip() {
  const { rows, loading } = useOracleMarkets();

  const summary = useMemo(() => {
    const now = Date.now();
    let freshest = 0;
    let staleCount = 0;
    for (const r of rows) {
      if (!r.updatedAt) continue;
      freshest = Math.max(freshest, r.updatedAt);
      if (now - r.updatedAt > MAX_DELAY_MS) staleCount += 1;
    }
    return { freshest, staleCount };
  }, [rows]);

  const ageMin =
    summary.freshest > 0
      ? Math.max(0, Math.round((Date.now() - summary.freshest) / 60_000))
      : null;

  const tone =
    summary.staleCount > 0 ? "text-warn" : "text-ok";

  return (
    <div className="rounded-xl border border-rh-border bg-black/60 px-3 py-2 text-[11px]">
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
        <span className="font-medium uppercase tracking-[0.14em] text-rh-dim">
          Oracle
        </span>
        <span className={`font-medium ${tone}`}>
          {loading
            ? "Syncing…"
            : summary.staleCount > 0
              ? `${summary.staleCount} stale`
              : "Feeds healthy"}
        </span>
        {ageMin != null && (
          <span className="text-rh-muted">
            Tick{" "}
            <span className="tabular text-white">
              {ageMin < 60 ? `${ageMin}m` : `${Math.round(ageMin / 60)}h`}
            </span>
          </span>
        )}
      </div>
      <div className="mt-1.5 flex flex-wrap gap-x-2.5 gap-y-0.5">
        {rows.slice(0, 5).map((r) => (
          <span key={r.symbol} className="tabular text-rh-muted">
            {r.symbol}{" "}
            <span className="text-rh-lime">{formatUsd(r.oraclePrice)}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
