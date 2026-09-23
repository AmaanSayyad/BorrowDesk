"use client";

import { useMemo, useState } from "react";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { FEATURED_TOKENS, LISTED_TOKENS } from "@/lib/tokens";
import { formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { interestPerDay } from "@/lib/debtLedger";

const STRESS_PREVIEW = 6;

function riskLabel(reason: string) {
  return reason.replace(/\s*·\s*\d+% LTV$/, "").trim();
}

export function RiskPanel() {
  const live = useBorrowDeskLive();
  const { rows } = useOracleMarkets();
  const m = live.liveMetrics;
  const [showAllStress, setShowAllStress] = useState(false);
  const [showAllBands, setShowAllBands] = useState(false);

  const liqUsd = m.liquidationUsd;
  const debt = m.debtUsd;
  const bufferUsd = Math.max(0, liqUsd - debt);
  const bufferPct = liqUsd > 0 ? (bufferUsd / liqUsd) * 100 : 100;
  // V2 util curve: 2% + 8% × utilization (matches on-chain previewBorrowAprBps).
  const protocolDebt = live.protocolDebtUsdg;
  const util =
    live.poolUsdg + protocolDebt > 0
      ? protocolDebt / (live.poolUsdg + protocolDebt)
      : 0;
  const apr = 2 + 8 * util;

  const stress = useMemo(() => {
    return LISTED_TOKENS.filter((t) => (live.collateral[t.symbol] ?? 0) > 0)
      .map((t) => {
        const market = rows.find((r) => r.symbol === t.symbol);
        const price = market?.oraclePrice ?? t.fallbackPrice;
        const bal = live.collateral[t.symbol] ?? 0;
        const usd = bal * price;
        const othersLiq = Math.max(
          0,
          liqUsd - (usd * (market?.liqBps ?? t.liquidationBps)) / 10_000,
        );
        const needFromAsset = Math.max(0, debt - othersLiq);
        const assetLiqBps = market?.liqBps ?? t.liquidationBps;
        const requiredUsd =
          assetLiqBps > 0 ? (needFromAsset * 10_000) / assetLiqBps : 0;
        const stressPrice = bal > 0 ? requiredUsd / bal : price;
        const dropPct =
          price > 0 ? Math.max(0, ((price - stressPrice) / price) * 100) : 0;
        return {
          symbol: t.symbol,
          logo: t.logo,
          dropPct,
          stressPrice,
          ltvPct: (market?.ltvBps ?? t.ltvBps) / 100,
        };
      })
      .sort((a, b) => a.dropPct - b.dropPct);
  }, [live.collateral, rows, liqUsd, debt]);

  const stressVisible = showAllStress
    ? stress
    : stress.slice(0, STRESS_PREVIEW);

  const bandTokens = showAllBands ? LISTED_TOKENS : FEATURED_TOKENS;

  const tone =
    debt <= 0
      ? "text-rh-lime"
      : m.healthFactor >= 1.5
        ? "text-ok"
        : m.healthFactor >= 1.1
          ? "text-warn"
          : "text-danger";

  return (
    <div
      id="risk"
      data-tour="risk"
      className="panel panel-tight scroll-mt-24 rounded-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="section-kicker">Risk desk</div>
          <h2 className="mt-1 text-xl font-medium text-white">
            Liquidation buffer
          </h2>
        </div>
        <span className={`chip bg-white/10 ${tone}`}>
          {debt <= 0
            ? "No debt"
            : m.healthy
              ? "Above threshold"
              : "Liquidatable"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Liq. threshold" value={formatUsd(liqUsd)} />
        <Stat label="Buffer to liq." value={formatUsd(bufferUsd)} accent />
        <Stat label="Buffer %" value={`${bufferPct.toFixed(1)}%`} />
        <Stat
          label="Interest / day"
          value={
            debt > 0
              ? formatUsd(interestPerDay(debt))
              : `${apr.toFixed(0)}% APR`
          }
        />
      </div>

      <div className="mt-5">
        <div className="mb-2 flex justify-between text-xs text-rh-muted">
          <span>Safety cushion</span>
          <span className="tabular">{bufferPct.toFixed(1)}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-black">
          <div
            className="h-full rounded-full bg-rh-lime transition-all"
            style={{ width: `${Math.min(100, Math.max(4, bufferPct))}%` }}
          />
        </div>
        <p className="mt-3 text-sm leading-relaxed text-rh-muted">
          Liquidation can start when debt exceeds the liquidation threshold.
          Interest accrues at ~{apr.toFixed(0)}% APR on outstanding USDG debt.
        </p>
      </div>

      {stress.length > 0 && (
        <div className="mt-6">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
              Stress · drop to HF ≈ 1.0
            </div>
            <span className="text-[11px] text-rh-dim">
              {stress.length} posted · tightest first
            </span>
          </div>
          <ul className="mt-2 divide-y divide-white/[0.06] overflow-hidden rounded-xl border border-rh-border bg-black">
            {stressVisible.map((s) => (
              <li
                key={s.symbol}
                className="flex items-center gap-2.5 px-3 py-2"
              >
                <TokenLogo src={s.logo} symbol={s.symbol} size={20} />
                <span className="w-14 shrink-0 text-sm font-medium text-white">
                  {s.symbol}
                </span>
                <span className="text-[11px] text-rh-dim tabular">
                  {s.ltvPct.toFixed(0)}% LTV
                </span>
                <div className="ml-auto text-right">
                  <span className="text-sm font-medium tabular text-warn">
                    −{s.dropPct.toFixed(1)}%
                  </span>
                  <span className="ml-2 text-[11px] text-rh-dim tabular">
                    @ {formatUsd(s.stressPrice)}
                  </span>
                </div>
              </li>
            ))}
          </ul>
          {stress.length > STRESS_PREVIEW && (
            <button
              type="button"
              onClick={() => setShowAllStress((v) => !v)}
              className="mt-2 text-xs text-rh-muted underline-offset-2 hover:text-white hover:underline"
            >
              {showAllStress
                ? "Show fewer"
                : `Show all ${stress.length} posted assets`}
            </button>
          )}
        </div>
      )}

      <div className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
            LTV bands
          </div>
          <button
            type="button"
            onClick={() => setShowAllBands((v) => !v)}
            className="chip border border-white/10 bg-transparent text-rh-muted hover:text-white"
          >
            {showAllBands
              ? `All · ${LISTED_TOKENS.length}`
              : `Featured · ${FEATURED_TOKENS.length}`}
          </button>
        </div>
        <ul className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4">
          {bandTokens.map((t) => {
            const mkt = rows.find((r) => r.symbol === t.symbol);
            return (
              <li
                key={t.symbol}
                className="flex items-center gap-2 rounded-lg bg-black px-2.5 py-2"
                title={riskLabel(t.riskReason)}
              >
                <TokenLogo src={t.logo} symbol={t.symbol} size={18} />
                <span className="truncate text-sm font-medium text-white">
                  {t.symbol}
                </span>
                <span className="ml-auto shrink-0 text-xs tabular text-rh-lime">
                  {((mkt?.ltvBps ?? t.ltvBps) / 100).toFixed(0)}%
                </span>
              </li>
            );
          })}
        </ul>
        {!showAllBands && (
          <p className="mt-2 text-[11px] text-rh-dim">
            Featured bands · All for {LISTED_TOKENS.length} markets
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl bg-black px-3 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-1 text-base font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
