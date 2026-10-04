"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AccountLookup } from "@/components/app/AccountLookup";
import { ActionPanel } from "@/components/app/ActionPanel";
import { ActivityFeed } from "@/components/app/ActivityFeed";
import { CommandPalette } from "@/components/app/CommandPalette";
import { FundDesk, type FundMode } from "@/components/app/FundDesk";
import { HealthMeter } from "@/components/app/HealthMeter";
import { MarketsDesk } from "@/components/app/MarketsDesk";
import { OnboardingPanel } from "@/components/app/OnboardingPanel";
import { OracleStrip } from "@/components/app/OracleStrip";
import { Portfolio } from "@/components/app/Portfolio";
import { PositionCharts } from "@/components/app/PositionCharts";
import { PrintTape } from "@/components/app/PrintTape";
import { useTour } from "@/components/app/ProductTour";
import { ProtocolBoard } from "@/components/app/ProtocolBoard";
import { RiskPanel } from "@/components/app/RiskPanel";
import { SafetyChrome } from "@/components/app/SafetyChrome";
import { StatusHeadline } from "@/components/app/StatusHeadline";
import { TxHistory } from "@/components/app/TxHistory";
import { WatchlistBar } from "@/components/app/WatchlistBar";
import { WalletBar } from "@/components/app/WalletBar";
import { CollateralTicker } from "@/components/ui/CollateralTicker";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { usePoolLiquidity } from "@/hooks/usePoolLiquidity";
import { cn } from "@/lib/utils";

type Desk =
  | "overview"
  | "borrow"
  | "fund"
  | "positions"
  | "markets"
  | "protocol"
  | "risk"
  | "lookup"
  | "onboarding";

const DESKS: { id: Desk; label: string; hint: string }[] = [
  { id: "overview", label: "Overview", hint: "Health & ticket" },
  { id: "borrow", label: "Borrow", hint: "Deposit & draw" },
  { id: "fund", label: "Fund", hint: "Get · batch · supply" },
  { id: "positions", label: "Positions", hint: "Your book" },
  { id: "markets", label: "Markets", hint: "LTV bands" },
  { id: "protocol", label: "Protocol", hint: "Pool & util" },
  { id: "risk", label: "Risk", hint: "Bands & APR" },
  { id: "lookup", label: "Look up", hint: "Any address" },
  { id: "onboarding", label: "Start", hint: "Judge path" },
];

function fundModeFromSearch(search: URLSearchParams): FundMode {
  const mode = search.get("mode");
  if (mode === "batch" || mode === "supply" || mode === "get") return mode;
  const desk = search.get("desk");
  if (desk === "batch") return "batch";
  if (desk === "supply") return "supply";
  return "get";
}

function deskFromSearch(search: URLSearchParams): Desk {
  if (search.get("look") || search.get("account")) return "lookup";
  const raw = search.get("desk");
  if (raw === "liquidate" || raw === "keeper") return "risk";
  if (raw === "get" || raw === "supply" || raw === "batch") return "fund";
  if (raw && DESKS.some((x) => x.id === raw)) return raw as Desk;
  if (search.get("asset") || search.get("ticket")) return "borrow";
  return "overview";
}

function AppBody() {
  const search = useSearchParams();
  const live = useBorrowDeskLive();
  const pool = usePoolLiquidity();
  const poolUsdg = live.poolUsdg > 0 ? live.poolUsdg : pool.poolUsdg;
  const m = live.liveMetrics;
  const [desk, setDesk] = useState<Desk>(() => deskFromSearch(search));
  const [fundMode, setFundMode] = useState<FundMode>(() =>
    fundModeFromSearch(search),
  );
  const tour = useTour();

  useEffect(() => {
    const onDesk = (e: Event) => {
      const next = (e as CustomEvent<{ desk: Desk }>).detail?.desk;
      if (next && DESKS.some((d) => d.id === next)) setDesk(next);
    };
    window.addEventListener("borrowdesk:desk", onDesk);
    return () => window.removeEventListener("borrowdesk:desk", onDesk);
  }, []);

  useEffect(() => {
    setDesk(deskFromSearch(search));
    setFundMode(fundModeFromSearch(search));
  }, [search]);

  return (
    <>
      <div className="pt-16">
        <CollateralTicker />
      </div>
      <main className="rh-container-wide flex-1 py-6 md:py-8">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <div className="section-kicker text-rh-lime">
              BorrowDesk · Robinhood Chain
            </div>
            <h1 className="rh-display mt-1 text-[clamp(1.85rem,3.5vw,2.6rem)] text-white">
              Credit line
            </h1>
            <p className="mt-1.5 max-w-2xl text-sm text-rh-muted">
              Get stock → deposit → borrow · supply USDG · share your line.
            </p>
          </div>
          <button
            type="button"
            onClick={() => tour.start()}
            className="chip self-start border border-rh-lime/30 bg-rh-lime/10 text-rh-lime hover:bg-rh-lime/20 sm:self-auto"
          >
            Guide
          </button>
        </div>

        <div className="mt-1">
          <WalletBar />
        </div>

        <div className="desk-split mt-4">
          {/* Left: work surface - status, desks, ticket */}
          <div className="desk-main">
            <StatusHeadline />

            <nav aria-label="Desk sections" data-tour="desks" className="desk-nav">
              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {DESKS.map((d) => {
                  const active = desk === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDesk(d.id)}
                      aria-current={active ? "page" : undefined}
                      title={d.hint}
                      className={cn(
                        "shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition",
                        active
                          ? "bg-rh-lime text-rh-on-lime"
                          : "text-rh-muted hover:bg-white/5 hover:text-white",
                      )}
                    >
                      {d.label}
                    </button>
                  );
                })}
              </div>
            </nav>

            <div className="space-y-4">
              {desk === "overview" && (
                <>
                  <HealthMeter
                    healthFactor={m.healthFactor}
                    ltv={m.ltv}
                    collateralUsd={m.collateralUsd}
                    debtUsd={m.debtUsd}
                    borrowPowerUsd={m.borrowPowerUsd}
                  />
                  <ActionPanel />
                  <PositionCharts />
                </>
              )}

              {desk === "borrow" && <ActionPanel />}
              {desk === "fund" && <FundDesk initialMode={fundMode} />}

              {desk === "positions" && (
                <>
                  <HealthMeter
                    healthFactor={m.healthFactor}
                    ltv={m.ltv}
                    collateralUsd={m.collateralUsd}
                    debtUsd={m.debtUsd}
                    borrowPowerUsd={m.borrowPowerUsd}
                  />
                  <Portfolio />
                  <TxHistory />
                </>
              )}

              {desk === "markets" && <MarketsDesk />}

              {desk === "protocol" && <ProtocolBoard />}

              {desk === "risk" && (
                <>
                  <RiskPanel />
                  <HealthMeter
                    healthFactor={m.healthFactor}
                    ltv={m.ltv}
                    collateralUsd={m.collateralUsd}
                    debtUsd={m.debtUsd}
                    borrowPowerUsd={m.borrowPowerUsd}
                  />
                </>
              )}

              {desk === "lookup" && <AccountLookup />}
              {desk === "onboarding" && <OnboardingPanel />}
            </div>
          </div>

          {/* Right: sticky context rail */}
          <aside className="desk-rail" aria-label="Desk status rail">
            <SafetyChrome />
            <OracleStrip />
            <WatchlistBar compact />
            <ActivityFeed poolUsdg={poolUsdg} />
            <PrintTape />
            <div className="flex flex-wrap gap-x-3 gap-y-1 px-1 text-xs text-rh-muted">
              {desk !== "onboarding" && (
                <button
                  type="button"
                  onClick={() => setDesk("onboarding")}
                  className="transition hover:text-rh-lime"
                >
                  Judge path →
                </button>
              )}
              <button
                type="button"
                onClick={() => tour.start()}
                className="transition hover:text-rh-lime"
              >
                Restart guide →
              </button>
              <a href="/verify" className="hover:text-rh-lime">
                Verify claims →
              </a>
            </div>
          </aside>
        </div>
      </main>
      <CommandPalette />
    </>
  );
}

export default function AppPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={
          <main className="rh-container-wide flex-1 py-24 text-rh-muted">
            Loading desk…
          </main>
        }
      >
        <AppBody />
      </Suspense>
      <SiteFooter />
    </>
  );
}
