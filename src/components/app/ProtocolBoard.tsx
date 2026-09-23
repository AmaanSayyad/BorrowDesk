"use client";

import { useMemo } from "react";
import { usePrices } from "@/hooks/usePrices";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { useOracleMarkets } from "@/hooks/useOracleMarkets";
import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS } from "@/lib/tokens";
import { formatToken, formatUsd } from "@/lib/utils";
import { TokenLogo } from "@/components/ui/TokenLogo";

/** Protocol-wide solvency / liquidity board - TORQUE-style trust object. */
export function ProtocolBoard() {
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const prices = usePrices();
  const { rows: markets } = useOracleMarkets();

  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;
  const protocolDebt = live.protocolDebtUsdg;
  const util =
    poolUsdg + protocolDebt > 0
      ? protocolDebt / (poolUsdg + protocolDebt)
      : 0;

  const yourCollat = useMemo(() => {
    return LISTED_TOKENS.map((t) => {
      const bal = live.collateral[t.symbol] ?? 0;
      const m = markets.find((r) => r.symbol === t.symbol);
      const px = m?.oraclePrice ?? prices[t.symbol] ?? t.fallbackPrice;
      return {
        symbol: t.symbol,
        logo: t.logo,
        bal,
        usd: bal * px,
        ltv: (m?.ltvBps ?? t.ltvBps) / 100,
        liq: (m?.liqBps ?? t.liquidationBps) / 100,
        listed: m?.listed ?? Boolean(t.listedOnMainnet),
      };
    }).filter((r) => r.listed);
  }, [live.collateral, markets, prices]);

  const yourCollatUsd = yourCollat.reduce((s, r) => s + r.usd, 0);

  return (
    <div data-tour="protocol" className="space-y-6">
      <div className="panel panel-tight rounded-2xl">
        <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-rh-dim">
          Protocol board
        </div>
        <h2 className="mt-1 text-xl font-medium text-white">
          Liquidity, debt, utilisation
        </h2>
        <p className="mt-2 max-w-xl text-sm text-rh-muted">
          Idle USDG funds new borrows. Protocol debt is outstanding borrower
          principal + accrued interest. Utilisation = debt / (idle + debt).
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Tile label="Idle USDG" value={formatUsd(poolUsdg)} />
          <Tile label="Protocol debt" value={formatUsd(protocolDebt)} />
          <Tile
            label="Utilisation"
            value={`${(util * 100).toFixed(1)}%`}
            tone={util > 0.85 ? "warn" : "lime"}
          />
          <Tile
            label="Your collateral"
            value={live.ready ? formatUsd(yourCollatUsd) : "-"}
          />
        </div>

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-[11px] text-rh-dim">
            <span>Idle</span>
            <span>Lent</span>
          </div>
          <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
            <div
              className="bg-rh-lime"
              style={{
                width: `${Math.max(2, (1 - util) * 100)}%`,
              }}
            />
            <div
              className="bg-rh-cyan/70"
              style={{ width: `${Math.max(0, util * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-rh-muted">
            Lime = idle cash available to borrow · Cyan = outstanding debt
          </p>
        </div>
      </div>

      <div className="panel panel-tight rounded-2xl">
        <h3 className="text-lg font-medium text-white">Your deposited book</h3>
        <p className="mt-1 text-sm text-rh-muted">
          Per-asset balances in the market (connect wallet to populate).
        </p>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead>
              <tr className="border-b border-rh-border text-[11px] uppercase tracking-[0.12em] text-rh-dim">
                <th className="py-2 font-medium">Asset</th>
                <th className="py-2 font-medium">Deposited</th>
                <th className="py-2 font-medium">USD</th>
                <th className="py-2 font-medium">LTV / Liq</th>
              </tr>
            </thead>
            <tbody>
              {yourCollat.map((r) => (
                <tr key={r.symbol} className="border-b border-white/8">
                  <td className="py-3">
                    <span className="inline-flex items-center gap-2 text-white">
                      <TokenLogo src={r.logo} symbol={r.symbol} size={20} />
                      {r.symbol}
                    </span>
                  </td>
                  <td className="py-3 tabular text-rh-muted">
                    {live.ready ? formatToken(r.bal, 6) : "-"}
                  </td>
                  <td className="py-3 tabular text-white">
                    {live.ready ? formatUsd(r.usd) : "-"}
                  </td>
                  <td className="py-3 tabular text-rh-muted">
                    {r.ltv.toFixed(0)}% / {r.liq.toFixed(0)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-2xl border border-rh-border bg-black px-4 py-3 text-xs text-rh-muted">
        Market{" "}
        <a
          className="text-rh-cyan hover:underline"
          href={`${MAINNET.explorer}/address/${MAINNET.market}`}
          target="_blank"
          rel="noreferrer"
        >
          {MAINNET.market.slice(0, 6)}…{MAINNET.market.slice(-4)}
        </a>
        {" · "}
        Pool is owner-seeded for the buildathon - see Limits on the landing
        page.
      </div>
    </div>
  );
}

function Tile({
  label,
  value,
  tone = "lime",
}: {
  label: string;
  value: string;
  tone?: "lime" | "warn";
}) {
  return (
    <div className="rounded-xl border border-rh-border bg-black px-4 py-3">
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-1 text-xl font-medium tabular ${
          tone === "warn" ? "text-warn" : "text-rh-lime"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
