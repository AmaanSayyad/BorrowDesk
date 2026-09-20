"use client";

import { useState } from "react";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";

export function AccrueButton() {
  const live = useBorrowDeskLive();
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const ago =
    live.lastAccrualSec > 0
      ? Math.max(0, Math.floor(Date.now() / 1000 - live.lastAccrualSec))
      : null;

  const run = async () => {
    setMsg(null);
    setErr(null);
    try {
      if (!live.isConnected) {
        setErr("Connect a wallet first");
        return;
      }
      if (!live.onRobinhood) {
        await live.switchToRobinhood();
        return;
      }
      await live.accrue();
      setMsg("Interest accrued on-chain");
      live.refetch();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Accrue failed");
    }
  };

  return (
    <div className="rounded-xl border border-rh-border bg-black px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
            Interest
          </div>
          <p className="mt-1 text-sm text-rh-muted">
            Push protocol accrual (util APR: 2% + 8%×util).{" "}
            {ago != null
              ? `Last on-chain update ${formatAgo(ago)}.`
              : "Last update unknown."}
          </p>
        </div>
        <button
          type="button"
          onClick={() => void run()}
          disabled={live.isPending}
          className="shrink-0 rounded-full bg-rh-lime px-4 py-2 text-sm font-medium text-rh-on-lime hover:brightness-95 disabled:opacity-50"
        >
          {live.isPending ? "Pending…" : "Accrue interest"}
        </button>
      </div>
      {msg && <p className="mt-2 text-xs text-ok">{msg}</p>}
      {err && <p className="mt-2 text-xs text-danger">{err}</p>}
    </div>
  );
}

function formatAgo(sec: number) {
  if (sec < 60) return `${sec}s ago`;
  if (sec < 3600) return `${Math.floor(sec / 60)}m ago`;
  if (sec < 86400) return `${Math.floor(sec / 3600)}h ago`;
  return `${Math.floor(sec / 86400)}d ago`;
}
