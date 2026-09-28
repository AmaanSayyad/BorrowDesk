const QA = [
  {
    q: "Who can borrow?",
    a: "Only a connected wallet that deposits listed Stock Tokens and stays within oracle LTV bands. Nothing borrows for you.",
  },
  {
    q: "Can anyone seize a healthy position?",
    a: "No. Liquidation requires debt above the liquidation threshold. Healthy accounts cannot be seized by liquidators or the market owner.",
  },
  {
    q: "What if the oracle goes quiet over the weekend?",
    a: "Equity feeds are 24/5. maxOracleDelay defaults to 4 days so a normal weekend does not brick the desk. Stale beyond that → actions that need a mark fail closed.",
  },
  {
    q: "How big is the pool?",
    a: "Buildathon-scale: owner-seeded at about $5 USDG idle. Max borrow is whatever cash remains after outstanding debt.",
  },
  {
    q: "Is this Morpho or knock-out leverage?",
    a: "Neither. BorrowDesk is its own multi-collateral credit market on Robinhood Chain mainnet. You keep the stocks and borrow the dollar.",
  },
  {
    q: "Is it audited?",
    a: "Not yet. Foundry tests cover over-borrow, accrual, and liquidation. Treat it as experimental buildathon software.",
  },
];

export function Questions() {
  return (
    <section id="questions" className="bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Questions worth asking
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2rem,4vw,3.5rem)] text-white">
            Straight answers
          </h2>
        </div>

        <dl className="mt-12 grid gap-8 md:grid-cols-2">
          {QA.map((item) => (
            <div key={item.q} className="border-t border-white/12 pt-5">
              <dt className="text-lg font-medium text-white">{item.q}</dt>
              <dd className="mt-2 text-sm leading-relaxed text-rh-muted">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
