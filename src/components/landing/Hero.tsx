"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { CollateralTicker } from "@/components/ui/CollateralTicker";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-black">
      <div className="relative flex min-h-[100svh] flex-col">
        <div className="absolute inset-0 bg-black">
          <video
            className="absolute inset-0 hidden h-full w-full object-cover md:block"
            autoPlay
            muted
            loop
            playsInline
            poster="/brand/home/poster-desktop.jpeg"
          >
            <source src="/brand/home/HPTO_V3-Fade-Desktop.mp4" type="video/mp4" />
          </video>
          <video
            className="absolute inset-0 h-full w-full object-cover md:hidden"
            autoPlay
            muted
            loop
            playsInline
            poster="/brand/home/poster-mobile.jpeg"
          >
            <source src="/brand/home/HPTO_V3-Fade-Mobile.mp4" type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-black/35 to-black/85" />
        </div>

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 pb-10 pt-28 text-center">
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="rh-display mb-4 text-[clamp(2.4rem,7vw,4.25rem)] tracking-tight text-rh-lime"
          >
            BorrowDesk
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mb-5 max-w-4xl text-[clamp(1.45rem,3.4vw,2.15rem)] font-medium leading-snug text-white"
          >
            Keep the stocks. Borrow the dollar.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mb-8 max-w-xl text-base leading-relaxed text-white/70"
          >
            Stock-token USDG credit with liquidation math visible before you
            sign - live on Robinhood Chain.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.18 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link href="/app" className="neon-btn h-12 px-8 text-[0.9375rem]">
              Launch credit line
            </Link>
            <Link href="/#proof" className="ghost-btn h-12 px-7 text-[0.9375rem]">
              See the receipt
            </Link>
          </motion.div>
        </div>

        <div className="relative z-10">
          <CollateralTicker dark />
        </div>
      </div>
    </section>
  );
}
