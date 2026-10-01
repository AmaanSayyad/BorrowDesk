"use client";

import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";

export type HistoryPoint = {
  t: number;
  healthFactor: number;
  debtUsd: number;
  collateralUsd: number;
};

const MAX_POINTS = 96;
const SAMPLE_MS = 30_000;

function storageKey(address: string) {
  return `borrowdesk:position-history:${address.toLowerCase()}`;
}

function load(address: string): HistoryPoint[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(storageKey(address));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryPoint[];
    return Array.isArray(parsed) ? parsed.slice(-MAX_POINTS) : [];
  } catch {
    return [];
  }
}

function save(address: string, points: HistoryPoint[]) {
  try {
    localStorage.setItem(storageKey(address), JSON.stringify(points.slice(-MAX_POINTS)));
  } catch {
    /* ignore quota */
  }
}

/** Samples live health/debt into localStorage for sparkline charts. */
export function usePositionHistory() {
  const { address } = useAccount();
  const live = useBorrowDeskLive();
  const [points, setPoints] = useState<HistoryPoint[]>([]);

  useEffect(() => {
    if (!address) {
      setPoints([]);
      return;
    }
    setPoints(load(address));
  }, [address]);

  useEffect(() => {
    if (!address || !live.ready) return;

    const sample = () => {
      const m = live.liveMetrics;
      setPoints((prev) => {
        const last = prev[prev.length - 1];
        // Avoid ∞ / cap-5 spikes that flatten the chart when debt is cleared
        const hf =
          m.debtUsd <= 0
            ? (last?.healthFactor ?? 2.5)
            : Number.isFinite(m.healthFactor)
              ? Math.min(m.healthFactor, 4)
              : (last?.healthFactor ?? 2.5);
        const next: HistoryPoint = {
          t: Date.now(),
          healthFactor: hf,
          debtUsd: m.debtUsd,
          collateralUsd: m.collateralUsd,
        };
        // Keep cadence, but also capture meaningful moves sooner
        const moved =
          last &&
          (Math.abs(next.debtUsd - last.debtUsd) > 0.0005 ||
            Math.abs(next.healthFactor - last.healthFactor) > 0.03);
        if (last && next.t - last.t < SAMPLE_MS * 0.8 && !moved) return prev;
        if (last && next.t - last.t < 4_000) return prev;
        const merged = [...prev, next].slice(-MAX_POINTS);
        save(address, merged);
        return merged;
      });
    };

    sample();
    const id = setInterval(sample, SAMPLE_MS);
    return () => clearInterval(id);
  }, [
    address,
    live.ready,
    live.liveMetrics.debtUsd,
    live.liveMetrics.collateralUsd,
    live.liveMetrics.healthFactor,
  ]);

  const series = useMemo(() => {
    if (points.length >= 2) return points;
    if (!live.ready) return points;
    const m = live.liveMetrics;
    const seed: HistoryPoint = {
      t: Date.now() - SAMPLE_MS,
      healthFactor:
        m.debtUsd <= 0
          ? 2.5
          : Number.isFinite(m.healthFactor)
            ? Math.min(m.healthFactor, 4)
            : 2.5,
      debtUsd: m.debtUsd,
      collateralUsd: m.collateralUsd,
    };
    const now: HistoryPoint = { ...seed, t: Date.now() };
    return points.length === 1 ? [...points, now] : [seed, now];
  }, [points, live.ready, live.liveMetrics]);

  return { points: series, ready: live.ready };
}
