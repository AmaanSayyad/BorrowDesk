"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { TvMiniChart } from "@/components/charts/TvMiniChart";
import { BORROW_APR } from "@/lib/debtLedger";
import { FEATURED_TOKENS, LISTED_TOKENS, STOCK_TOKENS } from "@/lib/tokens";
import { formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";

type Quote = {
  price: number;
  bid?: number;
  ask?: number;
};

export function Markets() {
  const [quotes, setQuotes] = useState<Record<string, Quote>>(() =>
    Object.fromEntries(
      STOCK_TOKENS.map((t) => [t.symbol, { price: t.fallbackPrice }]),
    ),
  );
  const [q, setQ] = useState("");
  const [featuredOnly, setFeaturedOnly] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const entries = await Promise.all(
        STOCK_TOKENS.map(async (t) => {
          try {
            const res = await fetch(`/api/prices/${t.symbol}`);
            const data = await res.json();
            return [
              t.symbol,
              {
                price: Number(data.price) || t.fallbackPrice,
                bid: Number.isFinite(Number(data.bid))
                  ? Number(data.bid)
                  : undefined,
                ask: Number.isFinite(Number(data.ask))
                  ? Number(data.ask)
                  : undefined,
              },
            ] as const;
          } catch {
            return [t.symbol, { price: t.fallbackPrice }] as const;
          }
        }),
      );
      if (!cancelled) setQuotes(Object.fromEntries(entries));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const listed = new Set(LISTED_TOKENS.map((t) => t.symbol));
  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return STOCK_TOKENS.filter((t) => {
      if (featuredOnly && !t.featured) return false;
      if (!needle) return true;
      return (
        t.symbol.toLowerCase().includes(needle) ||
        t.name.toLowerCase().includes(needle)
      );
    });
  }, [q, featuredOnly]);

  return (
    <section id="markets" className="bg-black">
      <div className="rh-container py-24">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="max-w-6xl">
            <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
              Markets
            </div>
            <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
              Collateral desk
            </h2>
            <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
              {LISTED_TOKENS.length} feed-backed markets on Robinhood Chain.
              Featured names up front — search or show all for the full book.
            </p>
          </div>
          <Link href="/app" className="neon-btn h-11 shrink-0 px-5 text-sm">
            Borrow against listed
          </Link>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search ticker…"
            className="h-11 min-w-[14rem] flex-1 rounded-full border border-white/10 bg-black px-4 text-sm text-white outline-none placeholder:text-rh-dim focus:border-rh-lime/40"
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

        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/[0.06]">
          <table className="market-table min-w-[1180px]">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Chart</th>
                <th style={{ textAlign: "right" }}>Price</th>
                <th style={{ textAlign: "right" }}>Spread</th>
                <th style={{ textAlign: "right" }}>Max borrow</th>
                <th style={{ textAlign: "right" }}>LTV</th>
                <th style={{ textAlign: "right" }}>Liq.</th>
                <th style={{ textAlign: "right" }}>APR</th>
                <th>Risk</th>
                <th style={{ textAlign: "right" }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((token) => {
                const isListed = listed.has(token.symbol);
                const quote = quotes[token.symbol] ?? {
                  price: token.fallbackPrice,
                };
                const price = quote.price;
                const maxBorrow = (price * token.ltvBps) / 10_000;
                const spreadBps =
                  quote.bid != null &&
                  quote.ask != null &&
                  quote.bid > 0 &&
                  quote.ask > quote.bid
                    ? ((quote.ask - quote.bid) / price) * 10_000
                    : null;
                const riskLabel = token.riskReason
                  .replace(/\s*·\s*\d+% LTV$/, "")
                  .trim();

                return (
                  <tr key={token.symbol}>
                    <td>
                      <Link
                        href={`/app/${token.symbol.toLowerCase()}`}
                        className="flex items-center gap-3"
                      >
                        <TokenLogo
                          src={token.logo}
                          symbol={token.symbol}
                          size={32}
                        />
                        <div>
                          <div className="font-medium text-white">
                            {token.symbol}
                          </div>
                          <div className="text-xs text-rh-dim">{token.name}</div>
                        </div>
                      </Link>
                    </td>
                    <td>
                      <Link href={`/app/${token.symbol.toLowerCase()}`}>
                        <TvMiniChart symbol={token.symbol} />
                      </Link>
                    </td>
                    <td className="text-right font-medium text-white tabular">
                      {formatUsd(price)}
                    </td>
                    <td className="text-right text-rh-muted tabular">
                      {spreadBps == null ? (
                        "-"
                      ) : (
                        <span title="Bid-ask as bps of mid">
                          {spreadBps < 1
                            ? "<1 bp"
                            : `${spreadBps.toFixed(1)} bp`}
                        </span>
                      )}
                    </td>
                    <td className="text-right tabular">
                      <div className="font-medium text-rh-lime">
                        {formatUsd(maxBorrow)}
                      </div>
                      <div className="text-[10px] text-rh-dim">USDG / share</div>
                    </td>
                    <td className="text-right text-rh-muted tabular">
                      {(token.ltvBps / 100).toFixed(0)}%
                    </td>
                    <td className="text-right text-rh-muted tabular">
                      {(token.liquidationBps / 100).toFixed(0)}%
                    </td>
                    <td className="text-right text-rh-muted tabular">
                      {isListed ? `${(BORROW_APR * 100).toFixed(0)}%` : "-"}
                    </td>
                    <td className="max-w-[180px] text-xs text-rh-muted">
                      {riskLabel}
                    </td>
                    <td className="text-right">
                      <span
                        className={`chip ${
                          isListed
                            ? "bg-rh-lime/15 text-rh-lime"
                            : "bg-white/5 text-rh-dim"
                        }`}
                      >
                        {isListed ? "Live" : "Soon"}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
