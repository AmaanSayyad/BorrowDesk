import Link from "next/link";
import { FEATURED_TOKENS } from "@/lib/tokens";
import { TokenLogo } from "@/components/ui/TokenLogo";

/** Equity-tuned LTV bands as product law (Pledge-style ladder). */
export function LtvLadder() {
  const rows = FEATURED_TOKENS.map((t) => ({
    symbol: t.symbol,
    logo: t.logo,
    ltv: t.ltvBps / 100,
    liq: t.liquidationBps / 100,
    reason: t.riskReason,
  }));

  return (
    <section id="ltv" className="border-y border-rh-border bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Risk bands
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Equity-tuned LTV ladder
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Broader indexes borrow more. High-vol single names sit tighter.
            Liquidation always sits above max LTV so you see buffer before seize.
          </p>
        </div>

        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-rh-border text-[11px] uppercase tracking-[0.14em] text-rh-dim">
                <th className="py-3 font-medium">Asset</th>
                <th className="py-3 font-medium">Max LTV</th>
                <th className="py-3 font-medium">Liq band</th>
                <th className="py-3 font-medium">Why</th>
                <th className="py-3 font-medium" />
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.symbol} className="border-b border-white/8">
                  <td className="py-3.5">
                    <span className="inline-flex items-center gap-2 font-medium text-white">
                      <TokenLogo src={r.logo} symbol={r.symbol} size={22} />
                      {r.symbol}
                    </span>
                  </td>
                  <td className="py-3.5 tabular text-rh-lime">{r.ltv}%</td>
                  <td className="py-3.5 tabular text-white">{r.liq}%</td>
                  <td className="py-3.5 text-rh-muted">{r.reason}</td>
                  <td className="py-3.5 text-right">
                    <Link
                      href={`/app?asset=${r.symbol}&desk=borrow`}
                      className="text-xs font-medium text-rh-cyan hover:underline"
                    >
                      Borrow →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <ul className="mt-10 grid gap-4 sm:grid-cols-3">
          {[
            "Healthy accounts cannot be seized",
            "Stock pump does not raise your APR",
            "Partial liquidation - not full-debt-only",
          ].map((law) => (
            <li
              key={law}
              className="border-t border-rh-lime/30 pt-4 text-sm font-medium text-rh-lime"
            >
              {law}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
