/**
 * Morpho Blue stock-token USDG demand on Robinhood Chain.
 * Figures published at a named block so they can be re-checked onchain.
 * Source research: TORQUE chain snapshot @ block 78,677,903 (2026-10-03).
 */
export const MORPHO_DEMAND = {
  block: 78_677_903,
  asOfUtc: "2026-10-03 00:58 UTC",
  usdgTotalSupplyUsd: 700_700_000,
  stockUsdgLentUsd: 1_510_000,
  stockUsdgBorrowedPct: 96.6,
  largestNvdaUtilPct: 98.5,
  morphoBlue: "0x9D53d5E3bd5E8d4Cbfa6DB1ca238AEA02E651010" as const,
  note:
    "Read from Robinhood Chain mainnet Morpho Blue markets that lend USDG against Robinhood Stock Tokens.",
} as const;

/** Proven deployer position snapshot (see MAINNET.md). */
export const PROVEN_POSITION = {
  borrower: "0x1881Dfd2b29536F054AA0b0A4966856290388Cc2" as const,
  collateralUsd: 1.32,
  debtUsdg: 0.0001,
  healthy: true,
  assets: ["NVDA", "AAPL"] as const,
} as const;

/** Immutable mainnet receipts - “It already happened.” */
export type ProofEvent = {
  title: string;
  body: string;
  tx: `0x${string}` | null;
  account?: `0x${string}`;
  metric: string;
  metricLabel: string;
};

export const PROOF_EVENTS: ProofEvent[] = [
  {
    title: "Market deployed",
    body: "BorrowDeskMarket created on Robinhood Chain mainnet (4663).",
    tx: "0x011533d69bab32b19c066e45547672cdd4697043314389f223252e1c477c3675",
    metric: "OpenLineMarket",
    metricLabel: "Sourcify exact match",
  },
  {
    title: "Liquidity seeded",
    body: "Owner seeded the USDG pool so borrowers have idle cash to draw.",
    tx: "0xb67f1febd164668f63dbdd0cbd8491163c603612f0bcefe3b9dc81b78ad4eb11",
    metric: "~4.80 USDG",
    metricLabel: "Idle pool on V2",
  },
  {
    title: "Borrow proven",
    body: "Live V2 account holds multi-collateral Stock Tokens with healthy USDG debt.",
    tx: null,
    account: PROVEN_POSITION.borrower,
    metric: `${PROVEN_POSITION.debtUsdg} USDG`,
    metricLabel: "Outstanding debt · healthy",
  },
];

export const TRUST_TIER = {
  label: "MAINNET · 4663",
  detail: "Live signing on Robinhood Chain mainnet with real Stock Tokens.",
} as const;

export const BUILDATHON_LIMITS = [
  {
    title: "Toy-scale USDG pool",
    body: "Liquidity is owner-seeded at ~$4.80 USDG idle for the buildathon. Max borrow is whatever idle cash remains.",
  },
  {
    title: "Owner can list markets",
    body: "The market owner can list collateral and seed liquidity. They cannot seize a healthy account.",
  },
  {
    title: "4-day oracle delay",
    body: "Equity feeds are 24/5. maxOracleDelay defaults to 4 days so quiet weekends do not brick the desk.",
  },
  {
    title: "Unaudited",
    body: "Foundry unit tests cover over-borrow, accrual, and liquidation. No external audit yet.",
  },
] as const;
