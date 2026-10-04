"use client";

import { useAccount } from "wagmi";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Suspense,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useWalletModal } from "@/hooks/useWalletModal";
import {
  TOUR_DESK_EVENT,
  TOUR_PHASE_LABEL,
  TOUR_STEP_KEY,
  TOUR_STEPS,
  TOUR_STORAGE_KEY,
  TOUR_WALLET_KEY,
  TOUR_WALLET_START,
  resolveStepHref,
  stepLocationMatches,
  type Desk,
  type TourStep,
} from "@/lib/tour";
import { cn } from "@/lib/utils";

const CARD_W = 340;
const CARD_H = 240;
const PAD = 12;
const MOVE_MS = 480;
const EASE = "cubic-bezier(0.22, 1, 0.36, 1)";

type Hole = {
  top: number;
  left: number;
  width: number;
  height: number;
};

const TourContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
  start: () => void;
} | null>(null);

export function useTour() {
  return (
    useContext(TourContext) ?? {
      open: false,
      setOpen: () => {},
      start: () => {},
    }
  );
}

function goDesk(step: TourStep) {
  if (step.desk) {
    window.dispatchEvent(
      new CustomEvent(TOUR_DESK_EVENT, { detail: { desk: step.desk as Desk } }),
    );
  }
  if (step.openSearch) {
    window.setTimeout(() => {
      window.dispatchEvent(new Event("borrowdesk:command"));
    }, 80);
  } else {
    window.dispatchEvent(new Event("borrowdesk:command-close"));
  }
  if (step.ticket) {
    window.setTimeout(() => {
      window.dispatchEvent(
        new CustomEvent("borrowdesk:ticket", {
          detail: { tab: step.ticket, symbol: step.symbol ?? "NVDA" },
        }),
      );
    }, 140);
  }
}

function queryTourTarget(target: string) {
  const nodes = [
    ...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`),
  ];
  return (
    nodes.find((node) => {
      const r = node.getBoundingClientRect();
      return r.width > 8 && r.height > 8;
    }) ?? null
  );
}

function primaryLabel(step: TourStep, waiting: boolean, last: boolean) {
  if (waiting) return step.cta ?? "Connect wallet";
  if (last) return step.cta ?? "Done";
  return step.cta ?? "Next";
}

function placeCard(hole: Hole | null) {
  const cardW = Math.min(CARD_W, window.innerWidth - 32);
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left: number;
  let top: number;
  let place: "below" | "above" | "right" | "center" = "center";

  if (hole) {
    const spaceRight = vw - (hole.left + hole.width);
    const spaceBelow = vh - (hole.top + hole.height);
    const spaceAbove = hole.top;

    if (vw >= 900 && spaceRight >= cardW + 24) {
      place = "right";
      left = hole.left + hole.width + 16;
      top = Math.min(Math.max(16, hole.top), Math.max(16, vh - CARD_H - 16));
    } else if (spaceBelow >= CARD_H + 20) {
      place = "below";
      left = Math.min(Math.max(16, hole.left), Math.max(16, vw - cardW - 16));
      top = hole.top + hole.height + 14;
    } else if (spaceAbove >= CARD_H + 20) {
      place = "above";
      left = Math.min(Math.max(16, hole.left), Math.max(16, vw - cardW - 16));
      top = Math.max(16, hole.top - CARD_H - 14);
    } else {
      place = "below";
      left = Math.min(Math.max(16, hole.left), Math.max(16, vw - cardW - 16));
      top = Math.min(
        hole.top + hole.height + 14,
        Math.max(16, vh - CARD_H - 16),
      );
    }
  } else {
    left = Math.max(16, (vw - cardW) / 2);
    top = Math.max(24, (vh - CARD_H) / 2);
  }

  return { left, top, place, cardW };
}

function rectToHole(rect: DOMRect): Hole {
  return {
    top: Math.max(8, rect.top - PAD),
    left: Math.max(8, rect.left - PAD),
    width: Math.min(rect.width + PAD * 2, window.innerWidth - 16),
    // Cap height so the card still fits; users can scroll the page under the tour.
    height: Math.min(rect.height + PAD * 2, window.innerHeight * 0.7),
  };
}

export function TourProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const forced = params.get("tour") === "1";
    const saved = window.sessionStorage.getItem(TOUR_STEP_KEY);
    if (forced) {
      setOpen(true);
      if (saved == null) setStep(0);
      if (!pathname.startsWith("/app") && !pathname.startsWith("/verify")) {
        router.replace("/app?desk=overview&tour=1");
      }
      return;
    }
    if (saved != null) {
      const index = Number(saved);
      if (Number.isFinite(index)) {
        setStep(Math.max(0, Math.min(index, TOUR_STEPS.length - 1)));
      }
      setOpen(true);
      return;
    }
    if (
      pathname.startsWith("/app") &&
      !window.localStorage.getItem(TOUR_STORAGE_KEY)
    ) {
      setOpen(true);
    }
  }, [pathname, router]);

  useEffect(() => {
    if (open) window.sessionStorage.setItem(TOUR_STEP_KEY, String(step));
    else window.sessionStorage.removeItem(TOUR_STEP_KEY);
  }, [open, step]);

  const start = useCallback(() => {
    setStep(0);
    setOpen(true);
    router.replace("/app?desk=overview&tour=1");
  }, [router]);

  const value = useMemo(() => ({ open, setOpen, start }), [open, start]);

  return (
    <TourContext.Provider value={value}>
      {children}
      <Suspense fallback={null}>
        <ProductTour
          open={open}
          onOpenChange={setOpen}
          step={step}
          setStep={setStep}
        />
      </Suspense>
    </TourContext.Provider>
  );
}

export function ProductTour({
  open,
  onOpenChange,
  step,
  setStep,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  step: number;
  setStep: (value: number | ((current: number) => number)) => void;
}) {
  const { isConnected } = useAccount();
  const { openConnect } = useWalletModal();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();

  const [hole, setHole] = useState<Hole | null>(null);
  const [href, setHref] = useState<string | null>(null);
  const [cardPos, setCardPos] = useState<{
    left: number;
    top: number;
    place: "below" | "above" | "right" | "center";
  }>({ left: 16, top: 24, place: "center" });
  const [contentVisible, setContentVisible] = useState(true);
  const [displayStep, setDisplayStep] = useState(step);
  const [overlayIn, setOverlayIn] = useState(false);
  const [busy, setBusy] = useState(false);

  const current = TOUR_STEPS[step];
  const shown = TOUR_STEPS[displayStep] ?? current;
  const last = step === TOUR_STEPS.length - 1;
  const waiting = Boolean(shown?.waitForWallet && !isConnected);
  const touchY = useRef(0);
  const finishRef = useRef(() => {});
  const nextRef = useRef(() => {});
  const backRef = useRef(() => {});
  const contentTimer = useRef(0);

  function finish() {
    window.dispatchEvent(new Event("borrowdesk:command-close"));
    setOverlayIn(false);
    window.setTimeout(() => {
      window.localStorage.setItem(TOUR_STORAGE_KEY, "1");
      if (isConnected || current?.id.startsWith("wallet-")) {
        window.localStorage.setItem(TOUR_WALLET_KEY, "1");
      }
      window.sessionStorage.removeItem(TOUR_STEP_KEY);
      onOpenChange(false);
      setStep(0);
      setHole(null);
    }, 220);
  }

  function next() {
    if (busy) return;
    if (waiting) {
      openConnect();
      return;
    }
    if (last) finish();
    else setStep((v) => v + 1);
  }

  function back() {
    if (busy) return;
    setStep((v) => Math.max(0, v - 1));
  }

  finishRef.current = finish;
  nextRef.current = next;
  backRef.current = back;

  // Enter / exit overlay
  useEffect(() => {
    if (!open) {
      setOverlayIn(false);
      return;
    }
    const id = window.requestAnimationFrame(() => setOverlayIn(true));
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // Crossfade copy when step index changes
  useEffect(() => {
    if (!open) return;
    if (displayStep === step) return;

    setBusy(true);
    setContentVisible(false);
    window.clearTimeout(contentTimer.current);
    contentTimer.current = window.setTimeout(() => {
      setDisplayStep(step);
      setContentVisible(true);
      window.setTimeout(() => setBusy(false), MOVE_MS);
    }, 160);

    return () => window.clearTimeout(contentTimer.current);
  }, [step, displayStep, open]);

  // Sync displayStep on first open
  useEffect(() => {
    if (open) setDisplayStep(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Skip connect step when already signed in
  useEffect(() => {
    if (!open || !current?.waitForWallet || !isConnected) return;
    const timer = window.setTimeout(() => setStep((v) => v + 1), 450);
    return () => window.clearTimeout(timer);
  }, [open, current, isConnected, setStep]);

  useEffect(() => {
    if (!isConnected || open) return;
    if (window.localStorage.getItem(TOUR_WALLET_KEY)) return;
    if (!window.localStorage.getItem(TOUR_STORAGE_KEY)) return;
    const startIdx = TOUR_STEPS.findIndex((s) => s.id === TOUR_WALLET_START);
    setStep(startIdx >= 0 ? startIdx : 0);
    onOpenChange(true);
  }, [isConnected, onOpenChange, open, setStep]);

  useEffect(() => {
    if (!open || !current) return;
    const nextHref = resolveStepHref(current);
    setHref(nextHref);
    if (nextHref && !stepLocationMatches(pathname, search, nextHref)) {
      const url = new URL(nextHref, window.location.origin);
      url.searchParams.set("tour", "1");
      router.replace(`${url.pathname}?${url.searchParams.toString()}`);
      window.setTimeout(() => goDesk(current), 180);
      return;
    }
    goDesk(current);
  }, [current, open, pathname, router, search]);

  useLayoutEffect(() => {
    if (!open || !current) return;
    if (href && !stepLocationMatches(pathname, search, href)) {
      return;
    }

    let frame = 0;
    let retry = 0;
    let revealTimer = 0;

    function applyHole(next: Hole | null) {
      setHole(next);
      const placed = placeCard(next);
      setCardPos({
        left: placed.left,
        top: placed.top,
        place: placed.place,
      });
    }

    function measure() {
      if (!current?.target) {
        applyHole(null);
        return;
      }
      const node = queryTourTarget(current.target);
      if (!node) {
        retry = window.setTimeout(measure, 120);
        return;
      }
      applyHole(rectToHole(node.getBoundingClientRect()));
    }

    function reveal() {
      if (!current?.target) {
        applyHole(null);
        return;
      }
      queryTourTarget(current.target)?.scrollIntoView({
        block: "center",
        behavior: "smooth",
      });
      // Wait for smooth scroll / palette open to settle
      window.setTimeout(measure, current.openSearch ? 320 : 280);
    }

    frame = window.requestAnimationFrame(() => {
      revealTimer = window.setTimeout(
        reveal,
        current.desk || href ? 220 : 60,
      );
    });

    const onScrollOrResize = () => {
      if (!current?.target) return;
      const node = queryTourTarget(current.target);
      if (!node) return;
      const next = rectToHole(node.getBoundingClientRect());
      setHole(next);
      const placed = placeCard(next);
      setCardPos({
        left: placed.left,
        top: placed.top,
        place: placed.place,
      });
    };

    window.addEventListener("resize", onScrollOrResize);
    window.addEventListener("scroll", onScrollOrResize, {
      capture: true,
      passive: true,
    });
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(retry);
      window.clearTimeout(revealTimer);
      window.removeEventListener("resize", onScrollOrResize);
      window.removeEventListener("scroll", onScrollOrResize, true);
    };
  }, [current, href, open, pathname, search]);

  useEffect(() => {
    if (!open) return;
    // Overlay is pointer-events-none so the page scrolls natively.
    // When the cursor is over the card, forward wheel/touch to the page.
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") finishRef.current();
      if (event.key === "ArrowRight" || event.key === "Enter") {
        event.preventDefault();
        nextRef.current();
      }
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        backRef.current();
      }
      if (event.key === "PageDown") {
        window.scrollBy({ top: window.innerHeight * 0.65, behavior: "smooth" });
      }
      if (event.key === "PageUp") {
        window.scrollBy({
          top: -window.innerHeight * 0.65,
          behavior: "smooth",
        });
      }
    }
    function overCard(event: Event) {
      const card = document.querySelector("[data-tour-card]");
      return Boolean(card && event.target instanceof Node && card.contains(event.target));
    }
    function onWheel(event: WheelEvent) {
      if (!overCard(event)) return;
      window.scrollBy({ top: event.deltaY, left: event.deltaX });
    }
    function onTouchStart(event: TouchEvent) {
      if (!overCard(event)) return;
      touchY.current = event.touches[0]?.clientY ?? 0;
    }
    function onTouchMove(event: TouchEvent) {
      if (!overCard(event)) return;
      const y = event.touches[0]?.clientY ?? touchY.current;
      window.scrollBy({ top: touchY.current - y });
      touchY.current = y;
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: true });
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
    };
  }, [open]);

  if (!open || !shown) return null;

  const progress = ((displayStep + 1) / TOUR_STEPS.length) * 100;
  const phase = TOUR_PHASE_LABEL[shown.phase];
  const moveTransition = `top ${MOVE_MS}ms ${EASE}, left ${MOVE_MS}ms ${EASE}, width ${MOVE_MS}ms ${EASE}, height ${MOVE_MS}ms ${EASE}`;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-[90] transition-opacity duration-300",
        overlayIn ? "opacity-100" : "opacity-0",
      )}
      role="dialog"
      aria-modal="false"
      aria-labelledby="tour-title"
    >
      <Spotlight hole={hole} transition={moveTransition} />

      <div
        data-tour-card
        className="pointer-events-auto absolute z-20 w-[min(21.25rem,calc(100vw-2rem))] rounded-2xl border border-rh-lime/40 bg-[#e8e8e4] p-4 text-[#110e08] shadow-[0_24px_60px_rgb(0_0_0/0.55)]"
        style={{
          top: cardPos.top,
          left: cardPos.left,
          transition: overlayIn
            ? `top ${MOVE_MS}ms ${EASE}, left ${MOVE_MS}ms ${EASE}, opacity 280ms ${EASE}, transform 280ms ${EASE}`
            : "none",
          opacity: overlayIn ? 1 : 0,
          transform: overlayIn ? "translateY(0) scale(1)" : "translateY(8px) scale(0.98)",
        }}
      >
        {hole && (cardPos.place === "below" || cardPos.place === "above") ? (
          <span
            className={cn(
              "absolute left-8 size-2.5 rotate-45 bg-[#e8e8e4] transition-opacity duration-300",
              cardPos.place === "below" ? "-top-1" : "-bottom-1",
            )}
          />
        ) : null}
        {hole && cardPos.place === "right" ? (
          <span className="absolute top-8 -left-1 size-2.5 rotate-45 bg-[#e8e8e4] transition-opacity duration-300" />
        ) : null}

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#110e08]/45">
                {phase}
              </span>
              <span className="text-[10px] font-medium tabular text-[#110e08]/45">
                {displayStep + 1}/{TOUR_STEPS.length}
              </span>
            </div>
            <div className="mt-2 h-1 overflow-hidden rounded-full bg-[#110e08]/12">
              <div
                className="h-full rounded-full bg-[#110e08]"
                style={{
                  width: `${progress}%`,
                  transition: `width ${MOVE_MS}ms ${EASE}`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={finish}
            className="-mr-1 -mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-lg leading-none text-[#110e08]/45 transition hover:bg-black/5 hover:text-[#110e08]"
            aria-label="Close guide"
          >
            ×
          </button>
        </div>

        <div
          className="transition-[opacity,transform] duration-200 ease-out"
          style={{
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? "translateY(0)" : "translateY(6px)",
          }}
        >
          <h2
            id="tour-title"
            className="mt-3 text-[1.15rem] font-semibold tracking-tight text-[#110e08]"
          >
            {shown.title}
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-[#110e08]/72">
            {shown.body}
          </p>
          <p className="mt-2 text-[11px] text-[#110e08]/40">
            {waiting
              ? "Connect to continue · Esc to skip"
              : "← → to move · Esc to skip · scroll ok"}
          </p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          {displayStep > 0 ? (
            <button
              type="button"
              onClick={back}
              disabled={busy}
              className="h-9 rounded-full px-3 text-sm font-medium text-[#110e08]/65 transition hover:bg-black/5 hover:text-[#110e08] disabled:opacity-40"
            >
              Back
            </button>
          ) : (
            <button
              type="button"
              onClick={finish}
              className="h-9 px-2 text-sm text-[#110e08]/50 transition hover:text-[#110e08]"
            >
              Skip
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={busy && !waiting}
            className={cn(
              "ml-auto h-9 rounded-full px-4 text-sm font-medium transition disabled:opacity-50",
              waiting
                ? "bg-[#ccff00] text-[#110e08] hover:brightness-95"
                : "bg-[#110e08] text-[#ccff00] hover:bg-black",
            )}
          >
            {primaryLabel(shown, waiting, displayStep === TOUR_STEPS.length - 1)}
          </button>
        </div>
      </div>
    </div>
  );
}

function Spotlight({
  hole,
  transition,
}: {
  hole: Hole | null;
  transition: string;
}) {
  // Centered fallback hole when no target (intro / loading)
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const active: Hole = hole ?? {
    top: vh / 2 - 40,
    left: vw / 2 - 40,
    width: 80,
    height: 80,
  };

  return (
    <>
      {/* Visual only - pointer-events-none so the page stays scrollable */}
      <div
        aria-hidden
        className="pointer-events-none absolute z-[1] rounded-2xl"
        style={{
          top: active.top,
          left: active.left,
          width: active.width,
          height: active.height,
          boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.72)",
          transition,
        }}
      />
      <div
        className="tour-spotlight pointer-events-none absolute z-[3] rounded-2xl ring-2 ring-[#ccff00]"
        style={{
          top: active.top,
          left: active.left,
          width: active.width,
          height: active.height,
          transition,
        }}
      />
    </>
  );
}
