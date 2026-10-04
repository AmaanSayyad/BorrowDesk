import Image from "next/image";
import Link from "next/link";
import { MAINNET } from "@/lib/deployments";

type FooterLink = {
  href: string;
  label: string;
  external?: boolean;
  logo?: string;
};

const PRODUCT: FooterLink[] = [
  { href: "/app", label: "Borrow" },
  {
    href: "/app?asset=NVDA",
    label: "Deposit NVDA",
    logo: "/tokens/nvda.png",
  },
  {
    href: "/app?asset=AAPL",
    label: "Deposit AAPL",
    logo: "/tokens/aapl.png",
  },
  { href: "/#proof", label: "Proof" },
  { href: "/#authority", label: "Authority" },
  { href: "/#simulate", label: "Simulate" },
  { href: "/verify", label: "Verify claims" },
  { href: "/#questions", label: "FAQ" },
  { href: "/#limits", label: "Limits" },
];

const PLATFORM: FooterLink[] = [
  { href: "/app", label: "Credit desk" },
  {
    href: MAINNET.pitchDeck,
    label: "Pitch deck",
    external: true,
  },
  {
    href: MAINNET.demoVideo,
    label: "Demo + pitch video",
    external: true,
  },
  {
    href: "https://github.com/AmaanSayyad/BorrowDesk",
    label: "GitHub",
    external: true,
  },
  {
    href: `${MAINNET.explorer}/address/${MAINNET.market}`,
    label: "Live market",
    external: true,
  },
  {
    href: `${MAINNET.explorer}/token/${MAINNET.usdg}`,
    label: "USDG token",
    logo: "/tokens/usdg.png",
    external: true,
  },
  {
    href: "https://robinhoodchain.blockscout.com",
    label: "Explorer",
    external: true,
  },
];

const RESOURCES: FooterLink[] = [
  {
    href: "https://docs.robinhood.com/chain/",
    label: "Chain docs",
    logo: "/partners/robinhood.svg",
    external: true,
  },
  {
    href: "https://docs.arbitrum.io/",
    label: "Arbitrum docs",
    logo: "/partners/arbitrum.png",
    external: true,
  },
  {
    href: "https://docs.paxos.com/guides/stablecoin/usdg/mainnet",
    label: "USDG (Paxos)",
    logo: "/tokens/usdg.png",
    external: true,
  },
  {
    href: "https://robinhood.com/us/en/chain/",
    label: "Robinhood Chain",
    logo: "/partners/robinhood.svg",
    external: true,
  },
];

const COMPANY: FooterLink[] = [
  {
    href: "https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon",
    label: "Open House Singapore",
    logo: "/partners/openhouse.png",
    external: true,
  },
  {
    href: MAINNET.pitchDeck,
    label: "Pitch deck",
    external: true,
  },
  {
    href: MAINNET.demoVideo,
    label: "Demo + pitch video",
    external: true,
  },
  {
    href: "https://github.com/AmaanSayyad/BorrowDesk",
    label: "GitHub",
    external: true,
  },
  {
    href: "https://docs.robinhood.com/chain/",
    label: "Build on RH Chain",
    logo: "/partners/robinhood.svg",
    external: true,
  },
  { href: MAINNET.explorer, label: "Blockscout", external: true },
];

/** Dark mark well - no white boxes; logos stay readable on lime. */
function LinkMark({ logo }: { logo?: string }) {
  if (!logo) return null;
  const wide = logo.includes("openhouse");
  return (
    <span
      className={
        wide
          ? "inline-flex h-5 w-10 shrink-0 items-center justify-center rounded-[5px] bg-[#110e08]/90 px-0.5 ring-1 ring-black/20"
          : "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[5px] bg-[#110e08]/90 ring-1 ring-black/20"
      }
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt=""
        width={wide ? 36 : 14}
        height={14}
        className={
          wide
            ? "h-3.5 w-auto max-w-9 object-contain"
            : "h-3.5 w-3.5 object-contain"
        }
        aria-hidden
      />
    </span>
  );
}

function Col({
  title,
  links,
}: {
  title: string;
  links: FooterLink[];
}) {
  return (
    <div>
      <p className="mb-4 text-[15px] font-medium text-rh-on-lime">{title}</p>
      <ul className="space-y-2.5">
        {links.map((l) => {
          const className =
            "inline-flex items-center gap-2 text-[14px] text-rh-on-lime/85 transition-colors hover:text-rh-on-lime";
          const content = (
            <>
              <LinkMark logo={l.logo} />
              <span>{l.label}</span>
            </>
          );
          return (
            <li key={`${l.href}-${l.label}`}>
              {l.external ? (
                <a
                  href={l.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={className}
                >
                  {content}
                </a>
              ) : (
                <Link href={l.href} className={className}>
                  {content}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function BuiltOnChip({
  href,
  label,
  logo,
}: {
  href: string;
  label: string;
  logo: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-full bg-[#110e08] px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/25"
      style={{ color: "#CCFF00" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logo}
        alt=""
        width={14}
        height={14}
        className="h-3.5 w-3.5 object-contain"
        aria-hidden
      />
      <span style={{ color: "#CCFF00" }}>{label}</span>
    </a>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-rh-lime text-rh-on-lime">
      <div className="rh-container pb-12 pt-10 sm:pb-14 sm:pt-12">
        <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <Image
              src="/brand/borrowdesk-mark.jpg"
              alt="BorrowDesk"
              width={32}
              height={32}
              className="rounded-lg"
            />
            <span className="text-[17px] font-medium text-rh-on-lime">
              BorrowDesk
            </span>
          </Link>

          <div className="flex flex-col items-start gap-3 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={MAINNET.pitchDeck}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[#110e08] px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/25"
                style={{ color: "#CCFF00" }}
              >
                Pitch deck
              </a>
              <a
                href={MAINNET.demoVideo}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[#110e08] px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/25"
                style={{ color: "#CCFF00" }}
              >
                Demo video
              </a>
              <a
                href="https://github.com/AmaanSayyad/BorrowDesk"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[#110e08] px-3 py-1.5 text-[13px] font-medium ring-1 ring-black/25"
                style={{ color: "#CCFF00" }}
              >
                GitHub
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="mr-1 text-[13px] text-rh-on-lime/70">Built on</span>
              <BuiltOnChip
                href="https://arbitrum-singapore.hackquest.io/buildathons/Arbitrum-Open-House-Singapore-Online-Buildathon"
                label="Open House"
                logo="/partners/openhouse.png"
              />
              <BuiltOnChip
                href="https://robinhood.com/us/en/chain/"
                label="Robinhood Chain"
                logo="/partners/robinhood.svg"
              />
              <BuiltOnChip
                href="https://docs.arbitrum.io/"
                label="Arbitrum"
                logo="/partners/arbitrum.png"
              />
              <BuiltOnChip
                href={`${MAINNET.explorer}/token/${MAINNET.usdg}`}
                label="USDG"
                logo="/tokens/usdg.png"
              />
            </div>
          </div>
        </div>

        <div className="mb-10 grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-10">
          <Col title="Product" links={PRODUCT} />
          <Col title="Platform" links={PLATFORM} />
          <Col title="Resources" links={RESOURCES} />
          <Col title="Company" links={COMPANY} />
        </div>

        <div className="max-w-4xl space-y-3 border-t border-rh-on-lime/20 pt-8 text-[12px] leading-relaxed text-rh-on-lime/75">
          <p>
            BorrowDesk is a collateralized credit line for Stock Tokens on
            Robinhood Chain, settled in USDG.
          </p>
          <p>
            Crypto and tokenized assets involve significant risk and can result
            in loss of capital. Nothing on this site is financial advice.
            BorrowDesk is an independent Buildathon project and is not
            affiliated with or endorsed by Robinhood Markets, Inc., the Arbitrum
            Foundation, or Paxos unless explicitly stated.
          </p>
          <p className="pt-1 text-rh-on-lime/55">
            © {new Date().getFullYear()} BorrowDesk · Built on Robinhood Chain
          </p>
        </div>
      </div>

      <div className="overflow-hidden select-none" aria-hidden>
        <p className="whitespace-nowrap px-3 pb-2 font-bold leading-[0.85] tracking-[-0.04em] text-rh-on-lime text-[clamp(3.5rem,14vw,11rem)] sm:px-5 sm:pb-4">
          BorrowDesk
        </p>
      </div>
    </footer>
  );
}
