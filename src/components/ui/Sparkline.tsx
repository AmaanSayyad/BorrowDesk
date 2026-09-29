"use client";

import {
  useId,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { motion } from "framer-motion";

type Point = { t: number; v: number };

function smoothLine(coords: readonly (readonly [number, number])[]) {
  if (coords.length < 2) return "";
  if (coords.length === 2) {
    return `M${coords[0][0]},${coords[0][1]} L${coords[1][0]},${coords[1][1]}`;
  }
  let d = `M${coords[0][0].toFixed(1)},${coords[0][1].toFixed(1)}`;
  for (let i = 0; i < coords.length - 1; i++) {
    const p0 = coords[i - 1] ?? coords[i];
    const p1 = coords[i];
    const p2 = coords[i + 1];
    const p3 = coords[i + 2] ?? p2;
    const cp1x = p1[0] + (p2[0] - p0[0]) / 6;
    const cp1y = p1[1] + (p2[1] - p0[1]) / 6;
    const cp2x = p2[0] - (p3[0] - p1[0]) / 6;
    const cp2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2[0].toFixed(1)},${p2[1].toFixed(1)}`;
  }
  return d;
}

function formatTime(t: number) {
  try {
    return new Date(t).toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
}

function robustBounds(values: number[]) {
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length === 0) return { lo: 0, hi: 1 };
  const sorted = [...finite].sort((a, b) => a - b);
  const n = sorted.length;
  const loIdx = Math.max(0, Math.floor(n * 0.08));
  const hiIdx = Math.min(n - 1, Math.ceil(n * 0.92) - 1);
  let lo = sorted[loIdx] ?? 0;
  let hi = sorted[hiIdx] ?? 1;
  if (lo === hi) {
    lo -= Math.max(Math.abs(lo) * 0.05, 0.05);
    hi += Math.max(Math.abs(hi) * 0.05, 0.05);
  }
  const pad = (hi - lo) * 0.12;
  return { lo: lo - pad, hi: hi + pad };
}

export function Sparkline({
  points,
  color = "var(--rh-lime)",
  height = 148,
  formatY,
  label,
}: {
  points: Point[];
  color?: string;
  height?: number;
  formatY?: (v: number) => string;
  label?: string;
}) {
  const gid = useId().replace(/:/g, "");
  const wrapRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState<{
    i: number;
    x: number;
    y: number;
  } | null>(null);

  const chart = useMemo(() => {
    if (points.length < 2) {
      return null;
    }
    const values = points.map((p) => (Number.isFinite(p.v) ? p.v : 0));
    const { lo, hi } = robustBounds(values);
    const span = hi - lo || 1;
    const w = 360;
    const h = height;
    const top = 10;
    const bottom = h - 10;
    const coords = points.map((p, i) => {
      const x = (i / (points.length - 1)) * w;
      const raw = Number.isFinite(p.v) ? p.v : lo;
      const y = bottom - ((raw - lo) / span) * (bottom - top);
      return [x, Math.min(bottom, Math.max(top, y))] as const;
    });
    const line = smoothLine(coords);
    const last = coords[coords.length - 1]!;
    const area = `${line} L${last[0].toFixed(1)},${h} L0,${h} Z`;
    const gridYs = [0.25, 0.5, 0.75].map((f) => top + (bottom - top) * f);
    const delta = values[values.length - 1]! - values[0]!;
    return {
      w,
      h,
      lo,
      hi,
      coords,
      line,
      area,
      gridYs,
      latest: values[values.length - 1]!,
      delta,
      startT: points[0]!.t,
      endT: points[points.length - 1]!.t,
    };
  }, [points, height]);

  const onMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!chart || !wrapRef.current) return;
    const rect = wrapRef.current.getBoundingClientRect();
    const rel = (e.clientX - rect.left) / rect.width;
    const i = Math.round(
      Math.min(1, Math.max(0, rel)) * (chart.coords.length - 1),
    );
    const [x, y] = chart.coords[i]!;
    setHover({ i, x, y });
  };

  if (!chart) {
    return (
      <div
        className="grid place-items-center rounded-xl bg-black/60 text-sm text-rh-dim"
        style={{ height }}
      >
        Collecting samples…
      </div>
    );
  }

  const active = hover ? points[hover.i]! : points[points.length - 1]!;
  const activeY = formatY ? formatY(active.v) : active.v.toFixed(2);
  const deltaLabel =
    chart.delta === 0
      ? "Flat"
      : `${chart.delta > 0 ? "+" : ""}${
          formatY
            ? formatY(chart.delta).replace(/^\$/, "")
            : chart.delta.toFixed(2)
        }`;
  const deltaTone =
    chart.delta > 0
      ? "text-ok"
      : chart.delta < 0
        ? "text-danger"
        : "text-rh-dim";
  const end = chart.coords[chart.coords.length - 1]!;

  return (
    <div className="min-w-0 overflow-hidden">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {label ? (
            <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
              {label}
            </div>
          ) : null}
          <div className="mt-1 flex items-baseline gap-2">
            <motion.span
              key={activeY}
              initial={{ opacity: 0.35, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
              className="text-2xl font-medium tabular text-white"
            >
              {activeY}
            </motion.span>
            <span className={`text-xs font-medium tabular ${deltaTone}`}>
              {deltaLabel}
            </span>
          </div>
        </div>
        <div className="shrink-0 text-right text-[10px] uppercase tracking-[0.12em] text-rh-dim">
          <div>{points.length} samples</div>
          <div className="mt-0.5 normal-case tracking-normal">
            {hover ? formatTime(active.t) : "Live"}
          </div>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative min-w-0 cursor-crosshair overflow-hidden rounded-lg"
        onPointerMove={onMove}
        onPointerLeave={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${chart.w} ${chart.h}`}
          width="100%"
          height={height}
          className="block max-w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label={label ?? "Sparkline"}
        >
          <defs>
            <linearGradient id={`fill-${gid}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.28" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </linearGradient>
            <clipPath id={`clip-${gid}`}>
              <rect x="0" y="0" width={chart.w} height={chart.h} />
            </clipPath>
          </defs>

          <g clipPath={`url(#clip-${gid})`}>
            {chart.gridYs.map((y) => (
              <line
                key={y}
                x1={0}
                x2={chart.w}
                y1={y}
                y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth={1}
              />
            ))}

            <path d={chart.area} fill={`url(#fill-${gid})`} />
            <path
              d={chart.line}
              fill="none"
              stroke={color}
              strokeWidth={2.2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {hover ? (
              <>
                <line
                  x1={hover.x}
                  x2={hover.x}
                  y1={0}
                  y2={chart.h}
                  stroke="rgba(255,255,255,0.2)"
                  strokeWidth={1}
                  strokeDasharray="3 4"
                />
                <circle
                  cx={hover.x}
                  cy={hover.y}
                  r={4}
                  fill="#0a0a0a"
                  stroke={color}
                  strokeWidth={2}
                />
              </>
            ) : (
              <>
                <circle cx={end[0]} cy={end[1]} r={7} fill={color} opacity={0.18}>
                  <animate
                    attributeName="r"
                    values="6;9;6"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                  <animate
                    attributeName="opacity"
                    values="0.22;0.06;0.22"
                    dur="2.2s"
                    repeatCount="indefinite"
                  />
                </circle>
                <circle
                  cx={end[0]}
                  cy={end[1]}
                  r={3.2}
                  fill="#0a0a0a"
                  stroke={color}
                  strokeWidth={2}
                />
              </>
            )}
          </g>
        </svg>

        {hover ? (
          <div
            className="pointer-events-none absolute top-2 z-10 max-w-[9rem] rounded-lg border border-white/10 bg-black/90 px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: `${Math.min(86, Math.max(2, (hover.x / chart.w) * 100))}%`,
              transform:
                hover.x > chart.w * 0.65
                  ? "translateX(-100%)"
                  : "translateX(0)",
            }}
          >
            <div className="font-medium tabular text-white">{activeY}</div>
            <div className="text-[10px] text-rh-dim">{formatTime(active.t)}</div>
          </div>
        ) : null}
      </div>

      <div className="mt-2 flex justify-between gap-2 text-[10px] tabular text-rh-dim">
        <span>{formatTime(chart.startT)}</span>
        <span className="truncate text-center">
          {formatY ? formatY(chart.lo) : chart.lo.toFixed(2)} -{" "}
          {formatY ? formatY(chart.hi) : chart.hi.toFixed(2)}
        </span>
        <span>{formatTime(chart.endT)}</span>
      </div>
    </div>
  );
}
