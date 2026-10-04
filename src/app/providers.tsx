"use client";

import { createAppKit } from "@reown/appkit/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { WagmiProvider, type Config } from "wagmi";
import { TourProvider } from "@/components/app/ProductTour";
import {
  networks,
  REOWN_PROJECT_ID,
  robinhoodAppKitChain,
  wagmiAdapter,
  wagmiConfig,
} from "@/lib/wagmi";

createAppKit({
  adapters: [wagmiAdapter],
  projectId: REOWN_PROJECT_ID,
  networks,
  defaultNetwork: robinhoodAppKitChain,
  metadata: {
    name: "BorrowDesk",
    description:
      "Keep your Stock Tokens. Borrow USDG on Robinhood Chain.",
    url: process.env.NEXT_PUBLIC_SITE_URL || "https://borrowdesk.fun",
    icons: ["https://borrowdesk.fun/brand/borrowdesk-mark.jpg"],
  },
  features: {
    analytics: true,
    email: false,
    socials: [],
  },
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ccff00",
    "--w3m-color-mix": "#000000",
    "--w3m-color-mix-strength": 40,
    "--w3m-border-radius-master": "2px",
  },
});

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiConfig as Config}>
      <QueryClientProvider client={queryClient}>
        <TourProvider>{children}</TourProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
