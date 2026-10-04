"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatHealthFactor } from "@/lib/utils";

/** Interactive keep-stocks stress: what happens to HF when collateral marks drop. */
export function DropSimulator() {
  const [collateralUsd, setCollateralUsd] = useState(1000);
  const [ltvPct, setLtvPct] = useState(40);
  const [dropPct, setDropPct] = useState(10);
  const liqPct = 75;

  const debt = (collateralUsd * ltvPct) / 100;

  const sim = useMemo(() => {
    const mark = collateralUsd * (1 - dropPct / 100);
    const ltv = mark > 0 ? debt / mark : Infinity;
    const liqUsd = (mark * liqPct) / 100;
    const hf = debt > 0 ? liqUsd / debt : Infinity;
    const liquidatable = debt > liqUsd;
    const dropToLiq =
      collateralUsd > 0 && debt > 0
        ? Math.max(0, (1 - debt / ((collateralUsd * liqPct) / 100)) * 100)
        : 100;
    return { mark, ltv, hf, liquidatable, dropToLiq, liqUsd };
  }, [collateralUsd, debt, dropPct]);

  return (
    <section id="simulate" className="bg-black">
      <div className="rh-container py-24">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Try the math
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Move the mark. Watch the floor.
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Pick collateral and LTV, then drop the oracle mark. Liquidation sits
            at {liqPct}% - above max borrow LTV - so you see buffer before the
            desk can seize.
          </p>
        </div>

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_1.05fr] lg:items-start">
          <div className="space-y-6 rounded-2xl border border-rh-border bg-rh-raised p-5 md:p-6">
            <Slider
              label="Collateral (USD)"
              value={collateralUsd}
              min={100}
              max={10_000}
              step={50}
              display={`$${collateralUsd.toLocaleString()}`}
              onChange={setCollateralUsd}
            />
            <Slider
              label="Borrow LTV"
              value={ltvPct}
              min={10}
              max={60}
              step={1}
              display={`${ltvPct}%`}
              onChange={setLtvPct}
            />
            <Slider
              label="Oracle drop"
              value={dropPct}
              min={0}
              max={50}
              step={1}
              display={`−${dropPct}%`}
              onChange={setDropPct}
            />
            <p className="text-xs text-rh-dim">
              Illustrative NVDA-band numbers (60% LTV / 75% liq). Live desk uses
              per-asset bands. No wallet needed.
            </p>
          </div>

          <div className="rounded-2xl border border-rh-border bg-rh-raised p-5 md:p-6">
            <div className="grid grid-cols-2 gap-4">
              <Metric label="Debt" value={`$${debt.toFixed(0)}`} />
              <Metric
                label="Mark after drop"
                value={`$${sim.mark.toFixed(0)}`}
              />
              <Metric
                label="LTV after"
                value={
                  Number.isFinite(sim.ltv)
                    ? `${(sim.ltv * 100).toFixed(1)}%`
                    : "-"
                }
              />
              <Metric
                label="Health factor"
                value={formatHealthFactor(sim.hf, { compact: true })}
                tone={
                  sim.liquidatable
                    ? "danger"
                    : sim.hf < 1.15
                      ? "warn"
                      : "ok"
                }
              />
            </div>

            <div
              className={`mt-6 rounded-xl border px-4 py-3 text-sm ${
                sim.liquidatable
                  ? "border-danger/40 bg-danger/10 text-danger"
                  : "border-ok/30 bg-ok/5 text-ok"
              }`}
            >
              {sim.liquidatable
                ? `Liquidatable. Debt exceeds the ${liqPct}% threshold after a −${dropPct}% mark.`
                : `Still healthy. You had ~${sim.dropToLiq.toFixed(1)}% of buffer to liquidation at open; −${dropPct}% used part of it.`}
            </div>

            <div className="mt-6">
              <div className="mb-2 flex justify-between text-[11px] text-rh-dim">
                <span>Entry mark</span>
                <span>−{dropPct}%</span>
                <span>Liq band</span>
              </div>
              <div className="relative h-3 overflow-hidden rounded-full bg-white/10">
                <div
                  className="absolute inset-y-0 left-0 bg-rh-lime/80"
                  style={{
                    width: `${Math.max(0, 100 - dropPct)}%`,
                  }}
                />
                <div
                  className="absolute inset-y-0 w-0.5 bg-danger"
                  style={{
                    left: `${Math.min(100, sim.dropToLiq)}%`,
                  }}
                  title="Liquidation"
                />
              </div>
              <p className="mt-2 text-xs text-rh-muted">
                Red mark ≈ drop to liquidatable ({sim.dropToLiq.toFixed(1)}% from
                entry). Stocks stay yours until then.
              </p>
            </div>

            <Link
              href="/app"
              className="neon-btn mt-8 inline-flex h-11 items-center px-6 text-sm"
            >
              Open live ticket
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  display,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (n: number) => void;
}) {
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-rh-muted">{label}</span>
        <span className="tabular text-rh-lime">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-3 w-full accent-[#ccff00]"
      />
    </div>
  );
}

function Metric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "ok" | "warn" | "danger";
}) {
  const color =
    tone === "danger"
      ? "text-danger"
      : tone === "warn"
        ? "text-warn"
        : tone === "ok"
          ? "text-ok"
          : "text-white";
  return (
    <div>
      <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
        {label}
      </div>
      <div className={`mt-1 text-xl font-medium tabular ${color}`}>{value}</div>
    </div>
  );
}
