"use client";

import { motion } from "framer-motion";

const steps = [
  {
    n: "01",
    title: "Deposit Stock Tokens",
    body: "Supply NVDA, AAPL, SPY, and other listed Stock Tokens as collateral. Assets stay in the BorrowDesk market under your account.",
  },
  {
    n: "02",
    title: "Borrow USDG",
    body: "Draw Global Dollar against oracle-priced collateral at conservative LTVs - without selling equity exposure.",
  },
  {
    n: "03",
    title: "Repay & withdraw",
    body: "Repay any time and reclaim collateral when healthy. Liquidations protect the pool if markets breach the threshold.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="bg-black">
      <div className="rh-container py-24">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            How it works
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Equity stays. Liquidity moves.
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Stock Tokens in, USDG out - credit for tokenized equities on Robinhood
            Chain.
          </p>
        </div>

        <div className="mt-14 grid gap-10 md:grid-cols-3">
          {steps.map((step, i) => (
            <motion.div
              key={step.n}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: i * 0.08, duration: 0.45 }}
              className="border-t border-white/15 pt-6"
            >
              <div className="inline-block rounded-full bg-rh-lime px-2.5 py-1 text-xs font-medium text-rh-on-lime">
                {step.n}
              </div>
              <h3 className="mt-5 text-2xl font-medium text-white">{step.title}</h3>
              <p className="mt-3 leading-relaxed text-rh-muted">{step.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
