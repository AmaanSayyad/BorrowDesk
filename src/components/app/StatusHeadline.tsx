"use client";

import { useMemo } from "react";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { formatHealthFactor, formatUsd } from "@/lib/utils";
import { TRUST_TIER } from "@/lib/demand";

const MAX_DELAY_MS = 4 * 24 * 60 * 60 * 1000;

/** One-sentence position status - Crest status-headline pattern. */
export function StatusHeadline() {
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const { rows } = useOracleMarkets();
  const m = live.liveMetrics;
  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;

  const line = useMemo(() => {
    const stale = rows.some(
      (r) => r.updatedAt > 0 && Date.now() - r.updatedAt > MAX_DELAY_MS,
    );

    if (!live.ready) {
      return {
        tone: "muted" as const,
        text: `Connect on Robinhood Chain to load your book. Pool ${formatUsd(poolUsdg)} idle.`,
      };
    }

    if (m.debtUsd <= 0 && m.collateralUsd <= 0) {
      return {
        tone: "muted" as const,
        text: `No position yet. Pool ${formatUsd(poolUsdg)} idle · deposit Stock Tokens to open a line.`,
      };
    }

    if (!m.healthy) {
      return {
        tone: "danger" as const,
        text: `Liquidatable. Debt ${formatUsd(m.debtUsd)} above liq band ${formatUsd(m.liquidationUsd)}.`,
      };
    }

    const buffer = Math.max(0, m.liquidationUsd - m.debtUsd);
    const hf = formatHealthFactor(
      m.debtUsd <= 0 ? Infinity : m.healthFactor,
      { compact: true },
    );

    if (stale) {
      return {
        tone: "warn" as const,
        text: `Healthy (HF ${hf}) but a feed is past the 4d window - new borrows may fail closed.`,
      };
    }

    if (m.debtUsd <= 0) {
      return {
        tone: "ok" as const,
        text: `Collateral ${formatUsd(m.collateralUsd)} · no debt. Borrow power ${formatUsd(m.borrowPowerUsd)}.`,
      };
    }

    return {
      tone: "ok" as const,
      text: `Healthy. HF ${hf} · LTV ${(m.ltv * 100).toFixed(1)}% · buffer ${formatUsd(buffer)} to liquidation.`,
    };
  }, [live.ready, m, poolUsdg, rows]);

  const toneClass =
    line.tone === "ok"
      ? "border-ok/30 bg-ok/5 text-ok"
      : line.tone === "warn"
        ? "border-warn/35 bg-warn/5 text-warn"
        : line.tone === "danger"
          ? "border-danger/35 bg-danger/5 text-danger"
          : "border-rh-border bg-black text-rh-muted";

  return (
    <div
      data-tour="status"
      className={`rounded-xl border px-3 py-2.5 md:px-4 ${toneClass}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip bg-white/10 text-[10px] text-white">
          {TRUST_TIER.label}
        </span>
        <p className="text-sm font-medium leading-snug">{line.text}</p>
      </div>
    </div>
  );
}
