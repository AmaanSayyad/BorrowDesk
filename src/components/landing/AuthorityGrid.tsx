const COLUMNS = [
  {
    title: "Borrower can",
    tone: "ok" as const,
    lead: "The only key that creates debt.",
    items: [
      "Deposit / withdraw Stock Tokens",
      "Borrow and repay USDG",
      "See liq price before signing",
      "Accrue interest onchain",
    ],
  },
  {
    title: "Market can",
    tone: "warn" as const,
    lead: "Protocol rules, not a general key.",
    items: [
      "Price collateral via AggregatorV3",
      "Enforce LTV / liquidation bands",
      "Accrue ~5% APR on debt",
      "Owner: list markets · seed liquidity",
    ],
  },
  {
    title: "Neither can",
    tone: "danger" as const,
    lead: "Healthy books stay untouched.",
    items: [
      "Seize healthy collateral",
      "Borrow without a wallet signature",
      "Bypass stale-oracle guards",
      "Change your debt without your key",
    ],
  },
];

export function AuthorityGrid() {
  return (
    <section id="authority" className="bg-black">
      <div className="rh-container py-24">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            Authority
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Only you create the debt.
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Liquidators repay underwater debt and seize at a fixed bonus. The
            market owner cannot empty a healthy account.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="border-t border-white/15 pt-6">
              <div
                className={`text-[11px] font-medium uppercase tracking-[0.16em] ${
                  col.tone === "ok"
                    ? "text-ok"
                    : col.tone === "warn"
                      ? "text-warn"
                      : "text-danger"
                }`}
              >
                {col.title}
              </div>
              <p className="mt-3 text-sm text-rh-muted">{col.lead}</p>
              <ul className="mt-5 space-y-2.5">
                {col.items.map((item) => (
                  <li
                    key={item}
                    className="text-sm leading-relaxed text-white/90"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
