export type Desk =
  | "overview"
  | "borrow"
  | "positions"
  | "markets"
  | "protocol"
  | "risk"
  | "lookup"
  | "onboarding";

export type TourPhase = "desk" | "ticket" | "proof";

export type TourStep = {
  id: string;
  title: string;
  body: string;
  phase: TourPhase;
  target?: string;
  desk?: Desk;
  href?: string;
  /** Open borrow ticket with this symbol when entering borrow desk */
  ticket?: "deposit" | "withdraw" | "borrow" | "repay";
  symbol?: string;
  waitForWallet?: boolean;
  /** Open the ⌘K command palette for this step */
  openSearch?: boolean;
  /** Primary button label (defaults to Next / Connect / Done) */
  cta?: string;
};

export const TOUR_STORAGE_KEY = "borrowdesk.tour.v1";
export const TOUR_WALLET_KEY = "borrowdesk.tour.wallet.v1";
export const TOUR_WALLET_START = "wallet-ticket";
export const TOUR_STEP_KEY = "borrowdesk.tour.step.v1";
export const TOUR_DESK_EVENT = "borrowdesk:desk";

export const TOUR_PHASE_LABEL: Record<TourPhase, string> = {
  desk: "The desk",
  ticket: "The ticket",
  proof: "The proof",
};

export function pathMatches(pathname: string, href: string) {
  const a = pathname.toLowerCase().split("?")[0] ?? "";
  const b = href.toLowerCase().split("?")[0] ?? "";
  return a === b || (b === "/app" && a.startsWith("/app"));
}

export function resolveStepHref(step: TourStep): string | null {
  if (step.href === "/verify") return "/verify";
  if (step.desk) {
    const q = new URLSearchParams();
    q.set("desk", step.desk);
    if (step.symbol) q.set("asset", step.symbol);
    if (step.ticket) q.set("ticket", step.ticket);
    return `/app?${q.toString()}`;
  }
  if (step.href) return step.href;
  return null;
}

/** True when path + optional desk query already match the step href. */
export function stepLocationMatches(
  pathname: string,
  search: string,
  href: string,
) {
  if (!pathMatches(pathname, href)) return false;
  let wantDesk: string | null = null;
  try {
    wantDesk = new URL(href, "http://local").searchParams.get("desk");
  } catch {
    wantDesk = null;
  }
  if (!wantDesk) return true;
  return new URLSearchParams(search).get("desk") === wantDesk;
}

/**
 * Judge / product guide — OpenGap-style spotlight, BorrowDesk narrative.
 * Kept short: desk → ticket → proof.
 */
export const TOUR_STEPS: TourStep[] = [
  {
    id: "why",
    phase: "desk",
    title: "Keep the stocks. Borrow the dollar.",
    body: "USDG credit line against Robinhood Stock Tokens on chain 4663. Deposit equity, borrow Global Dollar, see liquidation math before you sign.",
    desk: "overview",
    cta: "Show the desk",
  },
  {
    id: "safety",
    phase: "desk",
    title: "Three checks, always on",
    body: "Fresh oracle · Healthy after · Pool can fund. They stay visible before every ticket — you never borrow blind.",
    target: "safety",
    desk: "overview",
  },
  {
    id: "desks",
    phase: "desk",
    title: "Same book, nine views",
    body: "Overview through Get started. Switch desks anytime — your wallet position does not change.",
    target: "desks",
    desk: "overview",
  },
  {
    id: "search",
    phase: "desk",
    title: "Search anything · ⌘K",
    body: "Jump to desks, tickers, deposit, borrow, supply, or the guide. Type NVDA or markets — no hunting through tabs.",
    target: "search",
    desk: "overview",
    openSearch: true,
    cta: "Show health",
  },
  {
    id: "health",
    phase: "desk",
    title: "Read the position first",
    body: "Collateral, debt, LTV, health factor, borrow room. This board answers “am I safe?” before you open a ticket.",
    target: "health",
    desk: "overview",
    cta: "Open a ticket",
  },
  {
    id: "ticket",
    phase: "ticket",
    title: "Deposit · Borrow · Repay",
    body: "Pick NVDA (or any listed name), set an amount, review liq price and health after — then Confirm & sign.",
    target: "ticket",
    desk: "borrow",
    ticket: "borrow",
    symbol: "NVDA",
  },
  {
    id: "route",
    phase: "ticket",
    title: "Why this route?",
    body: "Listed · oracle fresh · pool idle · collateral · borrow power · healthy. Green means the desk can fund this ticket now.",
    target: "route",
    desk: "borrow",
    ticket: "borrow",
    symbol: "NVDA",
  },
  {
    id: "markets",
    phase: "ticket",
    title: "LTV is equity-tuned",
    body: "Oracle marks and liquidation bands per Stock Token. Click a name to preload the ticket.",
    target: "markets",
    desk: "markets",
  },
  {
    id: "protocol",
    phase: "proof",
    title: "Pool cash is visible",
    body: "Idle USDG, protocol debt, utilisation. The solvency view judges ask for — nothing hidden behind a slide.",
    target: "protocol",
    desk: "protocol",
  },
  {
    id: "lookup",
    phase: "proof",
    title: "Look up any address",
    body: "No wallet needed. Pull accountHealth for any book — try the proven deployer position for live mainnet debt.",
    target: "lookup",
    desk: "lookup",
    cta: "Connect wallet",
  },
  {
    id: "connect",
    phase: "proof",
    title: "Connect on chain 4663",
    body: "Robinhood Chain mainnet. After you connect, the guide continues on the live borrow ticket.",
    target: "connect",
    desk: "overview",
    waitForWallet: true,
    cta: "Connect wallet",
  },
  {
    id: "wallet-ticket",
    phase: "proof",
    title: "Your live ticket",
    body: "Deposit listed Stock Tokens, set target LTV, check liq price, then Confirm & sign. This hits the real market.",
    target: "ticket",
    desk: "borrow",
    ticket: "borrow",
    symbol: "NVDA",
    cta: "Judge checklist",
  },
  {
    id: "onboarding",
    phase: "proof",
    title: "Demo-day path",
    body: "4663 → ETH for gas → Stock Tokens → deposit → borrow. Short checklist when you need tokens on the chain.",
    target: "onboarding",
    desk: "onboarding",
    cta: "Verify onchain",
  },
  {
    id: "verify",
    phase: "proof",
    title: "Trust the chain",
    body: "One cast command per claim — or ./script/verify-claims.sh. Manifest at deployments/robinhood.json.",
    target: "verify",
    href: "/verify",
    cta: "Done",
  },
];
