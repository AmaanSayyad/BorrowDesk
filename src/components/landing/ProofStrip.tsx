import { MAINNET } from "@/lib/deployments";
import { PROOF_EVENTS } from "@/lib/demand";

/** Crest-style “It already happened” - explorer-linked receipts. */
export function ProofStrip() {
  return (
    <section id="proof" className="border-y border-rh-border bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
            It already happened
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2.2rem,5vw,3.75rem)] text-white">
            Onchain receipts, not slides.
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            These are Robinhood Chain mainnet transactions. The live pool can
            move; the receipts do not.
          </p>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-3 md:gap-10">
          {PROOF_EVENTS.map((ev) => {
            const href = ev.tx
              ? `${MAINNET.explorer}/tx/${ev.tx}`
              : `${MAINNET.explorer}/address/${ev.account ?? MAINNET.market}`;
            return (
              <article
                key={ev.title}
                className="flex flex-col border-t border-white/15 pt-5"
              >
                <h3 className="text-xl font-medium text-white">{ev.title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-rh-muted">
                  {ev.body}
                </p>
                <div className="mt-5">
                  <div className="text-[10px] font-medium uppercase tracking-[0.14em] text-rh-dim">
                    {ev.metricLabel}
                  </div>
                  <div className="mt-1 text-2xl font-medium tabular text-rh-lime">
                    {ev.metric}
                  </div>
                </div>
                <a
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 text-sm font-medium text-rh-cyan hover:underline"
                >
                  {ev.tx ? "View transaction →" : "View account →"}
                </a>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
