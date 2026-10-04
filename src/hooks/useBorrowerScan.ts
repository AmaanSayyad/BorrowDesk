"use client";

import { useCallback, useState } from "react";
import { createPublicClient, http, parseAbiItem, type Address } from "viem";
import { borrowDeskAbi } from "@/lib/abi/borrowdesk";
import { MAINNET } from "@/lib/deployments";
import { fromUsd1e18, fromUsdgUnits } from "@/lib/live";
import { robinhoodChain } from "@/lib/chains";

export type BorrowerRow = {
  address: Address;
  collateralUsd: number;
  debtUsd: number;
  liquidationUsd: number;
  healthy: boolean;
  healthFactor: number;
};

/** Official RH RPC supports eth_getLogs; dRPC free plan caps ranges. */
const LOG_RPCS = [
  "https://rpc.mainnet.chain.robinhood.com",
  MAINNET.rpcUrl,
].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

const CHUNK = BigInt(3_000);
const MAX_LOOKBACK = BigInt(120_000);
const MAX_BORROWERS = 32;

const borrowEvent = parseAbiItem(
  "event Borrow(address indexed user, uint256 amount, uint256 debtAfter)",
);

function clientFor(rpc: string) {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(rpc, { timeout: 20_000 }),
  });
}

async function collectBorrowers(
  client: ReturnType<typeof clientFor>,
): Promise<Address[]> {
  const latest = await client.getBlockNumber();
  const floor = latest > MAX_LOOKBACK ? latest - MAX_LOOKBACK : BigInt(0);
  const found = new Set<string>();

  // Always include known active accounts
  found.add("0x1881Dfd2b29536F054AA0b0A4966856290388Cc2".toLowerCase());

  for (let to = latest; to >= floor; to -= CHUNK + BigInt(1)) {
    const from = to >= CHUNK ? to - CHUNK : floor;
    const logs = await client.getLogs({
      address: MAINNET.market,
      event: borrowEvent,
      fromBlock: from,
      toBlock: to,
    });
    for (const log of logs) {
      const user = log.args.user;
      if (typeof user === "string") found.add(user.toLowerCase());
    }
    if (found.size >= MAX_BORROWERS) break;
    if (from === floor) break;
  }

  return [...found].slice(0, MAX_BORROWERS) as Address[];
}

export function useBorrowerScan() {
  const [rows, setRows] = useState<BorrowerRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scan = useCallback(async () => {
    setLoading(true);
    setError(null);
    let lastErr: unknown;

    for (const rpc of LOG_RPCS) {
      try {
        const client = clientFor(rpc);
        const unique = await collectBorrowers(client);

        const healths = await Promise.all(
          unique.map((user) =>
            client.readContract({
              address: MAINNET.market,
              abi: borrowDeskAbi,
              functionName: "accountHealth",
              args: [user],
            }),
          ),
        );

        const mapped: BorrowerRow[] = [];
        unique.forEach((user, i) => {
          const [collateralUsd, debtUsd, , liquidationUsd, healthy] = healths[i];
          const debt = fromUsd1e18(debtUsd);
          const liq = fromUsd1e18(liquidationUsd);
          if (debt <= 0) return;
          mapped.push({
            address: user,
            collateralUsd: fromUsd1e18(collateralUsd),
            debtUsd: debt,
            liquidationUsd: liq,
            healthy,
            healthFactor: liq / debt,
          });
        });

        mapped.sort((a, b) => a.healthFactor - b.healthFactor);
        setRows(mapped);
        setError(null);
        lastErr = null;
        break;
      } catch (e) {
        lastErr = e;
      }
    }

    if (lastErr) {
      setError("Could not scan borrowers from RPC - try again");
      setRows([]);
    }
    setLoading(false);
  }, []);

  return { rows, loading, error, scan };
}

export async function fetchAccountSnapshot(user: Address) {
  let lastErr: unknown;
  for (const rpc of LOG_RPCS) {
    try {
      const client = clientFor(rpc);
      const [health, debtRaw] = await Promise.all([
        client.readContract({
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "accountHealth",
          args: [user],
        }),
        client.readContract({
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "debtOf",
          args: [user],
        }),
      ]);
      const [collateralUsd, debtUsd, borrowPowerUsd, liquidationUsd, healthy] =
        health;
      const debt = fromUsd1e18(debtUsd);
      const liq = fromUsd1e18(liquidationUsd);
      return {
        collateralUsd: fromUsd1e18(collateralUsd),
        debtUsd: debt,
        debtUsdg: fromUsdgUnits(debtRaw),
        borrowPowerUsd: fromUsd1e18(borrowPowerUsd),
        liquidationUsd: liq,
        healthy,
        healthFactor: debt <= 0 ? Number.POSITIVE_INFINITY : liq / debt,
      };
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("Snapshot failed");
}
