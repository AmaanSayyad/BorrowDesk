"use client";

import Link from "next/link";
import { Suspense, use, useEffect, useMemo, useState } from "react";
import { ActionPanel } from "@/components/app/ActionPanel";
import { CommandPalette } from "@/components/app/CommandPalette";
import { PriceChart } from "@/components/charts/PriceChart";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { CollateralTicker } from "@/components/ui/CollateralTicker";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { usePrices } from "@/hooks/usePrices";
import { useWalletModal } from "@/hooks/useWalletModal";
import { LISTED_TOKENS, STOCK_TOKENS, getToken } from "@/lib/tokens";
import { MAINNET } from "@/lib/deployments";
import { formatToken, formatUsd } from "@/lib/utils";

export default function AssetPage({
  params,
}: {
  params: Promise<{ symbol: string }>;
}) {
  const { symbol: raw } = use(params);
  const symbol = raw.toUpperCase();
  const token = getToken(symbol) ?? STOCK_TOKENS.find((t) => t.symbol === symbol);
  const live = useBorrowDeskLive();
  const prices = usePrices();
  const { rows } = useOracleMarkets();
  const { openConnect } = useWalletModal();
  const [amount, setAmount] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!LISTED_TOKENS.some((t) => t.symbol === symbol)) return;
    window.dispatchEvent(
      new CustomEvent("borrowdesk:ticket", {
        detail: { tab: "deposit", symbol },
      }),
    );
  }, [symbol]);

  const market = rows.find((r) => r.symbol === symbol);
  const price = market?.oraclePrice ?? prices[symbol] ?? token?.fallbackPrice ?? 0;
  const deposited = live.collateral[symbol] ?? 0;
  const wallet = live.walletHoldings[symbol] ?? 0;
  const listed = Boolean(token?.listedOnMainnet ?? market?.listed);

  const siblings = useMemo(
    () => LISTED_TOKENS.filter((t) => t.symbol !== symbol),
    [symbol],
  );

  if (!token) {
    return (
      <>
        <SiteHeader />
        <main className="rh-container-wide flex-1 py-24">
          <h1 className="text-3xl text-white">Unknown asset</h1>
          <p className="mt-2 text-rh-muted">{symbol} is not a BorrowDesk market.</p>
          <Link href="/app" className="mt-6 inline-block text-rh-lime underline">
            Back to desk
          </Link>
        </main>
        <SiteFooter />
      </>
    );
  }

  const depositQuick = async () => {
    setMsg(null);
    setErr(null);
    const n = Number(amount);
    if (!live.isConnected) {
      openConnect();
      return;
    }
    if (!live.onRobinhood) {
      await live.switchToRobinhood();
      return;
    }
    if (!(n > 0)) {
      setErr("Enter an amount");
      return;
    }
    try {
      await live.approveAndDeposit(symbol, n);
      setMsg(`Deposited ${n} ${symbol}`);
      setAmount("");
      live.refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Deposit failed");
    }
  };

  return (
    <>
      <SiteHeader />
      <div className="pt-16">
        <CollateralTicker />
      </div>
      <main className="rh-container-wide flex-1 py-6 md:py-8">
        <Link
          href="/app"
          className="text-xs font-medium text-rh-muted hover:text-white"
        >
          ← Desk
        </Link>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <TokenLogo src={token.logo} symbol={token.symbol} size={40} />
            <div>
              <div className="section-kicker text-rh-lime">Collateral market</div>
              <h1 className="rh-display mt-0.5 text-[clamp(1.9rem,3.5vw,2.6rem)] text-white">
                {token.symbol}
              </h1>
              <p className="text-sm text-rh-muted">{token.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <span className="chip bg-white/10 text-white">
              {formatUsd(price)}
            </span>
            <span
              className={`chip ${
                listed ? "bg-ok/15 text-ok" : "bg-white/10 text-rh-muted"
              }`}
            >
              {listed ? "Listed" : "Not listed"}
            </span>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
          <Stat label="Oracle" value={formatUsd(market?.oraclePrice ?? price)} />
          <Stat
            label="LTV"
            value={`${((market?.ltvBps ?? token.ltvBps) / 100).toFixed(0)}%`}
          />
          <Stat
            label="Liq. threshold"
            value={`${((market?.liqBps ?? token.liquidationBps) / 100).toFixed(0)}%`}
          />
          <Stat
            label="Your deposit"
            value={`${formatToken(deposited, 6)} ${symbol}`}
            accent
          />
        </div>
        {"riskReason" in token && token.riskReason && (
          <p className="mt-2 text-xs text-rh-muted">
            <span className="text-rh-lime">Risk · </span>
            {token.riskReason}
          </p>
        )}

        <div className="panel panel-tight mt-4 rounded-2xl">
          <div className="mb-2 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-medium text-white">{symbol} chart</h2>
            <span className="section-kicker">TradingView</span>
          </div>
          <PriceChart symbol={symbol} />
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-2 lg:items-stretch">
          <div className="panel panel-tight flex flex-col rounded-2xl">
            <div className="flex items-baseline justify-between gap-3">
              <div>
                <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-rh-dim">
                  Quick deposit
                </div>
                <h2 className="mt-1 text-xl font-medium text-white">
                  Supply {symbol}
                </h2>
              </div>
              <a
                href={`${MAINNET.explorer}/token/${token.address}`}
                target="_blank"
                rel="noreferrer"
                className="shrink-0 text-[11px] text-rh-cyan hover:underline"
              >
                Explorer
              </a>
            </div>
            <p className="mt-1 text-xs text-rh-muted">
              Wallet {formatToken(wallet, 6)} {symbol}
            </p>
            <div className="mt-4 flex gap-2">
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                inputMode="decimal"
                className="min-w-0 flex-1 rounded-xl border border-rh-border bg-black px-3 py-2.5 text-lg font-medium tabular text-white outline-none focus:border-rh-lime/50"
              />
              <button
                type="button"
                className="rounded-xl border border-rh-border px-3 text-sm text-rh-lime"
                onClick={() => setAmount(wallet > 0 ? String(wallet) : "")}
              >
                Max
              </button>
            </div>
            {err && <p className="mt-2 text-xs text-danger">{err}</p>}
            {msg && <p className="mt-2 text-xs text-ok">{msg}</p>}
            <button
              type="button"
              disabled={!listed || live.isPending}
              onClick={() => void depositQuick()}
              className="mt-4 w-full rounded-full bg-rh-lime py-2.5 text-sm font-medium text-rh-on-lime disabled:opacity-40"
            >
              {!live.isConnected
                ? "Connect wallet"
                : live.isPending
                  ? "Confirm…"
                  : `Deposit ${symbol}`}
            </button>
            <div className="mt-auto grid grid-cols-2 gap-2 pt-4 text-[11px] text-rh-dim">
              <div className="rounded-lg bg-black px-3 py-2">
                LTV{" "}
                <span className="tabular text-white">
                  {((market?.ltvBps ?? token.ltvBps) / 100).toFixed(0)}%
                </span>
              </div>
              <div className="rounded-lg bg-black px-3 py-2">
                Liq{" "}
                <span className="tabular text-white">
                  {((market?.liqBps ?? token.liquidationBps) / 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </div>

          <div className="panel panel-tight flex flex-col rounded-2xl">
            <div className="section-kicker">Your position</div>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <PosStat
                label="Deposited"
                value={`${formatToken(deposited, 6)} ${symbol}`}
              />
              <PosStat label="Value" value={formatUsd(deposited * price)} />
              <PosStat
                label="Wallet"
                value={`${formatToken(wallet, 6)} ${symbol}`}
              />
              <PosStat
                label="Account debt"
                value={formatUsd(live.ready ? live.liveMetrics.debtUsd : 0)}
              />
              <PosStat
                label="Health factor"
                value={
                  live.ready
                    ? Number.isFinite(live.liveMetrics.healthFactor)
                      ? live.liveMetrics.healthFactor.toFixed(2)
                      : "∞"
                    : "-"
                }
                accent
              />
              <PosStat
                label="Borrow room"
                value={
                  live.ready
                    ? formatUsd(
                        Math.max(
                          0,
                          live.liveMetrics.borrowPowerUsd -
                            live.liveMetrics.debtUsd,
                        ),
                      )
                    : "-"
                }
              />
            </dl>
            <Link
              href="/app?desk=borrow"
              className="mt-auto pt-4 text-xs font-medium text-rh-lime hover:underline"
            >
              Open full ticket →
            </Link>
          </div>
        </div>

        <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1">
          <span className="shrink-0 text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
            Markets
          </span>
          {siblings.map((t) => (
            <Link
              key={t.symbol}
              href={`/app/${t.symbol.toLowerCase()}`}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-rh-border px-2 py-1 text-[11px] text-rh-muted hover:border-white/25 hover:text-white"
            >
              <TokenLogo src={t.logo} symbol={t.symbol} size={14} />
              {t.symbol}
            </Link>
          ))}
        </div>

        <div className="mt-6">
          <Suspense
            fallback={
              <div className="panel rounded-2xl p-6 text-rh-muted">
                Loading ticket…
              </div>
            }
          >
            <ActionPanel />
          </Suspense>
        </div>
      </main>
      <CommandPalette />
      <SiteFooter />
    </>
  );
}

function Stat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-xl border border-rh-border bg-rh-raised/80 px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-0.5 text-base font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function PosStat({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: boolean;
}) {
  return (
    <div>
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </dt>
      <dd
        className={`mt-0.5 font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
