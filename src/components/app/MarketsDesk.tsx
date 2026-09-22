"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TvMiniChart } from "@/components/charts/TvMiniChart";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { usePrices } from "@/hooks/usePrices";
import { FEATURED_TOKENS, LISTED_TOKENS } from "@/lib/tokens";
import { formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";

function openTicket(tab: "deposit" | "borrow", symbol?: string) {
  window.dispatchEvent(
    new CustomEvent("borrowdesk:ticket", {
      detail: { tab, symbol },
    }),
  );
  document
    .getElementById("ticket")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function MarketsDesk() {
  const { rows, loading } = useOracleMarkets();
  const apiPrices = usePrices();
  const [q, setQ] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(true);
  const featured = useMemo(
    () => new Set(FEATURED_TOKENS.map((t) => t.symbol)),
    [],
  );
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows.filter((row) => {
      if (featuredOnly && !featured.has(row.symbol)) return false;
      if (!needle) return true;
      return (
        row.symbol.toLowerCase().includes(needle) ||
        row.name.toLowerCase().includes(needle)
      );
    });
  }, [rows, q, featuredOnly, featured]);

  return (
    <div
      id="markets"
      data-tour="markets"
      className="panel panel-tight scroll-mt-24 rounded-2xl"
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="section-kicker">Markets</div>
          <h2 className="mt-1 text-xl font-medium text-white">
            Listed collateral
          </h2>
          <p className="mt-1 text-xs text-rh-muted">
            {LISTED_TOKENS.length} live · oracle LTV · Deposit opens the ticket
          </p>
        </div>
        {loading && (
          <span className="chip bg-white/10 text-rh-muted">Syncing…</span>
        )}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Filter ticker…"
          className="h-10 min-w-[12rem] flex-1 rounded-full border border-rh-border bg-black px-4 text-sm text-white outline-none placeholder:text-rh-dim focus:border-rh-lime/40"
        />
        <button
          type="button"
          onClick={() => setFeaturedOnly((v) => !v)}
          className="chip border border-white/10 bg-transparent text-rh-muted hover:text-white"
        >
          {featuredOnly
            ? `Featured · ${FEATURED_TOKENS.length}`
            : `All · ${LISTED_TOKENS.length}`}
        </button>
      </div>

      <div className="mt-5 overflow-x-auto rounded-xl border border-rh-border">
        <table className="market-table w-full min-w-[920px]">
          <thead>
            <tr>
              <th>Asset</th>
              <th>Chart</th>
              <th style={{ textAlign: "right" }}>Oracle</th>
              <th style={{ textAlign: "right" }}>Age</th>
              <th style={{ textAlign: "right" }}>LTV</th>
              <th style={{ textAlign: "right" }}>Liq.</th>
              <th>Why this LTV</th>
              <th style={{ textAlign: "right" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((row) => {
              const ageMin =
                row.updatedAt > 0
                  ? Math.max(
                      0,
                      Math.round((Date.now() - row.updatedAt) / 60_000),
                    )
                  : null;
              const tokenMeta = LISTED_TOKENS.find(
                (t) => t.symbol === row.symbol,
              );
              return (
              <tr key={row.symbol}>
                <td>
                  <Link
                    href={`/app/${row.symbol.toLowerCase()}`}
                    className="flex items-center gap-3 hover:opacity-90"
                  >
                    <TokenLogo src={row.logo} symbol={row.symbol} size={28} />
                    <div>
                      <div className="font-medium text-white">{row.symbol}</div>
                      <div className="text-xs text-rh-dim">{row.name}</div>
                    </div>
                  </Link>
                </td>
                <td>
                  <Link href={`/app/${row.symbol.toLowerCase()}`}>
                    <TvMiniChart symbol={row.symbol} width={120} height={44} />
                  </Link>
                </td>
                <td className="text-right font-medium text-rh-lime">
                  {formatUsd(row.oraclePrice)}
                  <div className="text-[10px] font-normal text-rh-dim">
                    API {formatUsd(apiPrices[row.symbol] ?? row.apiFallback)}
                  </div>
                </td>
                <td className="text-right text-rh-muted tabular">
                  {ageMin == null
                    ? "-"
                    : ageMin < 60
                      ? `${ageMin}m`
                      : `${Math.round(ageMin / 60)}h`}
                </td>
                <td className="text-right text-rh-muted">
                  {(row.ltvBps / 100).toFixed(0)}%
                </td>
                <td className="text-right text-rh-muted">
                  {(row.liqBps / 100).toFixed(0)}%
                </td>
                <td className="max-w-[200px] text-xs text-rh-muted">
                  {tokenMeta?.riskReason ?? "-"}
                </td>
                <td className="text-right">
                  <div className="flex justify-end gap-1">
                    <button
                      type="button"
                      disabled={!row.listed}
                      onClick={() => openTicket("deposit", row.symbol)}
                      className="rounded-full bg-rh-lime/15 px-3 py-1.5 text-xs font-medium text-rh-lime hover:bg-rh-lime/25 disabled:opacity-40"
                    >
                      {row.listed ? "Deposit" : "Soon"}
                    </button>
                    <button
                      type="button"
                      disabled={!row.listed}
                      onClick={() => openTicket("borrow", row.symbol)}
                      className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/15 disabled:opacity-40"
                    >
                      Borrow
                    </button>
                  </div>
                </td>
              </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
