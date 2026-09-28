const points = [
  {
    title: "Oracle staleness guards",
    body: "Price reads reject stale rounds before minting borrow capacity - aligned with Chainlink feed patterns on Robinhood Chain.",
  },
  {
    title: "Conservative LTV bands",
    body: "Borrow power sits below liquidation thresholds with room for equity volatility and corporate-action drift.",
  },
  {
    title: "Safe transfer flows",
    body: "Deposit, borrow, repay, and liquidate paths use checks-effects-interactions with an explicit nonReentrant lock.",
  },
  {
    title: "Foundry-tested core",
    body: "Unit tests cover over-borrow, interest accrual, and liquidation - ready for review-grade scrutiny.",
  },
];

export function Security() {
  return (
    <section id="security" className="bg-black">
      <div className="rh-container grid gap-12 py-24 lg:grid-cols-[0.9fr_1.1fr]">
        <div>
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Security
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.5rem)] text-white">
            Built like credit infrastructure
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-rh-muted sm:max-w-none sm:text-xl lg:max-w-xl">
            Oracle delay, LTV bands, and CEI + nonReentrant are enforced onchain.
            The pool is buildathon-scale - see Limits below. Not audited.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {points.map((p) => (
            <div key={p.title} className="border-t border-white/12 pt-5">
              <h3 className="text-lg font-medium text-white">{p.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-rh-muted">{p.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
