"use client";

import { motion } from "framer-motion";
import { Sparkline } from "@/components/ui/Sparkline";
import { usePositionHistory } from "@/hooks/usePositionHistory";
import { formatUsd } from "@/lib/utils";

export function PositionCharts() {
  const { points, ready } = usePositionHistory();

  const healthPts = points.map((p) => ({ t: p.t, v: p.healthFactor }));
  const debtPts = points.map((p) => ({ t: p.t, v: p.debtUsd }));

  return (
    <div className="panel panel-tight rounded-2xl">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.16em] text-rh-dim">
            Analytics
          </div>
          <h2 className="mt-1 text-xl font-medium text-white">
            Health & debt over time
          </h2>
          <p className="mt-1 text-sm text-rh-muted">
            Live samples of your position while this desk is open. Hover a chart
            for exact values.
          </p>
        </div>
        <span
          className={`chip inline-flex items-center gap-1.5 ${
            ready ? "bg-rh-lime/15 text-rh-lime" : "bg-white/10 text-rh-muted"
          }`}
        >
          {ready ? (
            <>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rh-lime opacity-60" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-rh-lime" />
              </span>
              Sampling
            </>
          ) : (
            "Connect wallet"
          )}
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="min-w-0 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-black p-4 md:p-5"
        >
          <Sparkline
            label="Health factor"
            points={healthPts}
            color="var(--ok)"
            height={160}
            formatY={(v) => (v >= 4.99 ? "∞" : v.toFixed(2))}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.06 }}
          className="min-w-0 overflow-hidden rounded-xl border border-white/[0.06] bg-gradient-to-b from-white/[0.03] to-black p-4 md:p-5"
        >
          <Sparkline
            label="Debt (USD)"
            points={debtPts}
            color="var(--rh-lime)"
            height={160}
            formatY={(v) => formatUsd(v)}
          />
        </motion.div>
      </div>
    </div>
  );
}
