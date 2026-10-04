"use client";

import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { defineChain } from "@reown/appkit/networks";
import { cookieStorage, createStorage, http } from "wagmi";
import { MAINNET } from "./deployments";

export const REOWN_PROJECT_ID =
  process.env.NEXT_PUBLIC_REOWN_PROJECT_ID ??
  "5543b5c8ab38dd53e8053cc654bd71dd";

const rpcUrl = MAINNET.rpcUrl;

/** AppKit / CAIP network for Robinhood Chain mainnet */
export const robinhoodAppKitChain = defineChain({
  id: MAINNET.chainId,
  caipNetworkId: `eip155:${MAINNET.chainId}`,
  chainNamespace: "eip155",
  name: MAINNET.name,
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: { http: [rpcUrl] },
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: MAINNET.explorer,
    },
  },
});

export const networks = [robinhoodAppKitChain] as [
  typeof robinhoodAppKitChain,
];

export const wagmiAdapter = new WagmiAdapter({
  storage: createStorage({ storage: cookieStorage }),
  ssr: true,
  projectId: REOWN_PROJECT_ID,
  networks,
  transports: {
    [robinhoodAppKitChain.id]: http(rpcUrl),
  },
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
