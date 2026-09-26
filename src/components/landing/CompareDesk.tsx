"use client";

import Link from "next/link";

const rows = [
  {
    q: "What you hold",
    morpho: "Looped Stock Tokens - each turn needs a lender",
    desk: "Same Stock Tokens as collateral; equity upside stays yours",
  },
  {
    q: "How you get USDG",
    morpho: "Borrow → buy more stock → re-collateralise (loop)",
    desk: "One deposit, then borrow USDG from the desk pool",
  },
  {
    q: "Practical leverage",
    morpho: "~2.67× before safety margin (62.5% LLTV NVDA market)",
    desk: "Up to listed LTV (50-65%) - credit, not synthetic leverage",
  },
  {
    q: "When it ends",
    morpho: "Liquidation seizes collateral + ~12.7% liquidator bonus",
    desk: "Partial liquidation at 5% bonus; foresight ticket shows liq price first",
  },
  {
    q: "Liquidity today",
    morpho: "Stock-USDG Morpho supply ~96.6% utilised",
    desk: "Own seeded USDG pool - small, but idle cash is visible on the board",
  },
];

export function CompareDesk() {
  return (
    <section id="compare" className="border-y border-rh-border bg-black">
      <div className="rh-container py-24">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Side by side
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Morpho loop vs BorrowDesk credit
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Same desire - dollars against Stock Tokens. Different job: looping
            for leverage vs keeping the stocks and borrowing the dollar.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-rh-border text-[11px] uppercase tracking-[0.14em] text-rh-dim">
                <th className="py-3 pr-4 font-medium">Question</th>
                <th className="py-3 pr-4 font-medium">Morpho loop</th>
                <th className="py-3 font-medium text-rh-lime">BorrowDesk</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.q} className="border-b border-white/8">
                  <td className="py-4 pr-4 align-top font-medium text-white">
                    {r.q}
                  </td>
                  <td className="py-4 pr-4 align-top text-rh-muted">{r.morpho}</td>
                  <td className="py-4 align-top text-white">{r.desk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 max-w-6xl text-xs leading-relaxed text-rh-dim sm:text-sm">
          Morpho LLTV / utilisation figures reflect the largest NVDA/USDG market
          published in public RH Chain research at block 78,677,903. Liquidator
          incentive is Morpho&apos;s documented LIF at a 62.5% threshold.
          BorrowDesk is a credit line, not a knock-out leverage product.
        </p>

        <Link
          href="/app"
          className="neon-btn mt-8 inline-flex h-11 items-center px-6 text-sm"
        >
          Launch credit line
        </Link>
      </div>
    </section>
  );
}
