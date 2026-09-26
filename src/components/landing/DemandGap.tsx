"use client";

import Link from "next/link";
import { MORPHO_DEMAND } from "@/lib/demand";

function fmtM(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${n.toFixed(0)}`;
}

export function DemandGap() {
  const stats = [
    {
      label: "USDG on Robinhood Chain",
      value: fmtM(MORPHO_DEMAND.usdgTotalSupplyUsd),
    },
    {
      label: "Lent vs Stock Tokens (Morpho)",
      value: fmtM(MORPHO_DEMAND.stockUsdgLentUsd),
    },
    {
      label: "Of that, already borrowed",
      value: `${MORPHO_DEMAND.stockUsdgBorrowedPct}%`,
    },
    {
      label: "Largest NVDA market utilised",
      value: `${MORPHO_DEMAND.largestNvdaUtilPct}%`,
    },
  ];

  return (
    <section id="demand" className="border-y border-rh-border bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            The credit gap
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2rem,4.5vw,3.5rem)] text-white">
            {fmtM(MORPHO_DEMAND.usdgTotalSupplyUsd)} of USDG onchain. Only{" "}
            {fmtM(MORPHO_DEMAND.stockUsdgLentUsd)} lent against Stock Tokens -
            and {MORPHO_DEMAND.stockUsdgBorrowedPct}% of that is already out.
          </h2>
          <p className="mt-5 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Holders who want dollars without selling equity still need a credit
            desk with liquidation foresight - not another loop that burns upside
            into liquidator bonuses. BorrowDesk is that desk on Robinhood Chain.
          </p>
        </div>

        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="border-t border-white/15 pt-4"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
                {s.label}
              </div>
              <div className="mt-2 text-2xl font-medium tabular text-rh-lime">
                {s.value}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-rh-dim">
          Morpho Blue read at block{" "}
          <span className="tabular text-rh-muted">{MORPHO_DEMAND.block}</span> (
          {MORPHO_DEMAND.asOfUtc}). {MORPHO_DEMAND.note}{" "}
          <Link href="/verify" className="text-rh-cyan hover:underline">
            Verify claims →
          </Link>
        </p>
      </div>
    </section>
  );
}
