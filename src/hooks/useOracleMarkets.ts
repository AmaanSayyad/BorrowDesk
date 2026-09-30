"use client";

import { useMemo } from "react";
import { useReadContracts } from "wagmi";
import { formatUnits } from "viem";
import { chainlinkAbi, borrowDeskAbi } from "@/lib/abi/borrowdesk";
import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS } from "@/lib/tokens";
import { robinhoodChain } from "@/lib/chains";

export type OracleRow = {
  symbol: string;
  name: string;
  logo: string;
  address: `0x${string}`;
  oraclePrice: number;
  apiFallback: number;
  ltvBps: number;
  liqBps: number;
  bonusBps: number;
  listed: boolean;
  updatedAt: number;
};

export function useOracleMarkets() {
  const marketReads = useReadContracts({
    contracts: LISTED_TOKENS.map((token) => ({
      address: MAINNET.market,
      abi: borrowDeskAbi,
      functionName: "markets" as const,
      args: [token.address] as const,
      chainId: robinhoodChain.id,
    })),
    query: { refetchInterval: 30_000 },
  });

  const oracleReads = useReadContracts({
    contracts: LISTED_TOKENS.flatMap((token) => {
      const feed = MAINNET.feeds[token.symbol as keyof typeof MAINNET.feeds] as
        | `0x${string}`
        | undefined;
      if (!feed) return [];
      return [
        {
          address: feed,
          abi: chainlinkAbi,
          functionName: "latestRoundData" as const,
          chainId: robinhoodChain.id,
        },
        {
          address: feed,
          abi: chainlinkAbi,
          functionName: "decimals" as const,
          chainId: robinhoodChain.id,
        },
      ];
    }),
    query: { refetchInterval: 30_000 },
  });

  const rows: OracleRow[] = useMemo(() => {
    return LISTED_TOKENS.map((token, i) => {
      const m = marketReads.data?.[i];
      let ltvBps = token.ltvBps;
      let liqBps = token.liquidationBps;
      let bonusBps = 500;
      let listed = Boolean(token.listedOnMainnet);

      if (m?.status === "success" && m.result) {
        const r = m.result as readonly [
          `0x${string}`,
          number,
          number,
          number,
          boolean,
          number,
        ];
        ltvBps = Number(r[1]);
        liqBps = Number(r[2]);
        bonusBps = Number(r[3]);
        listed = Boolean(r[4]);
      }

      const feedIndex = LISTED_TOKENS.slice(0, i).filter(
        (t) => MAINNET.feeds[t.symbol as keyof typeof MAINNET.feeds],
      ).length;
      const round = oracleReads.data?.[feedIndex * 2];
      const dec = oracleReads.data?.[feedIndex * 2 + 1];

      let oraclePrice = token.fallbackPrice;
      let updatedAt = 0;
      if (
        round?.status === "success" &&
        dec?.status === "success" &&
        round.result &&
        typeof dec.result === "number"
      ) {
        const [, answer, , updated] = round.result as readonly [
          bigint,
          bigint,
          bigint,
          bigint,
          bigint,
        ];
        oraclePrice = Number(formatUnits(answer, dec.result));
        updatedAt = Number(updated) * 1000;
      }

      return {
        symbol: token.symbol,
        name: token.name,
        logo: token.logo,
        address: token.address,
        oraclePrice,
        apiFallback: token.fallbackPrice,
        ltvBps,
        liqBps,
        bonusBps,
        listed,
        updatedAt,
      };
    });
  }, [marketReads.data, oracleReads.data]);

  return { rows, loading: marketReads.isLoading || oracleReads.isLoading };
}
