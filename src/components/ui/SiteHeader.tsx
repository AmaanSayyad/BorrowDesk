"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAccount } from "wagmi";
import { useTour } from "@/components/app/ProductTour";
import { useWalletModal } from "@/hooks/useWalletModal";
import { cn } from "@/lib/utils";

const links = [
  { href: "/#proof", label: "Proof" },
  { href: "/#authority", label: "Authority" },
  { href: "/#simulate", label: "Simulate" },
  { href: "/verify", label: "Verify" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const onApp = pathname?.startsWith("/app");
  const [open, setOpen] = useState(false);
  const { isConnected, address } = useAccount();
  const { openConnect, openAccount } = useWalletModal();
  const tour = useTour();
  const short = address
    ? `${address.slice(0, 4)}…${address.slice(-4)}`
    : "";

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-black">
      <div
        className={cn(
          "flex h-16 items-center justify-between gap-3",
          onApp ? "rh-container-wide" : "rh-container",
        )}
      >
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2.5"
          onClick={() => setOpen(false)}
        >
          <Image
            src="/brand/borrowdesk-mark.jpg"
            alt="BorrowDesk"
            width={28}
            height={28}
            className="rounded-[7px]"
            priority
          />
          <span className="shrink-0 text-[15px] font-medium text-white/90">
            BorrowDesk
          </span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-medium transition",
                "text-rh-muted hover:text-white",
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex shrink-0 items-center gap-2">
          {onApp && (
            <button
              type="button"
              data-tour="search-trigger"
              onClick={() =>
                window.dispatchEvent(new Event("borrowdesk:command"))
              }
              className="hidden h-10 items-center gap-2 rounded-full border border-rh-border px-3.5 text-sm text-rh-muted hover:text-white sm:inline-flex"
              aria-label="Search desks and actions"
              title="Search desks and actions"
            >
              <span>Search</span>
              <kbd className="rounded-md border border-rh-border bg-white/[0.04] px-1.5 py-0.5 text-[10px] font-medium text-rh-dim">
                ⌘K
              </kbd>
            </button>
          )}
          <button
            type="button"
            onClick={() => tour.start()}
            className="hidden h-10 items-center rounded-full px-3.5 text-sm text-rh-muted transition hover:text-white sm:inline-flex"
          >
            Guide
          </button>
          {isConnected ? (
            <button
              type="button"
              onClick={openAccount}
              className="teal-btn hidden h-10 items-center px-4 text-sm sm:inline-flex"
            >
              {short}
            </button>
          ) : (
            <button
              type="button"
              onClick={openConnect}
              className="neon-btn hidden h-10 items-center px-5 text-sm text-rh-on-lime sm:inline-flex"
            >
              Connect
            </button>
          )}
          {!onApp && (
            <Link
              href="/app"
              className="neon-btn hidden h-10 items-center px-5 text-sm md:inline-flex !text-[#110e08]"
              style={{ color: "#110e08" }}
            >
              Launch
            </Link>
          )}
          <button
            type="button"
            aria-label={open ? "Close menu" : "Menu"}
            onClick={() => setOpen((v) => !v)}
            className="flex h-10 w-10 flex-col items-center justify-center gap-1.5 text-white"
          >
            {open ? (
              <span className="text-xl leading-none">×</span>
            ) : (
              <>
                <span className="block h-[2px] w-5 rounded-full bg-white" />
                <span className="block h-[2px] w-5 rounded-full bg-white" />
              </>
            )}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-rh-on-lime/15 bg-rh-lime text-rh-on-lime">
          <nav
            className={cn(
              "flex flex-col py-4",
              onApp ? "rh-container-wide" : "rh-container",
            )}
          >
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="border-b border-rh-on-lime/10 py-3.5 text-[17px] font-medium last:border-0"
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                tour.start();
              }}
              className="mt-3 inline-flex h-12 items-center justify-center rounded-full border border-rh-on-lime/30 text-[17px] font-medium"
            >
              Guide
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                if (isConnected) openAccount();
                else openConnect();
              }}
              className="mt-3 inline-flex h-12 items-center justify-center rounded-full border border-rh-on-lime/30 text-[17px] font-medium"
            >
              {isConnected ? short : "Connect wallet"}
            </button>
            {!onApp && (
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="mt-3 inline-flex h-12 items-center justify-center rounded-full bg-black text-[17px] font-medium !text-white"
                style={{ color: "#ffffff" }}
              >
                Launch app
              </Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
