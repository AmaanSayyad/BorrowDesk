"use client";

import { useEffect, useState } from "react";
import { FEATURED_TOKENS } from "@/lib/tokens";
import { formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";

type PriceMap = Record<string, number>;

export function CollateralTicker({
  onSelect,
}: {
  onSelect?: (symbol: string) => void;
  dark?: boolean;
}) {
  const [prices, setPrices] = useState<PriceMap>(() =>
    Object.fromEntries(FEATURED_TOKENS.map((t) => [t.symbol, t.fallbackPrice])),
  );

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        FEATURED_TOKENS.map(async (t) => {
          try {
            const res = await fetch(`/api/prices/${t.symbol}`);
            const data = await res.json();
            return [t.symbol, Number(data.price) || t.fallbackPrice] as const;
          } catch {
            return [t.symbol, t.fallbackPrice] as const;
          }
        }),
      );
      if (!cancelled) setPrices(Object.fromEntries(entries));
    };
    void load();
    const id = setInterval(() => void load(), 60_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  // Two copies for seamless marquee (featured only - keeps the strip readable)
  const items = Array.from({ length: 2 }, () => FEATURED_TOKENS).flat();

  return (
    <div className="relative left-1/2 w-screen max-w-[100vw] -translate-x-1/2 overflow-hidden bg-black">
      <div className="ticker-track py-2.5">
        {items.map((token, i) => (
          <button
            key={`${token.symbol}-${i}`}
            type="button"
            onClick={() => {
              onSelect?.(token.symbol);
              window.dispatchEvent(
                new CustomEvent("borrowdesk:select-symbol", {
                  detail: token.symbol,
                }),
              );
            }}
            className="mx-1 flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 text-left transition hover:bg-white/5"
          >
            <TokenLogo src={token.logo} symbol={token.symbol} size={20} />
            <span className="text-xs font-medium text-white">{token.symbol}</span>
            <span className="tabular text-xs font-medium text-rh-lime">
              {formatUsd(prices[token.symbol] ?? token.fallbackPrice)}
            </span>
            <span className="chip bg-rh-lime/10 text-rh-lime">
              {(token.ltvBps / 100).toFixed(0)}% LTV
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
