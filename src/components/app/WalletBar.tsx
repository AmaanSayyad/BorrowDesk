"use client";

import { useAccount, useDisconnect } from "wagmi";
import { MAINNET } from "@/lib/deployments";
import { formatUsd } from "@/lib/utils";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { useWalletModal } from "@/hooks/useWalletModal";

export function WalletBar() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { openConnect, openAccount } = useWalletModal();
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;

  const short = (value: string) => `${value.slice(0, 6)}…${value.slice(-4)}`;

  return (
    <div data-tour="connect" className="panel panel-tight rounded-2xl">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <span className="chip bg-white/10 text-white">RH 4663</span>
          <span className="chip bg-rh-lime/15 text-rh-lime">
            Pool {formatUsd(poolUsdg)}
          </span>
          <a
            href={`${MAINNET.explorer}/address/${MAINNET.market}`}
            target="_blank"
            rel="noreferrer"
            className="chip bg-white/5 text-rh-muted hover:text-white"
          >
            {short(MAINNET.market)}
          </a>
          {live.ready && <span className="chip bg-ok/15 text-ok">Live</span>}
          {isConnected && !live.onRobinhood && (
            <span className="chip bg-warn/15 text-warn">Wrong network</span>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          {!isConnected ? (
            <button
              type="button"
              onClick={openConnect}
              className="neon-btn h-10 px-5 text-sm"
            >
              Connect wallet
            </button>
          ) : (
            <>
              {!live.onRobinhood && (
                <button
                  type="button"
                  onClick={() => live.switchToRobinhood()}
                  className="neon-btn h-10 px-4 text-sm"
                >
                  Switch network
                </button>
              )}
              <button
                type="button"
                onClick={openAccount}
                className="teal-btn h-10 px-4 text-sm"
              >
                {short(address ?? "")}
              </button>
              <button
                type="button"
                onClick={() => disconnect()}
                className="h-10 rounded-full border border-rh-border px-3 text-sm text-rh-muted hover:text-white"
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
