import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS } from "@/lib/tokens";

export function TrustStrip() {
  const short = `${MAINNET.market.slice(0, 6)}…${MAINNET.market.slice(-4)}`;

  return (
    <section className="bg-black">
      <div className="rh-container grid gap-6 py-10 md:grid-cols-4">
        <Fact
          label="Market"
          value={short}
          href={`${MAINNET.explorer}/address/${MAINNET.market}`}
        />
        <Fact label="Oracles" value="Chainlink-style" />
        <Fact
          label="Max LTV"
          value={`${Math.max(...LISTED_TOKENS.map((t) => t.ltvBps)) / 100}%`}
        />
        <Fact label="Borrow APR" value="5.00%" />
      </div>
    </section>
  );
}

function Fact({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const body = (
    <>
      <div className="text-[10px] font-medium uppercase tracking-[0.16em] text-rh-dim">
        {label}
      </div>
      <div className="mt-1 text-lg font-medium tabular text-rh-lime">{value}</div>
    </>
  );

  if (href) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className="block hover:opacity-90">
        {body}
      </a>
    );
  }
  return <div>{body}</div>;
}
