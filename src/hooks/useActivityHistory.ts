"use client";

import { useEffect, useState } from "react";
import { createPublicClient, formatUnits, http, parseAbiItem } from "viem";
import { useAccount } from "wagmi";
import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS, USDG } from "@/lib/tokens";
import { robinhoodChain } from "@/lib/chains";

export type ActivityItem = {
  id: string;
  type: "Deposit" | "Withdraw" | "Borrow" | "Repay";
  label: string;
  amount: string;
  txHash: `0x${string}`;
  blockNumber: bigint;
};

/** Official RH RPC supports eth_getLogs; dRPC often does not. */
const LOG_RPCS = [
  "https://rpc.mainnet.chain.robinhood.com",
  MAINNET.rpcUrl,
].filter((v, i, a) => Boolean(v) && a.indexOf(v) === i);

const depositEvent = parseAbiItem(
  "event Deposit(address indexed user, address indexed token, uint256 amount)",
);
const withdrawEvent = parseAbiItem(
  "event Withdraw(address indexed user, address indexed token, uint256 amount)",
);
const borrowEvent = parseAbiItem(
  "event Borrow(address indexed user, uint256 amount, uint256 debtAfter)",
);
const repayEvent = parseAbiItem(
  "event Repay(address indexed user, uint256 amount, uint256 debtAfter)",
);

const CHUNK = BigInt(3_000);
const MAX_LOOKBACK = BigInt(120_000);
const TARGET_ITEMS = 40;

type TokenLog = {
  args: { token?: `0x${string}`; amount?: bigint };
  transactionHash: `0x${string}` | null;
  logIndex: number;
  blockNumber: bigint | null;
};

type DebtLog = {
  args: { amount?: bigint };
  transactionHash: `0x${string}` | null;
  logIndex: number;
  blockNumber: bigint | null;
};

function tokenSymbol(addr: string) {
  return (
    LISTED_TOKENS.find(
      (t) => t.address.toLowerCase() === addr.toLowerCase(),
    )?.symbol ?? "TOKEN"
  );
}

function clientFor(rpc: string) {
  return createPublicClient({
    chain: robinhoodChain,
    transport: http(rpc, { timeout: 20_000 }),
  });
}

async function collectLogs(
  client: ReturnType<typeof clientFor>,
  user: `0x${string}`,
) {
  const latest = await client.getBlockNumber();
  const floor = latest > MAX_LOOKBACK ? latest - MAX_LOOKBACK : BigInt(0);

  const deposits: TokenLog[] = [];
  const withdraws: TokenLog[] = [];
  const borrows: DebtLog[] = [];
  const repays: DebtLog[] = [];

  for (let to = latest; to >= floor; to -= CHUNK + BigInt(1)) {
    const from = to >= CHUNK ? to - CHUNK : floor;
    const base = {
      address: MAINNET.market,
      fromBlock: from,
      toBlock: to,
    } as const;

    const [d, w, b, r] = await Promise.all([
      client.getLogs({
        ...base,
        event: depositEvent,
        args: { user },
      }),
      client.getLogs({
        ...base,
        event: withdrawEvent,
        args: { user },
      }),
      client.getLogs({
        ...base,
        event: borrowEvent,
        args: { user },
      }),
      client.getLogs({
        ...base,
        event: repayEvent,
        args: { user },
      }),
    ]);

    deposits.push(...(d as TokenLog[]));
    withdraws.push(...(w as TokenLog[]));
    borrows.push(...(b as DebtLog[]));
    repays.push(...(r as DebtLog[]));

    const total =
      deposits.length + withdraws.length + borrows.length + repays.length;
    if (total >= TARGET_ITEMS) break;
    if (from === floor) break;
  }

  return { deposits, withdraws, borrows, repays };
}

function mapLogs(bundle: Awaited<ReturnType<typeof collectLogs>>): ActivityItem[] {
  const mapped: ActivityItem[] = [];

  for (const log of bundle.deposits) {
    if (!log.args.token || log.args.amount == null || !log.transactionHash)
      continue;
    const sym = tokenSymbol(log.args.token);
    mapped.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      type: "Deposit",
      label: `Deposit ${sym}`,
      amount: `${Number(formatUnits(log.args.amount, 18)).toFixed(6)} ${sym}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber ?? BigInt(0),
    });
  }

  for (const log of bundle.withdraws) {
    if (!log.args.token || log.args.amount == null || !log.transactionHash)
      continue;
    const sym = tokenSymbol(log.args.token);
    mapped.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      type: "Withdraw",
      label: `Withdraw ${sym}`,
      amount: `${Number(formatUnits(log.args.amount, 18)).toFixed(6)} ${sym}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber ?? BigInt(0),
    });
  }

  for (const log of bundle.borrows) {
    if (log.args.amount == null || !log.transactionHash) continue;
    mapped.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      type: "Borrow",
      label: `Borrow ${USDG.symbol}`,
      amount: `${Number(formatUnits(log.args.amount, USDG.decimals)).toFixed(4)} ${USDG.symbol}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber ?? BigInt(0),
    });
  }

  for (const log of bundle.repays) {
    if (log.args.amount == null || !log.transactionHash) continue;
    mapped.push({
      id: `${log.transactionHash}-${log.logIndex}`,
      type: "Repay",
      label: `Repay ${USDG.symbol}`,
      amount: `${Number(formatUnits(log.args.amount, USDG.decimals)).toFixed(4)} ${USDG.symbol}`,
      txHash: log.transactionHash,
      blockNumber: log.blockNumber ?? BigInt(0),
    });
  }

  mapped.sort((a, b) => Number(b.blockNumber - a.blockNumber));
  return mapped.slice(0, TARGET_ITEMS);
}

export function useActivityHistory() {
  const { address } = useAccount();
  const [items, setItems] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) {
      setItems([]);
      setError(null);
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      let lastErr: unknown;
      for (const rpc of LOG_RPCS) {
        try {
          const client = clientFor(rpc);
          const bundle = await collectLogs(client, address);
          const mapped = mapLogs(bundle);
          if (!cancelled) {
            setItems(mapped);
            setError(null);
          }
          lastErr = null;
          break;
        } catch (e) {
          lastErr = e;
        }
      }
      if (lastErr && !cancelled) {
        setItems([]);
        setError("Could not sync prints from RPC");
      }
      if (!cancelled) setLoading(false);
    };

    void load();
    const id = setInterval(() => void load(), 45_000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [address]);

  return { items, loading, error };
}
