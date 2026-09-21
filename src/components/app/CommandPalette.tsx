"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useTour } from "@/components/app/ProductTour";
import { LISTED_TOKENS, STOCK_TOKENS } from "@/lib/tokens";
import { TokenLogo } from "@/components/ui/TokenLogo";
import { cn } from "@/lib/utils";

type Group = "Desks" | "Assets" | "Quick actions";

type Item = {
  id: string;
  label: string;
  hint: string;
  group: Group;
  logo?: string;
  icon?: ReactNode;
  keywords?: string;
  run: () => void;
};

function openTicket(tab: "deposit" | "borrow" | "repay", symbol?: string) {
  window.dispatchEvent(
    new CustomEvent("borrowdesk:ticket", { detail: { tab, symbol } }),
  );
  window.dispatchEvent(
    new CustomEvent("borrowdesk:desk", { detail: { desk: "borrow" } }),
  );
  document
    .getElementById("ticket")
    ?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function goDesk(desk: string) {
  window.dispatchEvent(
    new CustomEvent("borrowdesk:desk", { detail: { desk } }),
  );
}

function IconBox({
  children,
  tone = "lime",
}: {
  children: ReactNode;
  tone?: "lime" | "ok" | "warn" | "muted";
}) {
  const tones = {
    lime: "bg-rh-lime/15 text-rh-lime",
    ok: "bg-ok/15 text-ok",
    warn: "bg-warn/15 text-warn",
    muted: "bg-white/10 text-rh-muted",
  };
  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-semibold",
        tones[tone],
      )}
    >
      {children}
    </span>
  );
}

export function CommandPalette() {
  const router = useRouter();
  const tour = useTour();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const close = useCallback(() => {
    setOpen(false);
    setQ("");
    setActive(0);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => {
          if (v) {
            setQ("");
            setActive(0);
            return false;
          }
          setQ("");
          setActive(0);
          return true;
        });
      }
      if (e.key === "Escape") close();
    };
    const onOpen = () => {
      setOpen(true);
      setQ("");
      setActive(0);
    };
    const onClose = () => close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("borrowdesk:command", onOpen);
    window.addEventListener("borrowdesk:command-close", onClose);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("borrowdesk:command", onOpen);
      window.removeEventListener("borrowdesk:command-close", onClose);
    };
  }, [close]);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items: Item[] = useMemo(() => {
    const desks: Item[] = [
      {
        id: "desk-overview",
        label: "Overview",
        hint: "Position health, charts, and credit line",
        group: "Desks",
        keywords: "home dashboard status",
        icon: <IconBox>◈</IconBox>,
        run: () => goDesk("overview"),
      },
      {
        id: "desk-borrow",
        label: "Borrow",
        hint: "Deposit collateral · borrow · repay USDG",
        group: "Desks",
        keywords: "ticket deposit withdraw repay credit",
        icon: <IconBox>↓</IconBox>,
        run: () => openTicket("borrow"),
      },
      {
        id: "desk-fund",
        label: "Fund",
        hint: "Get stock · deposit+borrow · supply USDG",
        group: "Desks",
        keywords: "get stock swap supply batch lp fund",
        icon: <IconBox tone="ok">⇄</IconBox>,
        run: () => goDesk("fund"),
      },
      {
        id: "desk-positions",
        label: "Positions",
        hint: "Collateral book and transaction history",
        group: "Desks",
        keywords: "portfolio holdings",
        icon: <IconBox tone="muted">▣</IconBox>,
        run: () => goDesk("positions"),
      },
      {
        id: "desk-markets",
        label: "Markets",
        hint: "Oracle prices · LTV and liquidation bands",
        group: "Desks",
        keywords: "oracle feeds collateral",
        icon: <IconBox tone="ok">◎</IconBox>,
        run: () => goDesk("markets"),
      },
      {
        id: "desk-protocol",
        label: "Protocol",
        hint: "Idle USDG · debt · utilisation board",
        group: "Desks",
        keywords: "solvency pool util liquidity board",
        icon: <IconBox tone="ok">⬡</IconBox>,
        run: () => goDesk("protocol"),
      },
      {
        id: "desk-risk",
        label: "Risk",
        hint: "Buffers, APR, and liquidation math",
        group: "Desks",
        keywords: "buffer apr",
        icon: <IconBox tone="warn">!</IconBox>,
        run: () => goDesk("risk"),
      },
      {
        id: "desk-lookup",
        label: "Look up",
        hint: "Read-only accountHealth for any address",
        group: "Desks",
        keywords: "lookup inspect walletless proven",
        icon: <IconBox tone="muted">⌕</IconBox>,
        run: () => goDesk("lookup"),
      },
      {
        id: "onboarding",
        label: "Get started",
        hint: "Judge path · ETH → USDG → stock tokens",
        group: "Desks",
        keywords: "onboarding guide eth usdg",
        icon: <IconBox>→</IconBox>,
        run: () => goDesk("onboarding"),
      },
      {
        id: "judge-tour",
        label: "Full guide",
        hint: "Spotlight tour across every desk + verify",
        group: "Desks",
        keywords: "tour demo walkthrough judge deep link guide",
        icon: <IconBox>★</IconBox>,
        run: () => tour.start(),
      },
    ];

    const assets: Item[] = STOCK_TOKENS.map((t) => ({
      id: `asset-${t.symbol}`,
      label: t.symbol,
      hint: `${t.name} · ${t.listedOnMainnet ? "live collateral" : "coming soon"} · ${(t.ltvBps / 100).toFixed(0)}% LTV`,
      group: "Assets" as const,
      logo: t.logo,
      keywords: `${t.name} token stock`,
      run: () => router.push(`/app/${t.symbol.toLowerCase()}`),
    }));

    const actions: Item[] = LISTED_TOKENS.flatMap((t) => [
      {
        id: `dep-${t.symbol}`,
        label: `Deposit ${t.symbol}`,
        hint: `Supply ${t.name} as collateral`,
        group: "Quick actions" as const,
        logo: t.logo,
        keywords: "supply collateral",
        run: () => openTicket("deposit", t.symbol),
      },
      {
        id: `bor-${t.symbol}`,
        label: `Borrow against ${t.symbol}`,
        hint: "Open a USDG credit draw",
        group: "Quick actions" as const,
        logo: t.logo,
        keywords: "usdg loan",
        run: () => openTicket("borrow", t.symbol),
      },
    ]);

    return [...desks, ...assets, ...actions];
  }, [router, tour]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return items.filter(
        (i) =>
          i.group === "Desks" ||
          (i.group === "Assets" && LISTED_TOKENS.some((t) => i.id.endsWith(t.symbol))),
      );
    }
    return items
      .filter((i) => {
        const hay = `${i.label} ${i.hint} ${i.keywords ?? ""}`.toLowerCase();
        return hay.includes(needle);
      })
      .slice(0, 18);
  }, [items, q]);

  useEffect(() => {
    setActive(0);
  }, [q]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(
      `[data-cmd-index="${active}"]`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const runActive = () => {
    const item = filtered[active];
    if (!item) return;
    item.run();
    close();
  };

  const grouped = useMemo(() => {
    const order: Group[] = ["Desks", "Assets", "Quick actions"];
    return order
      .map((group) => ({
        group,
        rows: filtered.filter((i) => i.group === group),
      }))
      .filter((g) => g.rows.length > 0);
  }, [filtered]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setQ("");
          setActive(0);
        }}
        className="fixed bottom-5 right-5 z-[60] hidden h-11 items-center gap-2 rounded-full border border-rh-lime/30 bg-black/95 px-4 text-sm text-white shadow-[0_0_24px_rgba(204,255,0,0.12)] backdrop-blur md:inline-flex hover:border-rh-lime/60"
      >
        <span className="text-rh-lime">⌕</span>
        <span>Search desk</span>
        <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[10px] text-rh-muted">
          ⌘K
        </kbd>
      </button>
    );
  }

  let flatIndex = -1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center bg-black/75 px-4 pt-[10vh] backdrop-blur-md"
      onClick={close}
    >
      <div
        data-tour="search"
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-rh-lime/25 bg-[#0c0c0c] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Search BorrowDesk"
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <span className="text-lg text-rh-lime" aria-hidden>
            ⌕
          </span>
          <input
            ref={inputRef}
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setActive((i) => Math.min(filtered.length - 1, i + 1));
              } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActive((i) => Math.max(0, i - 1));
              } else if (e.key === "Enter") {
                e.preventDefault();
                runActive();
              }
            }}
            placeholder="Search desks, tickers, deposit, borrow…"
            className="h-14 w-full bg-transparent text-[15px] text-white outline-none placeholder:text-rh-dim"
          />
          <kbd className="hidden rounded-md border border-white/10 px-1.5 py-0.5 text-[10px] text-rh-dim sm:inline">
            esc
          </kbd>
        </div>

        <div ref={listRef} className="max-h-[55vh] overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-5 py-10 text-center">
              <p className="text-sm font-medium text-white">No matches</p>
              <p className="mt-1 text-xs text-rh-dim">
                Try NVDA, markets, deposit, or supply
              </p>
            </div>
          )}

          {grouped.map(({ group, rows }) => (
            <div key={group} className="mb-1">
              <div className="px-4 pb-1.5 pt-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-rh-dim">
                {group}
              </div>
              <ul>
                {rows.map((item) => {
                  flatIndex += 1;
                  const index = flatIndex;
                  const selected = index === active;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        data-cmd-index={index}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-left transition",
                          selected
                            ? "bg-rh-lime text-rh-on-lime"
                            : "hover:bg-white/[0.04]",
                        )}
                        onMouseEnter={() => setActive(index)}
                        onClick={() => {
                          item.run();
                          close();
                        }}
                      >
                        {item.logo ? (
                          <span
                            className={cn(
                              "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                              selected ? "bg-rh-on-lime/10" : "bg-white/5",
                            )}
                          >
                            <TokenLogo
                              src={item.logo}
                              symbol={item.label}
                              size={20}
                            />
                          </span>
                        ) : (
                          <span
                            className={
                              selected
                                ? "[&>*]:bg-rh-on-lime/15 [&>*]:text-rh-on-lime"
                                : undefined
                            }
                          >
                            {item.icon}
                          </span>
                        )}
                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              selected ? "text-rh-on-lime" : "text-white",
                            )}
                          >
                            {item.label}
                          </span>
                          <span
                            className={cn(
                              "block truncate text-xs",
                              selected
                                ? "text-rh-on-lime/70"
                                : "text-rh-dim",
                            )}
                          >
                            {item.hint}
                          </span>
                        </span>
                        {selected ? (
                          <span className="shrink-0 text-[10px] font-medium uppercase tracking-wide text-rh-on-lime/70">
                            Enter ↵
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-2.5 text-[11px] text-rh-dim">
          <span>
            <kbd className="rounded border border-white/10 px-1">↑</kbd>{" "}
            <kbd className="rounded border border-white/10 px-1">↓</kbd> navigate
            · <kbd className="rounded border border-white/10 px-1">↵</kbd> open
          </span>
          <span>
            <kbd className="rounded border border-white/10 px-1">esc</kbd> close
          </span>
        </div>
      </div>
    </div>
  );
}
