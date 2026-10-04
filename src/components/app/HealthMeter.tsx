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
  const hfPct = finite ? clamp((healthFactor / 3) * 100, 8, 100) : 100;
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

  const hint =
    debtUsd <= 0
      ? "No open borrow"
      : healthFactor >= 1.5
        ? "Comfortable buffer"
        : healthFactor >= 1.1
          ? "Buffer thinning"
          : "Near liquidation";

  // viewBox 144 → radius 56 → thicker, larger ring
  const size = 144;
  const center = size / 2;
  const radius = 56;
  const stroke = 11;
  const circumference = 2 * Math.PI * radius;
  const progress = useSpring(hfPct / 100, { stiffness: 90, damping: 18 });
  const dashOffset = useTransform(progress, (p) => circumference * (1 - p));

  useEffect(() => {
    progress.set(hfPct / 100);
  }, [hfPct, progress]);

  return (
    <div data-tour="health" className="panel panel-tight rounded-2xl">
      <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div className="min-w-0">
          <div className="section-kicker">Position</div>
          <div className="mt-2 flex flex-wrap items-end gap-3">
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
              className="mb-1.5 chip text-xs"
              style={{
                background: `color-mix(in srgb, ${tone} 18%, black)`,
                color: tone,
              }}
            >
              {status}
            </motion.div>
          </div>
          <p className="mt-1.5 text-sm text-rh-muted">Collateral value</p>

          <div className="mt-5 grid grid-cols-3 gap-2">
            <Stat label="Debt" value={formatUsd(debtUsd)} accent />
            <Stat label="Borrow room" value={formatUsd(room)} />
            <Stat label="LTV" value={`${(ltv * 100).toFixed(0)}%`} />
          </div>
        </div>

        <div className="flex flex-col items-center justify-center md:items-end">
          <div
            className="relative grid h-[11.5rem] w-[11.5rem] place-items-center sm:h-[12.75rem] sm:w-[12.75rem]"
            style={{
              filter: `drop-shadow(0 0 22px color-mix(in srgb, ${tone} 40%, transparent))`,
            }}
          >
            <svg
              viewBox={`0 0 ${size} ${size}`}
              className="absolute inset-0 h-full w-full -rotate-90"
              aria-hidden
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke="#1c1c1c"
                strokeWidth={stroke}
              />
              <circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={`color-mix(in srgb, ${tone} 16%, transparent)`}
                strokeWidth={stroke + 6}
              />
              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                fill="none"
                stroke={tone}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={circumference}
                style={{ strokeDashoffset: dashOffset }}
              />
            </svg>
            <div className="relative z-[1] px-3 text-center">
              <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-rh-dim">
                Health factor
              </div>
              <motion.div
                key={hfDisplay}
                initial={{ opacity: 0.35, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-1 text-[2.4rem] font-medium leading-none tabular tracking-tight text-white sm:text-[2.75rem]"
                style={{ color: tone === "var(--ok)" ? "#fff" : tone }}
              >
                {hfDisplay}
              </motion.div>
              <div
                className="mt-2.5 text-xs font-medium"
                style={{ color: tone }}
              >
                {hint}
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
    <div className="rounded-xl bg-black px-3 py-2.5">
      <div className="text-[10px] font-medium uppercase tracking-[0.12em] text-rh-dim">
        {label}
      </div>
      <motion.div
        key={value}
        initial={{ opacity: 0.4, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className={`mt-1 text-[0.95rem] font-medium tabular ${
          accent ? "text-rh-lime" : "text-white"
        }`}
      >
        {value}
      </motion.div>
    </div>
  );
}
