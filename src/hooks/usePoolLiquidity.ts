"use client";

import { useEffect, useState } from "react";

export function usePoolLiquidity() {
  const [poolUsdg, setPoolUsdg] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const res = await fetch("/api/pool", { cache: "no-store" });
        const data = await res.json();
        if (!cancelled && typeof data.poolUsdg === "number") {
          setPoolUsdg(data.poolUsdg);
        }
      } catch {
        /* keep last */
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    const id = setInterval(() => void load(), 20_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  return { poolUsdg, loading };
}
