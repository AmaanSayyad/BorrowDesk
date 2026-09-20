"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import { fetchAccountSnapshot } from "@/hooks/useBorrowerScan";
import { formatUsd } from "@/lib/utils";
import type { Address } from "viem";

function ShareContent() {
  const searchParams = useSearchParams();
  const address = searchParams.get("a") as Address | null;
  const [snapshot, setSnapshot] = useState<Awaited<ReturnType<typeof fetchAccountSnapshot>> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    setError(null);
    fetchAccountSnapshot(address)
      .then(setSnapshot)
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [address]);

  if (!address) {
    return (
      <div className="min-h-screen bg-rh-bg flex items-center justify-center p-4">
        <div className="panel panel-tight rounded-2xl max-w-md">
          <h1 className="text-2xl font-medium text-white">BorrowDesk Position</h1>
          <p className="mt-3 text-sm text-rh-muted">
            Missing address parameter. Share links should include <code className="text-rh-lime">?a=0x...</code>
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rh-bg flex items-center justify-center p-4">
        <div className="panel panel-tight rounded-2xl max-w-md">
          <h1 className="text-2xl font-medium text-white">Loading position...</h1>
        </div>
      </div>
    );
  }

  if (error || !snapshot) {
    return (
      <div className="min-h-screen bg-rh-bg flex items-center justify-center p-4">
        <div className="panel panel-tight rounded-2xl max-w-md">
          <h1 className="text-2xl font-medium text-white">Error</h1>
          <p className="mt-3 text-sm text-danger">{error || "Failed to load position"}</p>
        </div>
      </div>
    );
  }

  const buffer = Math.max(0, snapshot.liquidationUsd - snapshot.debtUsd);
  const ltv = snapshot.collateralUsd > 0 ? snapshot.debtUsd / snapshot.collateralUsd : 0;

  return (
    <div className="min-h-screen bg-rh-bg flex items-center justify-center p-4">
      <div className="panel panel-tight rounded-2xl max-w-2xl w-full">
        <div className="section-kicker">BorrowDesk Position</div>
        <h1 className="mt-1 text-2xl font-medium text-white">Shared Position</h1>
        <code className="mt-2 block text-xs text-rh-muted break-all">{address}</code>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              Collateral
            </div>
            <div className="mt-2 text-2xl font-medium text-white">
              {formatUsd(snapshot.collateralUsd)}
            </div>
          </div>

          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              Debt
            </div>
            <div className="mt-2 text-2xl font-medium text-white">
              {formatUsd(snapshot.debtUsd)}
            </div>
          </div>

          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              LTV
            </div>
            <div className="mt-2 text-2xl font-medium text-rh-lime">
              {(ltv * 100).toFixed(1)}%
            </div>
          </div>

          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              Health Factor
            </div>
            <div
              className={`mt-2 text-2xl font-medium ${
                snapshot.healthFactor < 1.2
                  ? "text-danger"
                  : snapshot.healthFactor < 1.5
                    ? "text-warn"
                    : "text-ok"
              }`}
            >
              {snapshot.healthFactor.toFixed(2)}
            </div>
          </div>

          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              Liquidation Threshold
            </div>
            <div className="mt-2 text-2xl font-medium text-white">
              {formatUsd(snapshot.liquidationUsd)}
            </div>
          </div>

          <div className="rounded-2xl border border-rh-border bg-black p-4">
            <div className="text-xs uppercase tracking-wider text-rh-dim">
              Buffer
            </div>
            <div className="mt-2 text-2xl font-medium text-white">
              {formatUsd(buffer)}
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl border border-rh-border bg-black p-4">
          <div
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
              snapshot.healthy
                ? "bg-ok/15 text-ok"
                : "bg-danger/15 text-danger"
            }`}
          >
            {snapshot.healthy ? "✓ Healthy" : "⚠ Unhealthy"}
          </div>
          <p className="mt-3 text-sm text-rh-muted">
            This position is {snapshot.healthy ? "above" : "below"} the liquidation
            threshold. {!snapshot.healthy && "It may be liquidated at any time."}
          </p>
        </div>

        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-flex items-center justify-center h-12 px-6 rounded-full bg-rh-lime text-rh-on-lime font-medium transition hover:bg-rh-lime/90"
          >
            Open BorrowDesk
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SharePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-rh-bg flex items-center justify-center">
          <div className="text-white">Loading...</div>
        </div>
      }
    >
      <ShareContent />
    </Suspense>
  );
}
