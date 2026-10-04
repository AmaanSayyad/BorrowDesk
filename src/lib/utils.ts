import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatUsd(value: number, compact = false): string {
  if (!Number.isFinite(value)) return "$0.00";
  if (compact && Math.abs(value) >= 1_000_000) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      notation: "compact",
      maximumFractionDigits: 2,
    }).format(value);
  }
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: value >= 100 ? 2 : 4,
  }).format(value);
}

export function formatToken(value: number, digits = 4): string {
  if (!Number.isFinite(value)) return "0";
  return new Intl.NumberFormat("en-US", {
    maximumFractionDigits: digits,
  }).format(value);
}

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/**
 * Health factor for UI on a 0–10 scale (Aave-style: 1.0 = liquidatable).
 * Caps the raw liq/debt ratio so tiny debt doesn't show 9000+.
 */
export function healthFactorScore(hf: number): number {
  if (!Number.isFinite(hf) || hf >= 10) return 10;
  return Math.max(0, hf);
}

/** e.g. `10.0` or compact `10/10` */
export function formatHealthFactor(
  hf: number,
  opts?: { compact?: boolean },
): string {
  const score = healthFactorScore(hf);
  if (opts?.compact) {
    return `${score >= 10 ? "10" : score.toFixed(1)}/10`;
  }
  return score >= 10 ? "10.0" : score.toFixed(1);
}
