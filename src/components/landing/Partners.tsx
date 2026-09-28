const partners: {
  name: string;
  logo: string;
  wide?: boolean;
}[] = [
  {
    name: "Open House Singapore",
    logo: "/partners/openhouse.png",
    wide: true,
  },
  { name: "Arbitrum", logo: "/partners/arbitrum.png" },
  { name: "Robinhood Chain", logo: "/partners/robinhood.svg" },
  { name: "Paxos / USDG", logo: "/partners/paxos.png" },
  { name: "ZeroDev", logo: "/partners/zerodev.svg" },
  { name: "Quicknode", logo: "/partners/quicknode.png" },
  { name: "Dune", logo: "/partners/dune.png" },
  { name: "Trail of Bits", logo: "/partners/trailofbits.png" },
  { name: "GMX", logo: "/partners/gmx.svg" },
  { name: "Pendle", logo: "/partners/pendle.png" },
];

export function Partners() {
  return (
    <section className="bg-black">
      <div className="rh-container py-10">
        <p className="text-center text-[11px] font-medium uppercase tracking-[0.22em] text-rh-dim">
          Built for the Arbitrum Open House Singapore stack
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-5 gap-y-5 md:gap-x-6">
          {partners.map((p) =>
            p.wide ? (
              <div
                key={p.name}
                className="flex items-center"
                title={p.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo}
                  alt={p.name}
                  width={72}
                  height={36}
                  className="h-8 w-auto object-contain"
                  decoding="async"
                />
              </div>
            ) : (
              <div
                key={p.name}
                className="group flex items-center gap-2 text-white/70 transition hover:text-white"
                title={p.name}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.logo}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-6 shrink-0 rounded-[5px] object-contain"
                  decoding="async"
                />
                <span className="text-sm font-medium">{p.name}</span>
              </div>
            ),
          )}
        </div>
      </div>
    </section>
  );
}
