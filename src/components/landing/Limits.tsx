import Link from "next/link";
import { BUILDATHON_LIMITS } from "@/lib/demand";

export function Limits() {
  return (
    <section id="limits" className="bg-black">
      <div className="rh-container py-20">
        <div className="max-w-6xl">
          <div className="text-[11px] font-medium uppercase tracking-[0.2em] text-warn">
            Limits we accept
          </div>
          <h2 className="rh-display mt-3 text-[clamp(2rem,4vw,3.5rem)] text-white">
            Stated plainly
          </h2>
          <p className="mt-4 max-w-6xl text-lg leading-relaxed text-rh-muted sm:text-xl">
            Buildathon scope, not hidden footnotes. Judges should know what the
            contracts and pool actually do today.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2">
          {BUILDATHON_LIMITS.map((item) => (
            <div key={item.title} className="border-t border-white/12 pt-5">
              <h3 className="text-lg font-medium text-white">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-rh-muted">
                {item.body}
              </p>
            </div>
          ))}
        </div>

        <p className="mt-10 text-sm text-rh-muted">
          Re-check addresses and pool state yourself:{" "}
          <Link href="/verify" className="text-rh-cyan hover:underline">
            Verify every claim
          </Link>
        </p>
      </div>
    </section>
  );
}
