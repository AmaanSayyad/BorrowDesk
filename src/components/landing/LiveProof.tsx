"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { MAINNET } from "@/lib/deployments";
import { PROVEN_POSITION } from "@/lib/demand";
import { getToken, LISTED_TOKENS } from "@/lib/tokens";
import { formatUsd } from "@/lib/utils";

export function LiveProof() {
  const { poolUsdg } = usePoolLiquidity();
  const pool = poolUsdg > 0 ? poolUsdg : 5.03;
  const accountShort = `${PROVEN_POSITION.borrower.slice(0, 6)}…${PROVEN_POSITION.borrower.slice(-4)}`;

  const deskFacts = [
    { label: "Idle pool", value: formatUsd(pool) },
    { label: "Listed", value: `${LISTED_TOKENS.length} assets` },
    { label: "Settle in", value: "USDG" },
    { label: "Network", value: "RH 4663" },
  ];

  return (
    <section className="border-y border-rh-border bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Live on Robinhood Chain
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Market deployed. Liquidity seeded. Borrow proven.
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Deposit Stock Tokens, borrow Global Dollar - equity credit onchain,
            with liquidation math visible before you sign.
          </p>
        </div>

        <div className="mt-10 grid gap-8 border-t border-white/15 pt-8 lg:grid-cols-[1.4fr_1fr] lg:gap-12">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-lime">
                Proven onchain position
              </div>
              <span className="rounded-full border border-ok/35 bg-ok/10 px-2.5 py-0.5 text-[11px] font-medium text-ok">
                Healthy
              </span>
              <a
                href={`${MAINNET.explorer}/address/${PROVEN_POSITION.borrower}`}
                target="_blank"
                rel="noreferrer"
                className="text-[11px] tabular text-rh-cyan hover:underline"
              >
                {accountShort}
              </a>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-6">
              <Stat
                label="Collateral"
                value={formatUsd(PROVEN_POSITION.collateralUsd)}
              />
              <Stat
                label="Debt"
                value={`${PROVEN_POSITION.debtUsdg.toFixed(3)} USDG`}
              />
              <Stat
                label="Assets"
                value={
                  <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {PROVEN_POSITION.assets.map((sym) => {
                      const t = getToken(sym);
                      return (
                        <span
                          key={sym}
                          className="inline-flex shrink-0 items-center gap-1.5"
                        >
                          {t && (
                            <TokenLogo
                              src={t.logo}
                              symbol={sym}
                              size={18}
                            />
                          )}
                          {sym}
                        </span>
                      );
                    })}
                  </span>
                }
              />
              <Stat label="Status" value="Live · mainnet" accent />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-5 border-t border-white/10 pt-6 lg:border-t-0 lg:border-l lg:pt-0 lg:pl-10">
            {deskFacts.map((f) => (
              <Stat key={f.label} label={f.label} value={f.value} accent />
            ))}
          </div>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Link href="/app" className="neon-btn h-11 px-7 text-sm">
            Open credit line
          </Link>
          <a
            href={`${MAINNET.explorer}/address/${MAINNET.market}`}
            target="_blank"
            rel="noreferrer"
            className="ghost-btn h-11 px-6 text-sm"
          >
            View market
          </a>
          <Link
            href="/verify"
            className="h-11 px-2 text-sm font-medium text-rh-cyan hover:underline"
          >
            Verify claims →
          </Link>
        </div>
      </div>
    </section>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="min-w-0">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-1.5 text-lg font-medium tabular sm:text-xl ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
