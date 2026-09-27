"use client";

import { motion } from "framer-motion";

export function HeroVisual() {
  return (
    <div className="relative mx-auto aspect-square w-full max-w-[520px]">
      <div className="absolute inset-0 rounded-[2rem] border border-white/10 bg-white/5 shadow-[0_40px_120px_rgba(0,0,0,0.35)] backdrop-blur-sm" />

      <svg
        viewBox="0 0 520 520"
        className="absolute inset-0 h-full w-full"
        aria-hidden
      >
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#12AAFF" />
            <stop offset="100%" stopColor="#CCFF00" />
          </linearGradient>
        </defs>

        <motion.path
          d="M80 280 C160 180, 240 180, 260 260 C280 340, 360 340, 440 220"
          fill="none"
          stroke="url(#lineGrad)"
          strokeWidth="3"
          strokeLinecap="round"
          initial={{ pathLength: 0, opacity: 0.2 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: "easeInOut" }}
          className="pulse-line"
        />

        {[
          { x: 110, y: 250, label: "NVDA", delay: 0.2 },
          { x: 250, y: 250, label: "AAPL", delay: 0.35 },
          { x: 390, y: 210, label: "USDG", delay: 0.5 },
        ].map((node) => (
          <g key={node.label}>
            <motion.circle
              cx={node.x}
              cy={node.y}
              r="34"
              fill={node.label === "USDG" ? "#00A86B" : "#0B1F3A"}
              stroke={node.label === "USDG" ? "#7dffc2" : "#12AAFF"}
              strokeWidth="2"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: node.delay, duration: 0.5 }}
            />
            <text
              x={node.x}
              y={node.y + 5}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontFamily="Syne, sans-serif"
              fontWeight="700"
            >
              {node.label}
            </text>
          </g>
        ))}
      </svg>

      <div className="float-y absolute bottom-8 left-8 right-8 rounded-xl border border-white/15 bg-[#071525]/80 p-4 backdrop-blur">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-[11px] uppercase tracking-[0.18em] text-neon">
              Live credit line
            </div>
            <div className="mt-1 font-display text-2xl font-bold">
              Borrow against equity exposure
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs text-white/55">Typical LTV</div>
            <div className="font-display text-3xl font-bold text-teal">60%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
