"use client";

import { MAINNET } from "@/lib/deployments";
import { useActivityHistory } from "@/hooks/useActivityHistory";
import { useAccount } from "wagmi";

const tone: Record<string, string> = {
  Deposit: "text-rh-cyan",
  Withdraw: "text-warn",
  Borrow: "text-rh-lime",
  Repay: "text-ok",
};

/** OpenGap-style print / last-fill tape of explorer-linked desk actions. */
export function PrintTape() {
  const { isConnected } = useAccount();
  const { items, loading, error } = useActivityHistory();
  const prints = items.slice(0, 8);

  return (
    <div data-tour="tape" className="panel panel-tight rounded-2xl">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <div className="section-kicker">Print tape</div>
          <h2 className="mt-1 text-lg font-medium text-white">Last fills</h2>
        </div>
        {loading && (
          <span className="text-[11px] text-rh-dim">Syncing…</span>
        )}
      </div>

      {!isConnected ? (
        <p className="mt-3 text-xs text-rh-muted">
          Connect to stream your onchain desk prints.
        </p>
      ) : error ? (
        <p className="mt-3 text-xs text-warn">{error}</p>
      ) : prints.length === 0 && !loading ? (
        <p className="mt-3 text-xs text-rh-muted">
          No prints yet. Deposit or borrow to ink the tape.
        </p>
      ) : prints.length === 0 ? (
        <p className="mt-3 text-xs text-rh-muted">Syncing prints…</p>
      ) : (
        <ul className="mt-3 max-h-52 overflow-y-auto">
          {prints.map((p) => (
            <li key={p.id}>
              <a
                href={`${MAINNET.explorer}/tx/${p.txHash}`}
                target="_blank"
                rel="noreferrer"
                className="grid grid-cols-[4.5rem_minmax(0,1fr)_auto] items-center gap-x-2 border-b border-white/[0.05] py-1.5 text-[11px] hover:bg-white/[0.03]"
              >
                <span
                  className={`truncate font-medium ${tone[p.type] ?? "text-white"}`}
                >
                  {p.type}
                </span>
                <span className="min-w-0 truncate tabular text-rh-muted">
                  {p.amount}
                </span>
                <span className="shrink-0 tabular text-rh-dim">
                  {p.txHash.slice(0, 6)}…
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
