"use client";

import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { MAINNET } from "@/lib/deployments";
import { formatUsd } from "@/lib/utils";

export function ActivityFeed({ poolUsdg = 0 }: { poolUsdg?: number }) {
  const live = useBorrowDeskLive();
  const m = live.liveMetrics;
  const debt = live.ready ? m.debtUsd : 0;
  const capacity = live.ready
    ? Math.max(0, m.borrowPowerUsd - m.debtUsd)
    : 0;
  const collateral = live.ready ? m.collateralUsd : 0;
  const util =
    poolUsdg + live.protocolDebtUsdg > 0
      ? live.protocolDebtUsdg / (poolUsdg + live.protocolDebtUsdg)
      : 0;
  // V2 curve: ~2% base + ~8% × util
  const borrowAprPct = 2 + 8 * util;

  return (
    <div className="panel panel-tight w-full rounded-2xl">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="section-kicker">Protocol</div>
          <h2 className="mt-1 text-lg font-medium text-white">Market status</h2>
        </div>
        <a
          href={`${MAINNET.explorer}/address/${MAINNET.market}`}
          target="_blank"
          rel="noreferrer"
          className="text-[11px] text-rh-cyan hover:underline"
        >
          {MAINNET.market.slice(0, 6)}…
        </a>
      </div>

      <dl className="mt-3 grid grid-cols-2 gap-2">
        <Stat label="Pool USDG" value={formatUsd(poolUsdg)} accent />
        <Stat label="Protocol debt" value={formatUsd(live.protocolDebtUsdg)} />
        <Stat label="Utilisation" value={`${(util * 100).toFixed(1)}%`} />
        <Stat label="Borrow APR" value={`${borrowAprPct.toFixed(2)}%`} />
        <Stat label="Your collateral" value={formatUsd(collateral)} />
        <Stat label="Your debt" value={formatUsd(debt)} />
        <Stat label="Borrow room" value={formatUsd(capacity)} />
        <Stat label="Liq. threshold" value={formatUsd(m.liquidationUsd)} />
      </dl>
    </div>
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
    <div className="rounded-lg bg-black/70 px-2.5 py-2">
      <dt className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-sm font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
