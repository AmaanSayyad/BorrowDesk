"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { FEATURED_TOKENS, LISTED_TOKENS, getToken, USDG } from "@/lib/tokens";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { usePrices } from "@/hooks/usePrices";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { useWalletModal } from "@/hooks/useWalletModal";
import { MAINNET } from "@/lib/deployments";
import { formatToken, formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";
import {
  BORROW_APR,
  estimateRepaySplit,
  interestPerDay,
  readDebtLedger,
  recordBorrow,
  recordRepay,
} from "@/lib/debtLedger";
import { explainRevert } from "@/lib/reverts";
import { RouteChips } from "@/components/app/RouteChips";

type Tab = "deposit" | "withdraw" | "borrow" | "repay";

export function ActionPanel() {
  const searchParams = useSearchParams();
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const prices = usePrices();
  const { rows: markets } = useOracleMarkets();
  const { openConnect } = useWalletModal();
  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;
  const [tab, setTab] = useState<Tab>("deposit");
  const [symbol, setSymbol] = useState("NVDA");
  const [assetQuery, setAssetQuery] = useState("");
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [amount, setAmount] = useState("");
  const [ltvPct, setLtvPct] = useState(40);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [receipt, setReceipt] = useState<{
    repay: number;
    principal: number;
    interest: number;
    days: number;
    remaining: number;
    debtBefore: number;
    debtAfter: number;
  } | null>(null);

  useEffect(() => {
    const asset = searchParams.get("asset")?.toUpperCase();
    const ticket = searchParams.get("ticket")?.toLowerCase() as Tab | null;
    const desk = searchParams.get("desk")?.toLowerCase();
    if (asset && LISTED_TOKENS.some((t) => t.symbol === asset)) {
      setSymbol(asset);
    }
    if (ticket && ["deposit", "withdraw", "borrow", "repay"].includes(ticket)) {
      setTab(ticket);
    } else if (desk === "borrow" || searchParams.get("asset")) {
      // Deep link /app?asset=NVDA&desk=borrow → open borrow ticket
      if (desk === "borrow") setTab("borrow");
      else if (asset) setTab("deposit");
    }
  }, [searchParams]);

  useEffect(() => {
    const onSelect = (e: Event) => {
      const next = (e as CustomEvent<string>).detail;
      if (LISTED_TOKENS.some((t) => t.symbol === next)) {
        setSymbol(next);
        setTab("deposit");
        setMessage(null);
        setError(null);
        setReceipt(null);
      }
    };
    const onTicket = (e: Event) => {
      const detail = (e as CustomEvent<{ tab: Tab; symbol?: string }>).detail;
      if (!detail?.tab) return;
      setTab(detail.tab);
      if (
        detail.symbol &&
        LISTED_TOKENS.some((t) => t.symbol === detail.symbol)
      ) {
        setSymbol(detail.symbol);
      }
      setMessage(null);
      setError(null);
      setReceipt(null);
      setAmount("");
    };
    window.addEventListener("borrowdesk:select-symbol", onSelect);
    window.addEventListener("borrowdesk:ticket", onTicket);
    return () => {
      window.removeEventListener("borrowdesk:select-symbol", onSelect);
      window.removeEventListener("borrowdesk:ticket", onTicket);
    };
  }, []);

  const token = getToken(symbol)!;
  const market = markets.find((m) => m.symbol === symbol);
  const price = market?.oraclePrice ?? prices[symbol] ?? token.fallbackPrice;
  const liqBps = market?.liqBps ?? token.liquidationBps;
  const maxLtvPct = (market?.ltvBps ?? token.ltvBps) / 100;

  const maxBorrow = useMemo(() => {
    if (!live.ready) return 0;
    const room = Math.max(
      0,
      live.liveMetrics.borrowPowerUsd - live.liveMetrics.debtUsd,
    );
    return Math.min(room, poolUsdg);
  }, [live, poolUsdg]);

  const max = useMemo(() => {
    if (!live.ready) return 0;
    if (tab === "borrow") return maxBorrow;
    if (tab === "repay") return Math.min(live.debtUsdg, live.walletUsdg);
    if (tab === "deposit") return live.walletHoldings[symbol] ?? 0;
    if (tab === "withdraw") return live.collateral[symbol] ?? 0;
    return 0;
  }, [tab, live, symbol, maxBorrow]);

  // Sync LTV slider → borrow amount
  useEffect(() => {
    if (tab !== "borrow" || !live.ready) return;
    const collat = live.liveMetrics.collateralUsd;
    if (collat <= 0) return;
    const targetDebt = (collat * Math.min(ltvPct, maxLtvPct)) / 100;
    const additional = Math.max(
      0,
      Math.min(maxBorrow, targetDebt - live.liveMetrics.debtUsd),
    );
    setAmount(additional > 0 ? additional.toFixed(4) : "");
  }, [ltvPct, tab, live.ready, live.liveMetrics, maxBorrow, maxLtvPct]);

  const borrowPreview = useMemo(() => {
    const borrowAmt = Number(amount) || 0;
    const collat = live.liveMetrics.collateralUsd;
    const nextDebt = live.liveMetrics.debtUsd + borrowAmt;
    const nextLtv = collat > 0 ? nextDebt / collat : 0;
    const liqUsd = live.liveMetrics.liquidationUsd;
    const bufferUsd = Math.max(0, liqUsd - nextDebt);
    // Weighted avg liq price drop: debt / (collat * liqBps/10000) relative
    // Approximate single-asset drop to HF=1 using dominant collateral
    const deposited = live.collateral[symbol] ?? 0;
    const depositUsd = deposited * price;
    let dropPct = 0;
    let liqPrice = price;
    if (depositUsd > 0 && nextDebt > 0 && liqBps > 0) {
      // At liquidation: nextDebt = depositUsd * (price'/price) * liqBps/10000
      // price' = nextDebt * price / (depositUsd * liqBps/10000)
      const thresh = (depositUsd * liqBps) / 10_000;
      if (thresh > 0) {
        const ratio = nextDebt / thresh;
        // If multi-collateral, scale by share of this asset
        const share =
          collat > 0 ? Math.min(1, depositUsd / collat) : 1;
        const effectiveRatio = 1 - (1 - Math.min(1, ratio)) * share;
        dropPct = Math.max(0, (1 - Math.min(1, effectiveRatio / (share || 1))) * 100);
        // Simpler: liq price for this asset if it were sole collateral covering full debt share
        const assetDebtShare = nextDebt * (collat > 0 ? depositUsd / collat : 1);
        const liqValueNeeded = assetDebtShare / (liqBps / 10_000);
        liqPrice =
          deposited > 0 ? Math.max(0, liqValueNeeded / deposited) : price;
        dropPct = price > 0 ? Math.max(0, ((price - liqPrice) / price) * 100) : 0;
      }
    }
    return {
      borrowAmt,
      nextDebt,
      nextLtv,
      bufferUsd,
      interestDay: interestPerDay(nextDebt),
      dropPct,
      liqPrice,
      liqUsd,
    };
  }, [amount, live, symbol, price, liqBps]);

  const repayPreview = useMemo(() => {
    const repayAmt = Number(amount) || 0;
    const ledger = live.address ? readDebtLedger(live.address) : null;
    return estimateRepaySplit(repayAmt, live.debtUsdg, ledger);
  }, [amount, live.address, live.debtUsdg]);

  const balanceLine = useMemo(() => {
    if (!live.ready) return "Connect wallet on Robinhood Chain";
    if (tab === "deposit") {
      return `Wallet ${formatToken(live.walletHoldings[symbol] ?? 0, 6)} ${symbol}`;
    }
    if (tab === "withdraw") {
      return `Deposited ${formatToken(live.collateral[symbol] ?? 0, 6)} ${symbol}`;
    }
    if (tab === "borrow") {
      return `Available ${formatUsd(max)} · Pool ${formatUsd(poolUsdg)}`;
    }
    return `Debt ${formatUsd(live.debtUsdg)} · Wallet ${formatUsd(live.walletUsdg)}`;
  }, [tab, live, symbol, max, poolUsdg]);

  const reviewLines = useMemo(() => {
    const value = Number(amount) || 0;
    const lines: { label: string; value: string }[] = [
      { label: "Action", value: tab },
      {
        label: "Amount",
        value:
          tab === "borrow" || tab === "repay"
            ? `${formatUsd(value)} USDG`
            : `${formatToken(value)} ${symbol}`,
      },
    ];
    if (tab === "borrow") {
      lines.push(
        { label: "LTV after", value: `${(borrowPreview.nextLtv * 100).toFixed(1)}%` },
        { label: "Debt after", value: formatUsd(borrowPreview.nextDebt) },
        {
          label: "Drop to liquidatable",
          value: `${borrowPreview.dropPct.toFixed(1)}%`,
        },
        { label: "Pool idle", value: formatUsd(poolUsdg) },
      );
    }
    if (tab === "repay") {
      lines.push(
        { label: "Debt before", value: formatUsd(live.debtUsdg) },
        { label: "Debt after (est.)", value: formatUsd(repayPreview.remainingDebt) },
        { label: "Est. interest", value: formatUsd(repayPreview.interestPortion) },
      );
    }
    if (tab === "deposit" || tab === "withdraw") {
      lines.push(
        { label: "Mark", value: `${formatUsd(price)} / ${symbol}` },
        { label: "≈ USD", value: formatUsd(value * price) },
      );
    }
    return lines;
  }, [
    amount,
    tab,
    symbol,
    borrowPreview,
    repayPreview,
    poolUsdg,
    live.debtUsdg,
    price,
  ]);

  const onSubmit = async () => {
    setMessage(null);
    setError(null);
    setReceipt(null);
    setReviewOpen(false);
    const value = Number(amount);
    if (!Number.isFinite(value) || value <= 0) {
      setError("Enter an amount");
      return;
    }
    if (!live.isConnected) {
      setError("Connect your wallet");
      return;
    }
    if (!live.onRobinhood) {
      setError("Switch to Robinhood Chain (4663)");
      return;
    }

    try {
      if (tab === "deposit") await live.approveAndDeposit(symbol, value);
      if (tab === "withdraw") await live.withdraw(symbol, value);
      if (tab === "borrow") {
        const prior = live.debtUsdg;
        await live.borrow(value);
        if (live.address) recordBorrow(live.address, value, prior);
      }
      if (tab === "repay") {
        const debtBefore = live.debtUsdg;
        const split = estimateRepaySplit(
          value,
          debtBefore,
          live.address ? readDebtLedger(live.address) : null,
        );
        await live.repay(value);
        if (live.address) {
          recordRepay(live.address, value, split.remainingDebt);
        }
        setReceipt({
          repay: value,
          principal: split.principalPortion,
          interest: split.interestPortion,
          days: split.daysOpen,
          remaining: split.remainingDebt,
          debtBefore,
          debtAfter: split.remainingDebt,
        });
      }
      live.refetch();
      setMessage(
        tab === "borrow" || tab === "repay"
          ? `${tab === "borrow" ? "Borrowed" : "Repaid"} ${formatUsd(value)} ${USDG.symbol}`
          : `${tab === "deposit" ? "Deposited" : "Withdrew"} ${formatToken(value)} ${symbol}`,
      );
      setAmount("");
    } catch (e) {
      setError(explainRevert(e));
    }
  };

  const blocker = useMemo(() => {
    if (!live.isConnected) return null;
    if (!live.onRobinhood) return "Switch to Robinhood Chain (4663) to continue.";
    const value = Number(amount) || 0;
    if (tab === "borrow") {
      if (live.liveMetrics.collateralUsd <= 0) {
        return "Deposit Stock Tokens before borrowing USDG.";
      }
      if (poolUsdg <= 0) return "Pool has no idle USDG right now.";
      if (maxBorrow <= 0) {
        return "No borrow room - at max LTV or pool is empty.";
      }
      if (value > maxBorrow) {
        return `Max borrow is ${formatUsd(maxBorrow)} (power and pool).`;
      }
    }
    if (tab === "deposit" && value > (live.walletHoldings[symbol] ?? 0)) {
      return `Wallet only holds ${formatToken(live.walletHoldings[symbol] ?? 0)} ${symbol}.`;
    }
    if (tab === "withdraw") {
      if (value > (live.collateral[symbol] ?? 0)) {
        return `Only ${formatToken(live.collateral[symbol] ?? 0)} ${symbol} deposited.`;
      }
    }
    if (tab === "repay") {
      if (live.debtUsdg <= 0) return "No outstanding debt to repay.";
      if (value > live.walletUsdg) return "Not enough USDG in the wallet.";
    }
    return null;
  }, [live, tab, amount, poolUsdg, maxBorrow, symbol]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "deposit", label: "Deposit" },
    { id: "withdraw", label: "Withdraw" },
    { id: "borrow", label: "Borrow" },
    { id: "repay", label: "Repay" },
  ];

  const showAssetPicker = tab === "deposit" || tab === "withdraw";
  const usdHint =
    tab === "borrow" || tab === "repay"
      ? formatUsd(Number(amount) || 0)
      : formatUsd((Number(amount) || 0) * price);

  const ctaLabel = !live.isConnected
    ? "Connect wallet"
    : !live.onRobinhood
      ? "Switch to Robinhood Chain"
      : live.isPending
        ? "Confirm in wallet…"
        : tab === "deposit"
          ? `Deposit ${symbol}`
          : tab === "withdraw"
            ? `Withdraw ${symbol}`
            : tab === "borrow"
              ? "Borrow USDG"
              : "Repay USDG";

  return (
    <div
      id="ticket"
      data-tour="ticket"
      className="panel panel-tight scroll-mt-24 rounded-2xl"
    >
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="section-kicker">Ticket</div>
          <h2 className="mt-1 text-xl font-medium text-white">
            Manage credit line
          </h2>
        </div>
        <span
          className={`chip ${
            live.ready ? "bg-ok/15 text-ok" : "bg-white/10 text-rh-muted"
          }`}
        >
          {live.ready ? "Mainnet" : "Connect"}
        </span>
      </div>

      <div className="flex flex-wrap gap-1 rounded-full bg-black p-1">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setMessage(null);
              setError(null);
              setReceipt(null);
              setReviewOpen(false);
              setAmount("");
            }}
            className={`h-9 flex-1 min-w-[4.5rem] rounded-full px-3 text-sm font-medium transition ${
              tab === t.id
                ? "bg-rh-lime text-rh-on-lime"
                : "text-rh-muted hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {live.ready && (
        <p className="mt-3 text-xs text-rh-muted">
          Pool <strong className="text-white">{formatUsd(poolUsdg)}</strong>
          {" · "}
          Wallet{" "}
          <strong className="text-white">{formatUsd(live.walletUsdg)}</strong>
          {" · "}
          Debt{" "}
          <strong className="text-white">{formatUsd(live.debtUsdg)}</strong>
        </p>
      )}

      <RouteChips
        symbol={symbol}
        poolUsdg={poolUsdg}
        maxBorrow={maxBorrow}
      />

      {(tab === "borrow" || showAssetPicker) && (
        <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl border border-rh-border bg-black px-3 py-3 text-xs sm:grid-cols-4">
          <Mark
            label="Oracle mark"
            value={`${formatUsd(price)} / ${symbol}`}
          />
          <Mark label="Max LTV" value={`${maxLtvPct.toFixed(0)}%`} />
          <Mark
            label="Executable borrow"
            value={live.ready ? formatUsd(maxBorrow) : "-"}
            accent
          />
          <Mark
            label="Interest / day @ max"
            value={
              live.ready
                ? formatUsd(interestPerDay(live.liveMetrics.debtUsd + maxBorrow))
                : "-"
            }
          />
        </div>
      )}

      {showAssetPicker && (
        <div className="mt-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
              Collateral
            </label>
            <span className="text-xs text-rh-muted">{balanceLine}</span>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <input
              value={assetQuery}
              onChange={(e) => {
                setAssetQuery(e.target.value);
                if (e.target.value.trim()) setShowAllAssets(true);
              }}
              placeholder="Search ticker or name…"
              className="h-10 min-w-[12rem] flex-1 rounded-full border border-rh-border bg-black px-4 text-sm text-white outline-none placeholder:text-rh-dim focus:border-rh-lime/40"
            />
            <button
              type="button"
              onClick={() => setShowAllAssets((v) => !v)}
              className="chip border border-white/10 bg-transparent text-rh-muted hover:text-white"
            >
              {showAllAssets
                ? `All · ${LISTED_TOKENS.length}`
                : `Featured · ${FEATURED_TOKENS.length}`}
            </button>
          </div>
          <div className="mt-2 grid max-h-52 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3 md:grid-cols-4">
            {(assetQuery.trim()
              ? LISTED_TOKENS.filter((t) => {
                  const q = assetQuery.trim().toLowerCase();
                  return (
                    t.symbol.toLowerCase().includes(q) ||
                    t.name.toLowerCase().includes(q)
                  );
                })
              : showAllAssets
                ? LISTED_TOKENS
                : FEATURED_TOKENS
            ).map((t) => (
              <button
                key={t.symbol}
                type="button"
                onClick={() => setSymbol(t.symbol)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                  symbol === t.symbol
                    ? "border-rh-lime bg-rh-lime/10 text-white"
                    : "border-rh-border bg-black text-rh-muted hover:border-white/20 hover:text-white"
                }`}
              >
                <TokenLogo src={t.logo} symbol={t.symbol} size={22} />
                <div className="min-w-0">
                  <div className="font-medium">{t.symbol}</div>
                  <div className="truncate text-[10px] text-rh-dim">
                    {(t.ltvBps / 100).toFixed(0)}% LTV
                  </div>
                </div>
              </button>
            ))}
          </div>
          {!assetQuery.trim() && !showAllAssets && (
            <p className="mt-2 text-[11px] text-rh-dim">
              Showing {FEATURED_TOKENS.length} featured · search or All for{" "}
              {LISTED_TOKENS.length} live markets
            </p>
          )}
        </div>
      )}

      {!showAssetPicker && (
        <div className="mt-5 flex items-center justify-between text-xs text-rh-muted">
          <span className="font-medium uppercase tracking-[0.12em]">USDG</span>
          <span>{balanceLine}</span>
        </div>
      )}

      {tab === "borrow" && live.ready && (
        <div className="mt-4 rounded-2xl border border-rh-border bg-black p-4">
          <div className="flex items-center justify-between text-xs text-rh-muted">
            <span>Target LTV</span>
            <span className="tabular text-rh-lime">
              {ltvPct.toFixed(0)}%{" "}
              <span className="text-rh-dim">/ max {maxLtvPct.toFixed(0)}%</span>
            </span>
          </div>
          <input
            type="range"
            min={5}
            max={Math.max(5, maxLtvPct)}
            step={1}
            value={Math.min(ltvPct, maxLtvPct)}
            onChange={(e) => setLtvPct(Number(e.target.value))}
            className="mt-3 w-full accent-[#ccff00]"
          />
          <div className="mt-2 flex justify-between text-[11px] text-rh-dim">
            <span>Conservative</span>
            <span>Max LTV</span>
          </div>
        </div>
      )}

      <div className="mt-4 rounded-2xl border border-rh-border bg-black p-4">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
            Amount {showAssetPicker ? `(${symbol})` : `(${USDG.symbol})`}
          </label>
          <button
            type="button"
            className="text-xs font-medium text-rh-lime hover:underline disabled:opacity-40"
            disabled={!live.ready}
            onClick={() => setAmount(String(Number(Math.max(0, max).toFixed(6))))}
          >
            Max {formatToken(max, 4)}
          </button>
        </div>
        <input
          value={amount}
          onChange={(e) => {
            setAmount(e.target.value);
            if (tab === "borrow" && live.liveMetrics.collateralUsd > 0) {
              const v = Number(e.target.value) || 0;
              const next =
                ((live.liveMetrics.debtUsd + v) /
                  live.liveMetrics.collateralUsd) *
                100;
              if (Number.isFinite(next)) {
                setLtvPct(Math.min(maxLtvPct, Math.max(5, next)));
              }
            }
          }}
          inputMode="decimal"
          placeholder="0.00"
          disabled={!live.ready}
          className="mt-2 h-14 w-full border-0 bg-transparent text-3xl font-medium tabular text-white outline-none disabled:opacity-40"
        />
        <div className="mt-1 flex items-center justify-between text-sm text-rh-muted">
          <span>≈ {usdHint}</span>
          {showAssetPicker && (
            <span className="tabular">
              {formatUsd(price)} / {symbol}
            </span>
          )}
        </div>
      </div>

      {tab === "borrow" && (Number(amount) || 0) > 0 && (
        <div className="mt-4 grid gap-2 rounded-2xl border border-rh-lime/25 bg-rh-lime/5 p-4 sm:grid-cols-2">
          <Preview
            label="Liq. price (est.)"
            value={`${formatUsd(borrowPreview.liqPrice)} ${symbol}`}
          />
          <Preview
            label="Drop to liquidatable"
            value={`${borrowPreview.dropPct.toFixed(1)}%`}
          />
          <Preview
            label="Buffer after borrow"
            value={formatUsd(borrowPreview.bufferUsd)}
          />
          <Preview
            label="Interest / day"
            value={`${formatUsd(borrowPreview.interestDay)} · ${(BORROW_APR * 100).toFixed(0)}% APR`}
          />
          <Preview
            label="LTV after"
            value={`${(borrowPreview.nextLtv * 100).toFixed(1)}%`}
          />
          <Preview
            label="Debt after"
            value={formatUsd(borrowPreview.nextDebt)}
          />
        </div>
      )}

      {(tab === "repay" || (tab === "borrow" && live.debtUsdg > 0)) && (
        <div className="mt-4 rounded-2xl border border-rh-border bg-black p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
            Repay breakdown
          </div>
          <p className="mt-1 text-[11px] text-rh-dim">
            Pledge-style receipt · principal tracked client-side · APR{" "}
            {(BORROW_APR * 100).toFixed(0)}% onchain
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Preview label="Debt now" value={formatUsd(live.debtUsdg)} />
            <Preview
              label="Est. interest accrued"
              value={formatUsd(
                Math.max(
                  0,
                  live.debtUsdg -
                    (live.address
                      ? readDebtLedger(live.address)?.principalUsdg ??
                        live.debtUsdg * 0.98
                      : live.debtUsdg * 0.98),
                ),
              )}
            />
            {tab === "repay" && (Number(amount) || 0) > 0 && (
              <>
                <Preview
                  label="Est. principal in repay"
                  value={formatUsd(repayPreview.principalPortion)}
                />
                <Preview
                  label="Est. interest in repay"
                  value={formatUsd(repayPreview.interestPortion)}
                />
                <Preview
                  label="Days open"
                  value={
                    repayPreview.daysOpen > 0
                      ? `${repayPreview.daysOpen.toFixed(1)}d`
                      : "-"
                  }
                />
                <Preview
                  label="Debt after"
                  value={formatUsd(repayPreview.remainingDebt)}
                />
              </>
            )}
            <Preview
              label="Interest / day"
              value={formatUsd(interestPerDay(live.debtUsdg))}
            />
            <Preview label="APR" value={`${(BORROW_APR * 100).toFixed(0)}%`} />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          if (!live.isConnected) {
            openConnect();
            return;
          }
          if (!live.onRobinhood) {
            void live.switchToRobinhood();
            return;
          }
          if (blocker) {
            setError(blocker);
            return;
          }
          const value = Number(amount);
          if (!Number.isFinite(value) || value <= 0) {
            setError("Enter an amount");
            return;
          }
          setError(null);
          setReviewOpen(true);
        }}
        disabled={
          live.isPending ||
          Boolean(
            live.ready &&
              ((tab === "borrow" &&
                (live.liveMetrics.collateralUsd <= 0 ||
                  poolUsdg <= 0 ||
                  maxBorrow <= 0)) ||
                (tab === "repay" && live.debtUsdg <= 0)),
          )
        }
        className="neon-btn mt-6 flex h-12 w-full items-center justify-center text-base disabled:cursor-not-allowed disabled:opacity-40"
      >
        {ctaLabel}
      </button>

      {blocker && live.ready && (
        <p className="mt-3 text-sm text-warn">{blocker}</p>
      )}

      {reviewOpen && (
        <div className="mt-4 rounded-2xl border border-rh-lime/35 bg-rh-lime/5 p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-lime">
            Review before wallet
          </div>
          <p className="mt-1 text-xs text-rh-muted">
            Confirm the expected outcome, then sign. Nothing is submitted until
            you confirm.
          </p>
          <dl className="mt-4 grid gap-2 sm:grid-cols-2">
            {reviewLines.map((l) => (
              <div key={l.label}>
                <dt className="text-[10px] uppercase tracking-[0.12em] text-rh-dim">
                  {l.label}
                </dt>
                <dd className="text-sm font-medium tabular text-white">
                  {l.value}
                </dd>
              </div>
            ))}
          </dl>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={live.isPending}
              onClick={() => void onSubmit()}
              className="neon-btn h-11 px-5 text-sm disabled:opacity-50"
            >
              {live.isPending ? "Confirm in wallet…" : "Confirm & sign"}
            </button>
            <button
              type="button"
              disabled={live.isPending}
              onClick={() => setReviewOpen(false)}
              className="ghost-btn h-11 px-5 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {live.txHash && (
        <a
          className="mt-3 block text-sm font-medium text-rh-cyan underline"
          href={`${MAINNET.explorer}/tx/${live.txHash}`}
          target="_blank"
          rel="noreferrer"
        >
          View transaction
        </a>
      )}
      {message && <p className="mt-3 text-sm font-medium text-ok">{message}</p>}
      {error && <p className="mt-3 text-sm font-medium text-danger">{error}</p>}

      {receipt && (
        <div className="mt-4 rounded-2xl border border-ok/30 bg-ok/5 p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-ok">
            Realized repay
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <Preview label="Debt before" value={formatUsd(receipt.debtBefore)} />
            <Preview label="Debt after" value={formatUsd(receipt.debtAfter)} />
            <Preview label="Repaid" value={formatUsd(receipt.repay)} />
            <Preview label="Est. interest" value={formatUsd(receipt.interest)} />
            <Preview label="Est. principal" value={formatUsd(receipt.principal)} />
            <Preview
              label="Days open"
              value={
                receipt.days > 0 ? `${receipt.days.toFixed(1)}d` : "Same session"
              }
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Mark({
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
      <div className="text-[10px] uppercase tracking-[0.1em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-0.5 font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

function Preview({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-medium tabular text-white">{value}</div>
    </div>
  );
}
