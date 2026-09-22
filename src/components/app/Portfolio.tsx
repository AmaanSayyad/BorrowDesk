"use client";

import Link from "next/link";
import { LISTED_TOKENS, USDG } from "@/lib/tokens";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePrices } from "@/hooks/usePrices";
import { formatToken, formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";

function openTicket(
  tab: "deposit" | "withdraw" | "borrow" | "repay",
  symbol?: string,
) {
  window.dispatchEvent(
    new CustomEvent("borrowdesk:ticket", { detail: { tab, symbol } }),
  );
  document
    .getElementById("ticket")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Portfolio() {
  const live = useBorrowDeskLive();
  const prices = usePrices();

  const rows = LISTED_TOKENS.map((token) => {
    const deposited = live.collateral[token.symbol] ?? 0;
    const wallet = live.walletHoldings[token.symbol] ?? 0;
    const price = prices[token.symbol] ?? token.fallbackPrice;
    return { token, deposited, wallet, price, value: deposited * price };
  }).filter((r) => r.deposited > 0 || r.wallet > 0);

  return (
    <div data-tour="positions" className="panel panel-tight rounded-2xl">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="section-kicker">Portfolio</div>
          <h2 className="mt-1 text-xl font-medium text-white">Onchain balances</h2>
        </div>
        <div className="rounded-xl bg-rh-lime/10 px-3 py-2 text-right">
          <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-lime">
            {USDG.symbol}
          </div>
          <div className="text-lg font-medium tabular text-rh-lime">
            {formatUsd(live.ready ? live.walletUsdg : 0)}
          </div>
        </div>
      </div>

      <div className="mt-5 overflow-hidden rounded-xl border border-rh-border">
        <div className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1.1fr] gap-2 bg-black px-4 py-2.5 text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
          <div>Asset</div>
          <div>Wallet</div>
          <div>Deposited</div>
          <div>Value</div>
          <div className="text-right">Actions</div>
        </div>
        {!live.ready ? (
          <div className="px-4 py-8 text-sm text-rh-muted">
            Connect a wallet on Robinhood Chain to load Stock Token and USDG
            balances.
          </div>
        ) : rows.length === 0 ? (
          <div className="px-4 py-8 text-sm text-rh-muted">
            No listed Stock Token balances. Bridge or swap NVDA, AAPL, TSLA, or
            SPY onto Robinhood Chain, then deposit.
          </div>
        ) : (
          rows.map(({ token, wallet, deposited, value }) => (
            <div
              key={token.symbol}
              className="grid grid-cols-[1.2fr_0.9fr_0.9fr_0.9fr_1.1fr] items-center gap-2 border-t border-rh-border px-4 py-3 text-sm"
            >
              <Link
                href={`/app/${token.symbol.toLowerCase()}`}
                className="flex items-center gap-2 hover:opacity-90"
              >
                <TokenLogo src={token.logo} symbol={token.symbol} size={28} />
                <div>
                  <div className="font-medium text-white">{token.symbol}</div>
                  <div className="text-xs text-rh-dim">{token.name}</div>
                </div>
              </Link>
              <div className="tabular text-rh-muted">{formatToken(wallet, 6)}</div>
              <div className="tabular text-rh-muted">
                {formatToken(deposited, 6)}
              </div>
              <div className="font-medium tabular text-white">
                {formatUsd(value)}
              </div>
              <div className="flex justify-end gap-1.5">
                {wallet > 0 && (
                  <button
                    type="button"
                    onClick={() => openTicket("deposit", token.symbol)}
                    className="rounded-full bg-rh-lime/15 px-2.5 py-1 text-[11px] font-medium text-rh-lime"
                  >
                    Deposit
                  </button>
                )}
                {deposited > 0 && (
                  <button
                    type="button"
                    onClick={() => openTicket("withdraw", token.symbol)}
                    className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-white"
                  >
                    Withdraw
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {live.ready && live.debtUsdg > 0 && (
        <button
          type="button"
          onClick={() => openTicket("repay")}
          className="neon-btn mt-4 h-10 px-4 text-sm"
        >
          Repay {formatUsd(live.debtUsdg)} debt
        </button>
      )}
    </div>
  );
}
