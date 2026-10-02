/**
 * Mandate-style config fingerprint - constants that govern desk risk.
 * Shown on /verify so judges can paste/hash the desk policy.
 */
export const DESK_CONFIG = {
  chainId: 4663,
  borrowApr: 0.05,
  maxOracleDelayDays: 4,
  listed: {
    SPY: { ltvBps: 6500, liqBps: 8000, bonusBps: 500 },
    NVDA: { ltvBps: 6000, liqBps: 7500, bonusBps: 500 },
    AAPL: { ltvBps: 6000, liqBps: 7500, bonusBps: 500 },
    TSLA: { ltvBps: 5000, liqBps: 6500, bonusBps: 500 },
  },
  market: "0x2e4E7E8145E4cCA7E0fEf4737A2489E4E27D9E8d",
  usdg: "0x5fc5360D0400a0Fd4f2af552ADD042D716F1d168",
  trustTier: "MAINNET · 4663",
  invariants: [
    "healthy_accounts_cannot_be_seized",
    "partial_liquidation_supported",
    "apr_independent_of_collateral_price",
  ],
} as const;

/** Stable JSON for hashing / paste into verify docs. */
export function deskConfigCanonical(): string {
  return JSON.stringify(DESK_CONFIG);
}

/** Lightweight non-crypto fingerprint for UI (djb2). */
export function deskConfigFingerprint(): string {
  const s = deskConfigCanonical();
  let h = 5381;
  for (let i = 0; i < s.length; i++) {
    h = (h * 33) ^ s.charCodeAt(i);
  }
  return `bd-${(h >>> 0).toString(16).padStart(8, "0")}`;
}
