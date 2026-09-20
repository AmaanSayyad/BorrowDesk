"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import {
  DESK_CONFIG,
  deskConfigCanonical,
  deskConfigFingerprint,
} from "@/lib/configFingerprint";
import { MAINNET } from "@/lib/deployments";
import { MORPHO_DEMAND, PROVEN_POSITION } from "@/lib/demand";

const LEGACY = MAINNET.legacyMarket;
const MARKET = MAINNET.market;

const JUDGE_KIT = `#!/usr/bin/env bash
# BorrowDesk judge kit — paste into a shell with cast installed
set -euo pipefail
RPC="\${RH_RPC_URL:-https://rpc.mainnet.chain.robinhood.com}"
MARKET="${MARKET}"
LEGACY="${LEGACY}"
USDG="${MAINNET.usdg}"
PROVEN="${PROVEN_POSITION.borrower}"

echo "== bytecode =="
cast code "$MARKET" --rpc-url "$RPC" | head -c 24; echo

echo "== usdg =="
cast call "$MARKET" "usdg()(address)" --rpc-url "$RPC"

echo "== pool / debt =="
cast call "$MARKET" "totalUsdgLiquidity()(uint256)" --rpc-url "$RPC"
cast call "$MARKET" "totalDebt()(uint256)" --rpc-url "$RPC"

echo "== proven health (legacy market if migrated) =="
cast call "$LEGACY" \\
  "accountHealth(address)(uint256,uint256,uint256,uint256,bool)" \\
  "$PROVEN" --rpc-url "$RPC"

echo "== NVDA listing =="
cast call "$MARKET" \\
  "markets(address)(address,uint16,uint16,uint16,bool,uint8)" \\
  0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC --rpc-url "$RPC"

echo "Sourcify (legacy OpenLineMarket): https://repo.sourcify.dev/4663/$LEGACY"
echo "Explorer: ${MAINNET.explorer}/address/$MARKET"
echo "Desk: /app · Share: /share?a=$PROVEN · Manifest: /deployments/robinhood.json"
`;

const CLAIMS = [
  {
    title: "Market exists on Robinhood Chain 4663",
    cmd: `cast code ${MARKET} --rpc-url ${MAINNET.rpcUrl} | head -c 20`,
    expect: "Non-empty bytecode",
    link: `${MAINNET.explorer}/address/${MARKET}`,
    linkLabel: "Explorer",
  },
  {
    title: "Sourcify exact match (legacy OpenLineMarket)",
    cmd: `open https://repo.sourcify.dev/4663/${LEGACY}`,
    expect: "exact_match for compiler v0.8.30",
    link: `https://repo.sourcify.dev/4663/${LEGACY}`,
    linkLabel: "Sourcify",
  },
  {
    title: "USDG is the settle asset",
    cmd: `cast call ${MARKET} "usdg()(address)" --rpc-url ${MAINNET.rpcUrl}`,
    expect: MAINNET.usdg,
  },
  {
    title: "Idle pool liquidity (USDG, 6 decimals)",
    cmd: `cast call ${MARKET} "totalUsdgLiquidity()(uint256)" --rpc-url ${MAINNET.rpcUrl}`,
    expect: "Non-zero idle USDG when seeded",
  },
  {
    title: "Protocol debt",
    cmd: `cast call ${MARKET} "totalDebt()(uint256)" --rpc-url ${MAINNET.rpcUrl}`,
    expect: "≥ proven borrow; grows with interest",
  },
  {
    title: "Proven account healthy on legacy market",
    cmd: `cast call ${LEGACY} "accountHealth(address)(uint256,uint256,uint256,uint256,bool)" ${PROVEN_POSITION.borrower} --rpc-url ${MAINNET.rpcUrl}`,
    expect: `healthy=true · debt ≈ ${PROVEN_POSITION.debtUsdg} USDG`,
    link: `${MAINNET.explorer}/address/${PROVEN_POSITION.borrower}`,
    linkLabel: "Account",
  },
  {
    title: "NVDA market listed with LTV / liq bands",
    cmd: `cast call ${MARKET} "markets(address)(address,uint16,uint16,uint16,bool,uint8)" 0xd0601CE157Db5bdC3162BbaC2a2C8aF5320D9EEC --rpc-url ${MAINNET.rpcUrl}`,
    expect: "listed=true · ltvBps=6000 · liqBps=7500 · bonusBps=500",
  },
  {
    title: "Last proven borrow tx",
    cmd: `open ${MAINNET.explorer}/tx/0x92120a125454e6d097fe779643a644de60fae991522380984102d58a1334c8b2`,
    expect: "Borrow 0.001 USDG status 0x1",
    link: `${MAINNET.explorer}/tx/0x92120a125454e6d097fe779643a644de60fae991522380984102d58a1334c8b2`,
    linkLabel: "Tx",
  },
  {
    title: "Morpho demand snapshot (research block)",
    cmd: `# Re-run TORQUE research against Morpho ${MORPHO_DEMAND.morphoBlue} at block ${MORPHO_DEMAND.block}`,
    expect: `USDG supply ~$700.7M · stock-USDG lent ~$1.51M · ${MORPHO_DEMAND.stockUsdgBorrowedPct}% borrowed`,
  },
];

const QUICK = [
  {
    label: "Market",
    href: `${MAINNET.explorer}/address/${MARKET}`,
    value: `${MARKET.slice(0, 6)}…${MARKET.slice(-4)}`,
  },
  {
    label: "Sourcify",
    href: `https://repo.sourcify.dev/4663/${LEGACY}`,
    value: "exact match",
  },
  {
    label: "Manifest",
    href: "/deployments/robinhood.json",
    value: "robinhood.json",
  },
  {
    label: "Share line",
    href: `/share?a=${PROVEN_POSITION.borrower}`,
    value: "position card",
  },
];

export default function VerifyPage() {
  const fingerprint = useMemo(() => deskConfigFingerprint(), []);
  const canonical = useMemo(() => deskConfigCanonical(), []);
  const [copied, setCopied] = useState(false);

  const copyKit = async () => {
    await navigator.clipboard.writeText(JUDGE_KIT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <SiteHeader />
      <main className="rh-container flex-1 pb-24 pt-28">
        <div data-tour="verify" className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Verify
          </div>
          <h1 className="rh-display mt-3 text-[clamp(2.4rem,5vw,3.75rem)] text-white">
            Judge kit
          </h1>
          <p className="mt-4 max-w-3xl text-lg leading-relaxed text-rh-muted">
            One pasteable script for every onchain claim — Sourcify, pool, debt,
            proven health, NVDA bands, last borrow tx.
          </p>
        </div>

        <div className="mt-8 panel panel-tight rounded-2xl">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="section-kicker">Pasteable</div>
              <h2 className="mt-1 text-xl font-medium text-white">
                verify-claims.sh
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void copyKit()}
              className="neon-btn h-10 px-5 text-sm"
            >
              {copied ? "Copied" : "Copy judge kit"}
            </button>
          </div>
          <pre className="mt-4 max-h-72 overflow-auto rounded-xl bg-black p-4 text-[11px] leading-relaxed text-rh-cyan ring-1 ring-rh-border">
            {JUDGE_KIT}
          </pre>
        </div>

        <div className="mt-10 grid gap-6 border-t border-white/15 pt-8 sm:grid-cols-2 lg:grid-cols-4">
          {QUICK.map((q) => (
            <a
              key={q.label}
              href={q.href}
              target={q.href.startsWith("http") ? "_blank" : undefined}
              rel={q.href.startsWith("http") ? "noreferrer" : undefined}
              className="group block min-w-0"
            >
              <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
                {q.label}
              </div>
              <div className="mt-1.5 truncate text-lg font-medium tabular text-rh-lime group-hover:underline">
                {q.value}
              </div>
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/app" className="neon-btn h-11 px-6 text-sm">
            Open desk
          </Link>
          <Link
            href="/app?desk=fund&mode=get"
            className="ghost-btn h-11 px-6 text-sm"
          >
            Get stock → deposit
          </Link>
          <Link
            href={`/share?a=${PROVEN_POSITION.borrower}`}
            className="ghost-btn h-11 px-6 text-sm"
          >
            Share proven line
          </Link>
        </div>

        <section id="fingerprint" className="mt-16 scroll-mt-24">
          <div className="flex flex-wrap items-end justify-between gap-4 border-t border-white/15 pt-8">
            <div className="max-w-3xl">
              <div className="section-kicker">Desk config fingerprint</div>
              <h2 className="mt-2 font-mono text-2xl font-medium tabular text-white md:text-3xl">
                {fingerprint}
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-rh-muted">
                Oracle delay {DESK_CONFIG.maxOracleDelayDays}d ·{" "}
                {DESK_CONFIG.trustTier} · util APR curve in V2 market
              </p>
            </div>
          </div>
          <pre className="mt-6 overflow-x-auto border border-rh-border bg-black p-4 text-[11px] leading-relaxed text-rh-cyan md:p-5">
            {canonical}
          </pre>
        </section>

        <section className="mt-20">
          <div className="border-t border-white/15 pt-8">
            <div className="section-kicker text-rh-lime">Claims</div>
            <h2 className="rh-display mt-3 text-[clamp(1.8rem,3.5vw,2.75rem)] text-white">
              {CLAIMS.length} checks against chain
            </h2>
          </div>

          <ol className="mt-10 divide-y divide-white/10 border-y border-white/10">
            {CLAIMS.map((c, i) => (
              <li key={c.title} className="py-8">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-baseline gap-3">
                    <span className="shrink-0 text-sm font-medium tabular text-rh-lime">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="text-lg font-medium text-white md:text-xl">
                      {c.title}
                    </h3>
                  </div>
                  {c.link && (
                    <a
                      href={c.link}
                      target="_blank"
                      rel="noreferrer"
                      className="shrink-0 text-sm font-medium text-rh-cyan hover:underline"
                    >
                      {c.linkLabel ?? "Open"} →
                    </a>
                  )}
                </div>
                <pre className="mt-4 overflow-x-auto bg-black px-4 py-3 text-xs leading-relaxed text-rh-cyan ring-1 ring-rh-border">
                  {c.cmd}
                </pre>
                <p className="mt-3 text-sm text-rh-muted">
                  <span className="text-rh-dim">Expect</span>{" "}
                  <span className="text-white">{c.expect}</span>
                </p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
