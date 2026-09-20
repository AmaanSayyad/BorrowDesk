"use client";

import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getAddress, isAddress, type Address } from "viem";
import { fetchAccountSnapshot } from "@/hooks/useBorrowerScan";
import { MAINNET } from "@/lib/deployments";
import { PROVEN_POSITION } from "@/lib/demand";
import { formatUsd } from "@/lib/utils";

type LookRow = {
  address: Address;
  collateralUsd: number;
  debtUsd: number;
  liquidationUsd: number;
  healthy: boolean;
  healthFactor: number;
};

/** Walletless read-only look-up - Crest /account?account= pattern. */
export function AccountLookup() {
  const search = useSearchParams();
  const [input, setInput] = useState("");
  const [row, setRow] = useState<LookRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (raw: string) => {
    setError(null);
    setRow(null);
    if (!isAddress(raw)) {
      setError("Enter a valid 0x address");
      return;
    }
    setLoading(true);
    try {
      const addr = getAddress(raw) as Address;
      const snap = await fetchAccountSnapshot(addr);
      setRow({ address: addr, ...snap });
      setInput(addr);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Lookup failed");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = search.get("look") || search.get("account");
    if (q && isAddress(q)) void load(q);
  }, [search, load]);

  return (
    <div data-tour="lookup" className="panel panel-tight rounded-2xl">
      <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-rh-dim">
        Read-only look-up
      </div>
      <h2 className="mt-1 text-xl font-medium text-white">
        Inspect any account
      </h2>
      <p className="mt-2 text-sm text-rh-muted">
        No wallet needed. Pulls{" "}
        <code className="text-rh-lime">accountHealth</code> from the live market.
      </p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value.trim())}
          placeholder="0x…"
          className="h-11 flex-1 rounded-full border border-rh-border bg-black px-4 text-sm text-white outline-none focus:border-rh-lime/50"
        />
        <button
          type="button"
          disabled={loading}
          onClick={() => void load(input)}
          className="h-11 shrink-0 rounded-full bg-white/10 px-5 text-sm font-medium text-white hover:bg-white/15 disabled:opacity-50"
        >
          {loading ? "Reading…" : "Look up"}
        </button>
      </div>

      <button
        type="button"
        className="mt-3 text-xs text-rh-cyan hover:underline"
        onClick={() => void load(PROVEN_POSITION.borrower)}
      >
        Load proven deployer position
      </button>

      {error && <p className="mt-3 text-sm text-danger">{error}</p>}

      {row && (
        <div className="mt-5 grid gap-3 rounded-xl border border-ok/25 bg-ok/5 p-4 sm:grid-cols-2">
          <Field label="Address" value={`${row.address.slice(0, 6)}…${row.address.slice(-4)}`} />
          <Field
            label="Healthy"
            value={row.healthy ? "true" : "false"}
            tone={row.healthy ? "ok" : "danger"}
          />
          <Field label="Collateral" value={formatUsd(row.collateralUsd)} />
          <Field label="Debt" value={formatUsd(row.debtUsd)} />
          <Field
            label="Health factor"
            value={
              !Number.isFinite(row.healthFactor)
                ? "∞"
                : row.healthFactor.toFixed(2)
            }
          />
          <Field label="Liq threshold" value={formatUsd(row.liquidationUsd)} />
          <a
            className="sm:col-span-2 text-sm text-rh-cyan hover:underline"
            href={`${MAINNET.explorer}/address/${row.address}`}
            target="_blank"
            rel="noreferrer"
          >
            Open on explorer →
          </a>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "danger";
}) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </div>
      <div
        className={`mt-0.5 text-sm font-medium tabular ${
          tone === "ok"
            ? "text-ok"
            : tone === "danger"
              ? "text-danger"
              : "text-white"
        }`}
      >
        {value}
      </div>
    </div>
  );
}
