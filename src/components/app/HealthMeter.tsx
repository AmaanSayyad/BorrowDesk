"use client";

import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";
import { clamp, formatUsd } from "@/lib/utils";

export function HealthMeter({
  healthFactor,
  ltv,
  collateralUsd,
  debtUsd,
  borrowPowerUsd,
}: {
  healthFactor: number;
  ltv: number;
  collateralUsd: number;
  debtUsd: number;
  borrowPowerUsd: number;
}) {
  const finite = Number.isFinite(healthFactor);
  const hfDisplay = finite ? healthFactor.toFixed(2) : "∞";
  const hfPct = finite ? clamp((healthFactor / 3) * 100, 6, 100) : 100;
  const room = Math.max(0, borrowPowerUsd - debtUsd);

  const tone =
    !finite || healthFactor >= 1.5
      ? "var(--ok)"
      : healthFactor >= 1.1
        ? "var(--warn)"
        : "var(--danger)";

  const status =
    debtUsd <= 0
      ? "No debt"
      : healthFactor >= 1.5
        ? "Healthy"
        : healthFactor >= 1.1
          ? "Watch"
          : "At risk";

  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const progress = useSpring(hfPct / 100, { stiffness: 90, damping: 18 });
  const dashOffset = useTransform(progress, (p) => circumference * (1 - p));

  useEffect(() => {
    progress.set(hfPct / 100);
  }, [hfPct, progress]);

  return (
    <div data-tour="health" className="panel panel-tight rounded-2xl">
      <div className="grid gap-5 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <div className="section-kicker">Position</div>
          <div className="mt-1.5 flex flex-wrap items-end gap-2.5">
            <motion.div
              key={formatUsd(collateralUsd)}
              initial={{ opacity: 0.4, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="rh-display text-4xl tracking-tight tabular text-white md:text-5xl"
            >
              {formatUsd(collateralUsd)}
            </motion.div>
            <motion.div
              key={status}
              initial={{ scale: 0.92, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-1 chip"
              style={{
                background: `color-mix(in srgb, ${tone} 18%, black)`,
                color: tone,
              }}
            >
              {status}
            </motion.div>
          </div>
          <p className="mt-1 text-xs text-rh-muted">
            Collateral · health factor {hfDisplay}
          </p>

          <div className="mt-4 grid grid-cols-3 gap-1.5">
            <Stat label="Debt" value={formatUsd(debtUsd)} accent />
            <Stat label="Borrow room" value={formatUsd(room)} />
            <Stat label="LTV" value={`${(ltv * 100).toFixed(0)}%`} />
          </div>
        </div>

        <div className="flex justify-center md:justify-end">
          <div className="relative grid h-[7.5rem] w-[7.5rem] place-items-center">
            <svg
              viewBox="0 0 112 112"
              className="absolute inset-0 h-full w-full -rotate-90"
              aria-hidden
            >
              <circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke="#222"
                strokeWidth="9"
              />
              <motion.circle
                cx="56"
                cy="56"
                r={radius}
                fill="none"
                stroke={tone}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
              />
            </svg>
            <div className="relative z-[1] text-center">
              <motion.div
                key={hfDisplay}
                initial={{ opacity: 0.35, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-2xl font-medium tabular text-white"
              >
                {hfDisplay}
              </motion.div>
              <div className="text-[10px] font-medium uppercase tracking-wide text-rh-dim">
                Health
              </div>
            </div>
          </div>
        </div>
      </div>
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
    <div className="rounded-lg bg-black px-2.5 py-2">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.4, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mt-0.5 text-sm font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </motion.div>
    </div>
  );
}
