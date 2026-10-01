"use client";

import { useEffect, useState } from "react";
import { STOCK_TOKENS } from "@/lib/tokens";

export function usePrices() {
  const [prices, setPrices] = useState<Record<string, number>>(() =>
    Object.fromEntries(STOCK_TOKENS.map((t) => [t.symbol, t.fallbackPrice])),
  );

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const entries = await Promise.all(
        STOCK_TOKENS.map(async (token) => {
          try {
            const res = await fetch(`/api/prices/${token.symbol}`);
            const data = await res.json();
            return [
              token.symbol,
              Number(data.price) || token.fallbackPrice,
            ] as const;
          } catch {
            return [token.symbol, token.fallbackPrice] as const;
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

  return prices;
}
