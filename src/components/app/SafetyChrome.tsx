"use client";

import { useMemo } from "react";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { cn } from "@/lib/utils";

const MAX_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

type Chip = {
  label: string;
  detail: string;
  ok: boolean;
  warn?: boolean;
};

/** Always-on pass/fail chrome: Fresh oracle · Healthy after · Pool can fund */
export function SafetyChrome() {
  const { rows, loading } = useOracleMarkets();
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;
  const m = live.liveMetrics;

  const chips: Chip[] = useMemo(() => {
    const now = Date.now();
    let stale = 0;
    let anyTick = false;
    for (const r of rows) {
      if (!r.updatedAt) continue;
      anyTick = true;
      if (now - r.updatedAt > MAX_DELAY_MS) stale += 1;
    }
    const freshOk = !loading && anyTick && stale === 0;

    const room = Math.max(0, m.borrowPowerUsd - m.debtUsd);
    const healthyOk = !live.ready || m.healthy;
    const healthyWarn = live.ready && m.healthy && m.healthFactor < 1.2;

    const poolOk = poolUsdg > 0.01;
    const poolWarn = poolOk && room > 0 && poolUsdg < Math.min(room, 1);

    return [
      {
        label: "Fresh oracle",
        detail: loading
          ? "Syncing…"
          : !anyTick
            ? "No ticks yet"
            : stale > 0
              ? `${stale} feed(s) past 4d`
              : "Within 4d policy",
        ok: freshOk,
        warn: !loading && anyTick && stale > 0,
      },
      {
        label: "Healthy after",
        detail: !live.ready
          ? "Connect to check"
          : m.debtUsd <= 0
            ? "No debt"
            : m.healthy
              ? `HF ${Number.isFinite(m.healthFactor) ? m.healthFactor.toFixed(2) : "∞"}`
              : "Below liq band",
        ok: healthyOk,
        warn: healthyWarn,
      },
      {
        label: "Pool can fund",
        detail:
          poolUsdg <= 0
            ? "No idle USDG"
            : `$${poolUsdg.toFixed(2)} idle${
                live.ready ? ` · $${room.toFixed(2)} room` : ""
              }`,
        ok: poolOk,
        warn: poolWarn,
      },
    ];
  }, [rows, loading, live.ready, m, poolUsdg]);

  return (
    <div data-tour="safety" className="grid grid-cols-1 gap-1.5">
      {chips.map((c) => (
        <div
          key={c.label}
          className={cn(
            "flex items-center gap-2 rounded-xl border px-3 py-2",
            c.ok && !c.warn
              ? "border-ok/30 bg-ok/5"
              : c.warn
                ? "border-warn/35 bg-warn/5"
                : "border-danger/35 bg-danger/5",
          )}
        >
          <span
            className={cn(
              "inline-block h-1.5 w-1.5 shrink-0 rounded-full",
              c.ok && !c.warn
                ? "bg-ok"
                : c.warn
                  ? "bg-warn"
                  : "bg-danger",
            )}
            aria-hidden
          />
          <div className="min-w-0">
            <div
              className={cn(
                "truncate text-xs font-semibold",
                c.ok && !c.warn
                  ? "text-ok"
                  : c.warn
                    ? "text-warn"
                    : "text-danger",
              )}
            >
              {c.label}
            </div>
            <div className="truncate text-[11px] text-rh-muted">{c.detail}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
