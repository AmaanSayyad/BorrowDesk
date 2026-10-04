"use client";

import { MAINNET } from "@/lib/deployments";
import { FEATURED_TOKENS, USDG } from "@/lib/tokens";
import { useWalletModal } from "@/hooks/useWalletModal";
import { useAccount } from "wagmi";
import { TokenLogo } from "@/components/ui/TokenLogo";

const STEPS = [
  {
    n: "01",
    title: "Add Robinhood Chain",
    body: "Chain ID 4663. Reown will prompt the add/switch when you connect.",
  },
  {
    n: "02",
    title: "Fund ETH for gas",
    body: "Bridge or transfer a small amount of ETH to pay for deposits and borrows.",
  },
  {
    n: "03",
    title: "Get Stock Tokens",
    body: "Hold a listed Stock Token (NVDA, AAPL, QQQ, PLTR, … - 29 live markets) in the same wallet.",
  },
  {
    n: "04",
    title: "Deposit → Borrow USDG",
    body: "Lock collateral, draw Global Dollar, keep equity upside. See liq price before you sign.",
  },
];

export function OnboardingPanel() {
  const { isConnected } = useAccount();
  const { openConnect } = useWalletModal();

  return (
    <div
      id="onboarding"
      data-tour="onboarding"
      className="panel panel-tight scroll-mt-24 rounded-2xl"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-rh-dim">
            Judge path
          </div>
          <h2 className="mt-1 text-xl font-medium text-white">
            Get ready to borrow
          </h2>
          <p className="mt-1 max-w-xl text-sm text-rh-muted">
            Four steps from empty wallet to a live USDG credit line on
            Robinhood Chain mainnet.
          </p>
        </div>
        {!isConnected && (
          <button
            type="button"
            onClick={openConnect}
            className="neon-btn h-11 px-5 text-sm"
          >
            Connect with Reown
          </button>
        )}
      </div>

      <ol className="mt-6 grid gap-3 sm:grid-cols-2">
        {STEPS.map((s) => (
          <li
            key={s.n}
            className="rounded-xl border border-rh-border bg-black px-4 py-4"
          >
            <div className="text-[11px] font-medium text-rh-lime">{s.n}</div>
            <div className="mt-1 font-medium text-white">{s.title}</div>
            <p className="mt-1 text-sm leading-relaxed text-rh-muted">{s.body}</p>
          </li>
        ))}
      </ol>

      <div className="mt-6">
        <div className="text-[11px] font-medium uppercase tracking-[0.14em] text-rh-dim">
          Featured collateral
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {FEATURED_TOKENS.map((t) => (
            <a
              key={t.symbol}
              href={`/app/${t.symbol.toLowerCase()}`}
              className="inline-flex items-center gap-2 rounded-full border border-rh-border bg-black px-3 py-1.5 text-sm text-white hover:border-rh-lime/40"
            >
              <TokenLogo src={t.logo} symbol={t.symbol} size={18} />
              {t.symbol}
            </a>
          ))}
          <span className="inline-flex items-center gap-2 rounded-full border border-rh-border bg-black px-3 py-1.5 text-sm text-rh-muted">
            <TokenLogo src={USDG.logo} symbol="USDG" size={18} />
            Borrow {USDG.symbol}
          </span>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-3 text-sm">
        <a
          href={`${MAINNET.explorer}/address/${MAINNET.market}`}
          target="_blank"
          rel="noreferrer"
          className="text-rh-cyan underline"
        >
          Live market on explorer
        </a>
        <a
          href="https://robinhoodchain.blockscout.com"
          target="_blank"
          rel="noreferrer"
          className="text-rh-muted underline hover:text-white"
        >
          Block explorer
        </a>
      </div>
    </div>
  );
}
