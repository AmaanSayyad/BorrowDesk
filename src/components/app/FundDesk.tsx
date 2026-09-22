"use client";

import { useCallback, useEffect, useState } from "react";
import { useAccount, useReadContract, useWriteContract } from "wagmi";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { useSwapDeposit } from "@/hooks/useSwapDeposit";
import { borrowDeskAbi, erc20Abi } from "@/lib/abi/borrowdesk";
import { robinhoodChain } from "@/lib/chains";
import { MAINNET } from "@/lib/deployments";
import { fromUsdgUnits, toTokenUnits, toUsdgUnits } from "@/lib/live";
import { explainRevert } from "@/lib/reverts";
import { FEATURED_TOKENS, USDG, getToken } from "@/lib/tokens";
import { cn, formatToken, formatUsd } from "@/lib/utils";

export type FundMode = "get" | "batch" | "supply";

const MODES: { id: FundMode; label: string; blurb: string }[] = [
  { id: "get", label: "Get stock", blurb: "Swap USDG → deposit" },
  { id: "batch", label: "Deposit+borrow", blurb: "One ticket" },
  { id: "supply", label: "Supply", blurb: "Earn as LP" },
];

export function FundDesk({
  initialMode = "get",
}: {
  initialMode?: FundMode;
}) {
  const [mode, setMode] = useState<FundMode>(initialMode);

  useEffect(() => {
    setMode(initialMode);
  }, [initialMode]);

  const active = MODES.find((m) => m.id === mode)!;

  return (
    <div className="panel panel-tight rounded-2xl" data-tour="fund">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="section-kicker">Fund the line</div>
          <h2 className="mt-1 text-xl font-medium text-white">
            {active.label}
          </h2>
          <p className="mt-1 text-sm text-rh-muted">{active.blurb}</p>
        </div>
      </div>

      <div className="mt-4 flex gap-1 rounded-full bg-black p-1">
        {MODES.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setMode(m.id)}
            className={cn(
              "h-9 flex-1 rounded-full px-2 text-sm font-medium transition",
              mode === m.id
                ? "bg-rh-lime text-rh-on-lime"
                : "text-rh-muted hover:text-white",
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {mode === "get" && <GetMode />}
        {mode === "batch" && <BatchMode />}
        {mode === "supply" && <SupplyMode />}
      </div>
    </div>
  );
}

function TokenPicker({
  symbol,
  onChange,
}: {
  symbol: string;
  onChange: (s: string) => void;
}) {
  return (
    <div>
      <label className="text-xs font-medium uppercase tracking-wider text-rh-dim">
        Asset
      </label>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:grid-cols-6">
        {FEATURED_TOKENS.slice(0, 6).map((t) => (
          <button
            key={t.symbol}
            type="button"
            onClick={() => onChange(t.symbol)}
            className={cn(
              "flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-sm transition",
              symbol === t.symbol
                ? "border-rh-lime bg-rh-lime/10 text-white"
                : "border-rh-border bg-black text-rh-muted hover:border-white/20",
            )}
          >
            <TokenLogo src={t.logo} symbol={t.symbol} size={18} />
            <span className="font-medium">{t.symbol}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function AmountField({
  label,
  value,
  onChange,
  maxLabel,
  onMax,
  disabled,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  maxLabel?: string;
  onMax?: () => void;
  disabled?: boolean;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-rh-border bg-black p-4">
      <div className="flex items-center justify-between gap-2">
        <label className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
          {label}
        </label>
        {onMax && (
          <button
            type="button"
            onClick={onMax}
            disabled={disabled}
            className="text-xs font-medium text-rh-lime hover:underline disabled:opacity-40"
          >
            {maxLabel ?? "Max"}
          </button>
        )}
      </div>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        inputMode="decimal"
        placeholder="0.00"
        disabled={disabled}
        className="mt-2 h-12 w-full border-0 bg-transparent text-2xl font-medium text-white outline-none disabled:opacity-40"
      />
      {hint && <div className="mt-1 text-xs text-rh-muted">{hint}</div>}
    </div>
  );
}

function GetMode() {
  const live = useBorrowDeskLive();
  const swap = useSwapDeposit();
  const [symbol, setSymbol] = useState("NVDA");
  const [usdgAmount, setUsdgAmount] = useState("");
  const [quote, setQuote] = useState<{ amountOut: number; fee: number } | null>(
    null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleQuote = async () => {
    const amount = Number(usdgAmount);
    if (!amount || amount <= 0) {
      setError("Enter USDG amount");
      return;
    }
    setError(null);
    try {
      setQuote(await swap.quoteSwap(symbol, amount));
    } catch (e) {
      setError(explainRevert(e));
    }
  };

  const handleBuyAndDeposit = async () => {
    const amount = Number(usdgAmount);
    if (!amount || amount <= 0) {
      setError("Enter USDG amount");
      return;
    }
    if (!live.isConnected) {
      setError("Connect wallet");
      return;
    }
    setError(null);
    setMessage(null);
    try {
      await swap.swapAndDeposit(symbol, amount);
      setMessage(
        `Bought & deposited ~${formatToken(quote?.amountOut ?? 0)} ${symbol}`,
      );
      setUsdgAmount("");
      setQuote(null);
      live.refetch();
    } catch (e) {
      setError(explainRevert(e));
    }
  };

  return (
    <div className="space-y-4">
      <TokenPicker
        symbol={symbol}
        onChange={(s) => {
          setSymbol(s);
          setQuote(null);
        }}
      />
      <AmountField
        label="Spend USDG"
        value={usdgAmount}
        onChange={(v) => {
          setUsdgAmount(v);
          setQuote(null);
        }}
        maxLabel={`Max ${formatUsd(live.walletUsdg)}`}
        onMax={() => setUsdgAmount(String(live.walletUsdg))}
        disabled={!live.ready}
      />
      {quote && (
        <div className="rounded-2xl border border-rh-lime/25 bg-rh-lime/5 p-4 text-sm">
          <div className="text-[10px] font-medium uppercase tracking-wider text-rh-lime">
            Quote
          </div>
          <div className="mt-2 flex justify-between gap-3">
            <span className="text-rh-muted">You get</span>
            <span className="font-medium text-white">
              {formatToken(quote.amountOut)} {symbol}
            </span>
          </div>
          <div className="mt-1 flex justify-between gap-3">
            <span className="text-rh-muted">Pool fee</span>
            <span className="font-medium text-white">
              {(quote.fee / 10_000).toFixed(2)}%
            </span>
          </div>
        </div>
      )}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => void handleQuote()}
          disabled={swap.isPending || !live.ready}
          className="ghost-btn h-11 flex-1 text-sm"
        >
          Quote
        </button>
        <button
          type="button"
          onClick={() => void handleBuyAndDeposit()}
          disabled={swap.isPending || !live.ready || !quote}
          className="neon-btn h-11 flex-1 text-sm"
        >
          {swap.isPending ? "Confirm…" : "Buy & deposit"}
        </button>
      </div>
      {message && <p className="text-sm font-medium text-ok">{message}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

function BatchMode() {
  const { address } = useAccount();
  const live = useBorrowDeskLive();
  const { writeContractAsync, isPending } = useWriteContract();
  const [symbol, setSymbol] = useState("NVDA");
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");
  const [reviewOpen, setReviewOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const token = getToken(symbol)!;

  const handleSubmit = useCallback(async () => {
    if (!address) {
      setError("Connect wallet");
      return;
    }
    const deposit = Number(depositAmount);
    const borrow = Number(borrowAmount);
    if (!deposit || deposit <= 0) {
      setError("Enter deposit amount");
      return;
    }
    if (!borrow || borrow <= 0) {
      setError("Enter borrow amount");
      return;
    }
    setError(null);
    setMessage(null);
    setReviewOpen(false);
    try {
      const depositUnits = toTokenUnits(deposit, 18);
      const borrowUnits = toUsdgUnits(borrow);
      await writeContractAsync({
        chainId: robinhoodChain.id,
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [MAINNET.market, depositUnits],
      });
      try {
        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "depositAndBorrow",
          args: [token.address, depositUnits, borrowUnits],
        });
      } catch {
        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "deposit",
          args: [token.address, depositUnits],
        });
        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "borrow",
          args: [borrowUnits],
        });
      }
      setMessage(
        `Deposited ${formatToken(deposit)} ${symbol} · borrowed ${formatUsd(borrow)}`,
      );
      setDepositAmount("");
      setBorrowAmount("");
      live.refetch();
    } catch (e) {
      setError(explainRevert(e));
    }
  }, [
    address,
    depositAmount,
    borrowAmount,
    token,
    symbol,
    writeContractAsync,
    live,
  ]);

  const openReview = () => {
    if (!Number(depositAmount) || Number(depositAmount) <= 0) {
      setError("Enter deposit amount");
      return;
    }
    if (!Number(borrowAmount) || Number(borrowAmount) <= 0) {
      setError("Enter borrow amount");
      return;
    }
    setError(null);
    setReviewOpen(true);
  };

  return (
    <div className="space-y-4">
      <TokenPicker symbol={symbol} onChange={setSymbol} />
      <AmountField
        label={`Deposit ${symbol}`}
        value={depositAmount}
        onChange={setDepositAmount}
        disabled={!live.ready}
        hint={`Wallet ${formatToken(live.walletHoldings[symbol] ?? 0)} ${symbol}`}
        maxLabel="Max"
        onMax={() =>
          setDepositAmount(String(live.walletHoldings[symbol] ?? 0))
        }
      />
      <AmountField
        label="Borrow USDG"
        value={borrowAmount}
        onChange={setBorrowAmount}
        disabled={!live.ready}
        hint={`Pool ${formatUsd(live.poolUsdg)} idle`}
      />
      {reviewOpen ? (
        <div className="rounded-2xl border border-rh-lime/35 bg-rh-lime/5 p-4">
          <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-lime">
            Review
          </div>
          <div className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-rh-dim">Deposit</span>
              <span className="font-medium text-white">
                {formatToken(Number(depositAmount))} {symbol}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-rh-dim">Borrow</span>
              <span className="font-medium text-white">
                {formatUsd(Number(borrowAmount))} USDG
              </span>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={isPending}
              className="neon-btn h-11 flex-1 text-sm"
            >
              {isPending ? "Confirm…" : "Confirm & sign"}
            </button>
            <button
              type="button"
              onClick={() => setReviewOpen(false)}
              disabled={isPending}
              className="ghost-btn h-11 flex-1 text-sm"
            >
              Back
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={openReview}
          disabled={isPending || !live.ready}
          className="neon-btn h-12 w-full text-base"
        >
          Review ticket
        </button>
      )}
      {message && <p className="text-sm font-medium text-ok">{message}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}

function SupplyMode() {
  const { address } = useAccount();
  const live = useBorrowDeskLive();
  const { writeContractAsync, isPending } = useWriteContract();
  const [tab, setTab] = useState<"supply" | "redeem">("supply");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const utilization = useReadContract({
    address: MAINNET.market,
    abi: borrowDeskAbi,
    functionName: "utilizationBps",
    chainId: robinhoodChain.id,
    query: { refetchInterval: 20_000 },
  });
  const previewApr = useReadContract({
    address: MAINNET.market,
    abi: borrowDeskAbi,
    functionName: "previewBorrowAprBps",
    chainId: robinhoodChain.id,
    query: { refetchInterval: 20_000 },
  });
  const supplyShares = useReadContract({
    address: MAINNET.market,
    abi: borrowDeskAbi,
    functionName: "supplyShares",
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });
  const assetsOf = useReadContract({
    address: MAINNET.market,
    abi: borrowDeskAbi,
    functionName: "assetsOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: Boolean(address), refetchInterval: 15_000 },
  });

  const util = utilization.data ? Number(utilization.data) / 10_000 : 0;
  const aprBps = previewApr.data
    ? Number(previewApr.data)
    : Math.floor(200 + 800 * util);
  const supplyApr = (aprBps / 10_000) * util;
  const userSupplied = assetsOf.data ? fromUsdgUnits(assetsOf.data) : 0;
  const max = tab === "supply" ? live.walletUsdg : userSupplied;

  const handleSubmit = async () => {
    setMessage(null);
    setError(null);
    const value = Number(amount);
    if (!value || value <= 0) {
      setError("Enter an amount");
      return;
    }
    if (!address) {
      setError("Connect wallet");
      return;
    }
    try {
      if (tab === "supply") {
        const units = toUsdgUnits(value);
        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: USDG.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [MAINNET.market, units],
        });
        try {
          await writeContractAsync({
            chainId: robinhoodChain.id,
            address: MAINNET.market,
            abi: borrowDeskAbi,
            functionName: "supply",
            args: [units],
          });
        } catch {
          await writeContractAsync({
            chainId: robinhoodChain.id,
            address: MAINNET.market,
            abi: borrowDeskAbi,
            functionName: "addLiquidity",
            args: [units],
          });
        }
        setMessage(`Supplied ${formatUsd(value)} USDG`);
      } else {
        const shares = supplyShares.data ?? BigInt(0);
        try {
          await writeContractAsync({
            chainId: robinhoodChain.id,
            address: MAINNET.market,
            abi: borrowDeskAbi,
            functionName: "redeem",
            args: [shares],
          });
        } catch {
          await writeContractAsync({
            chainId: robinhoodChain.id,
            address: MAINNET.market,
            abi: borrowDeskAbi,
            functionName: "removeLiquidity",
            args: [toUsdgUnits(userSupplied)],
          });
        }
        setMessage(`Redeemed ${formatUsd(userSupplied)} USDG`);
      }
      setAmount("");
      live.refetch();
    } catch (e) {
      setError(explainRevert(e));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-full border border-rh-border bg-black/60 p-1">
        {(["supply", "redeem"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-8 flex-1 rounded-full text-xs font-medium capitalize transition",
              tab === t
                ? "bg-white/10 text-white"
                : "text-rh-muted hover:text-white",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-2 rounded-xl border border-rh-border bg-black p-3 text-xs">
        <div>
          <div className="text-[10px] uppercase tracking-wider text-rh-dim">
            Utilization
          </div>
          <div className="mt-0.5 font-medium text-white">
            {(util * 100).toFixed(1)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-rh-dim">
            Supply APR
          </div>
          <div className="mt-0.5 font-medium text-rh-lime">
            {(supplyApr * 100).toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-rh-dim">
            Your supplied
          </div>
          <div className="mt-0.5 font-medium text-white">
            {formatUsd(userSupplied)}
          </div>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-wider text-rh-dim">
            Wallet USDG
          </div>
          <div className="mt-0.5 font-medium text-white">
            {formatUsd(live.walletUsdg)}
          </div>
        </div>
      </div>

      <AmountField
        label="Amount (USDG)"
        value={amount}
        onChange={setAmount}
        maxLabel={`Max ${formatUsd(max)}`}
        onMax={() => setAmount(String(max.toFixed(6)))}
        disabled={!live.ready}
        hint="Curve: 2% + 8% × utilization"
      />

      <button
        type="button"
        onClick={() => void handleSubmit()}
        disabled={isPending || !live.ready}
        className="neon-btn h-12 w-full text-base"
      >
        {isPending
          ? "Confirm…"
          : tab === "supply"
            ? "Supply USDG"
            : "Redeem USDG"}
      </button>
      {message && <p className="text-sm font-medium text-ok">{message}</p>}
      {error && <p className="text-sm font-medium text-danger">{error}</p>}
    </div>
  );
}
