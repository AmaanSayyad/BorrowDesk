import Link from "next/link";

export function FinalCta() {
  return (
    <section className="bg-black">
      <div className="rh-container border-t border-rh-border py-20 text-center md:py-24">
        <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-rh-lime">
          Open a line
        </div>
        <h2 className="rh-display mx-auto mt-3 max-w-4xl text-[clamp(2.2rem,5vw,3.75rem)] text-white">
          Keep the upside. Borrow the dollar.
        </h2>
        <p className="mx-auto mt-4 max-w-3xl text-lg leading-relaxed text-rh-muted">
          Deposit listed Stock Tokens, borrow USDG from the live pool, and
          monitor health in real time.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link href="/app" className="neon-btn h-12 px-8 text-base">
            Enter BorrowDesk
          </Link>
          <Link href="/verify" className="ghost-btn h-12 px-7 text-base">
            Verify claims
          </Link>
        </div>
      </div>
    </section>
  );
}
