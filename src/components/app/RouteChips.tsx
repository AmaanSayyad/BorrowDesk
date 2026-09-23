"use client";

import { useMemo } from "react";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { cn } from "@/lib/utils";

const MAX_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

type Chip = { label: string; ok: boolean; detail: string };

/** StocksCalendar-style “Why this route?” readiness chips. */
export function RouteChips({
  symbol,
  poolUsdg,
  maxBorrow,
}: {
  symbol: string;
  poolUsdg: number;
  maxBorrow: number;
}) {
  const { rows } = useOracleMarkets();
  const live = useBorrowDeskLive();
  const m = live.liveMetrics;

  const chips: Chip[] = useMemo(() => {
    const market = rows.find((r) => r.symbol === symbol);
    const listed = Boolean(market?.listed);
    const fresh =
      Boolean(market?.updatedAt) &&
      Date.now() - (market?.updatedAt ?? 0) <= MAX_DELAY_MS;
    const poolOk = poolUsdg > 0.01;
    const collatOk = live.ready && m.collateralUsd > 0;
    const powerOk = live.ready && maxBorrow > 0;
    const healthyOk = !live.ready || m.healthy;

    return [
      {
        label: "Listed",
        ok: listed,
        detail: listed ? `${symbol} live` : `${symbol} not listed`,
      },
      {
        label: "Oracle fresh",
        ok: fresh,
        detail: fresh ? "Within 4d" : "Stale / missing",
      },
      {
        label: "Pool idle",
        ok: poolOk,
        detail: poolOk ? `$${poolUsdg.toFixed(2)}` : "Empty",
      },
      {
        label: "Collateral",
        ok: collatOk,
        detail: collatOk ? "Deposited" : "Deposit first",
      },
      {
        label: "Borrow power",
        ok: powerOk,
        detail: powerOk ? `$${maxBorrow.toFixed(2)}` : "No room",
      },
      {
        label: "Healthy",
        ok: healthyOk,
        detail: healthyOk ? "Above liq band" : "Liquidatable",
      },
    ];
  }, [rows, symbol, poolUsdg, live.ready, m, maxBorrow]);

  return (
    <div data-tour="route" className="mt-4">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
        Why this route?
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {chips.map((c) => (
          <span
            key={c.label}
            title={c.detail}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium",
              c.ok
                ? "border-ok/30 bg-ok/10 text-ok"
                : "border-danger/30 bg-danger/10 text-danger",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                c.ok ? "bg-ok" : "bg-danger",
              )}
              aria-hidden
            />
            {c.label}
            <span className="text-[10px] opacity-70">{c.detail}</span>
          </span>
        ))}
      </div>
    </div>
  );
}
