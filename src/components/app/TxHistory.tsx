"use client";

import { useState } from "react";
import { MAINNET } from "@/lib/deployments";
import { useActivityHistory } from "@/hooks/useActivityHistory";
import { useAccount } from "wagmi";

const tone: Record<string, string> = {
  Deposit: "text-rh-cyan",
  Withdraw: "text-warn",
  Borrow: "text-rh-lime",
  Repay: "text-ok",
};

const PREVIEW = 8;

export function TxHistory() {
  const { isConnected } = useAccount();
  const { items, loading, error } = useActivityHistory();
  const [expanded, setExpanded] = useState(false);

  const visible = expanded ? items : items.slice(0, PREVIEW);
  const hidden = Math.max(0, items.length - PREVIEW);

  return (
    <div className="panel rounded-2xl p-4 md:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          <h2 className="text-lg font-medium text-white">Your history</h2>
          <span className="text-[11px] uppercase tracking-[0.14em] text-rh-dim">
            Activity
            {items.length > 0 ? ` · ${items.length}` : ""}
          </span>
        </div>
        {loading && (
          <span className="text-[11px] text-rh-dim">Syncing…</span>
        )}
      </div>

      {!isConnected ? (
        <p className="mt-3 text-xs text-rh-muted">
          Connect to load deposit, borrow, repay, and withdraw events.
        </p>
      ) : error ? (
        <p className="mt-3 text-xs text-warn">{error}</p>
      ) : items.length === 0 && !loading ? (
        <p className="mt-3 text-xs text-rh-muted">
          No prints yet. Deposit collateral to start the tape.
        </p>
      ) : (
        <>
          <ul className="mt-3 max-h-64 overflow-y-auto overscroll-contain pr-0.5">
            {visible.map((item) => (
              <li key={item.id}>
                <a
                  href={`${MAINNET.explorer}/tx/${item.txHash}`}
                  target="_blank"
                  rel="noreferrer"
                  className="grid grid-cols-[5.5rem_minmax(0,1fr)_auto] items-center gap-x-3 border-b border-white/[0.05] py-1.5 text-xs transition hover:bg-white/[0.03]"
                >
                  <span
                    className={`truncate font-medium ${tone[item.type] ?? "text-white"}`}
                  >
                    {item.type}
                  </span>
                  <span className="min-w-0 truncate tabular text-rh-muted">
                    {item.amount}
                  </span>
                  <span className="shrink-0 tabular text-rh-dim hover:text-rh-cyan">
                    {item.txHash.slice(0, 6)}…
                  </span>
                </a>
              </li>
            ))}
          </ul>
          {hidden > 0 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="mt-2 text-[11px] font-medium text-rh-cyan hover:underline"
            >
              {expanded ? "Show less" : `Show ${hidden} more`}
            </button>
          )}
        </>
      )}
    </div>
  );
}
