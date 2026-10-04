"use client";

import { useCallback, useMemo } from "react";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
  useSwitchChain,
} from "wagmi";
import { erc20Abi, borrowDeskAbi } from "@/lib/abi/borrowdesk";
import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS, USDG, getToken } from "@/lib/tokens";
import {
  fromTokenUnits,
  fromUsd1e18,
  fromUsdgUnits,
  toTokenUnits,
  toUsdgUnits,
} from "@/lib/live";
import { robinhoodChain } from "@/lib/chains";

const market = MAINNET.market;

const emptyMetrics = {
  collateralUsd: 0,
  debtUsd: 0,
  borrowPowerUsd: 0,
  liquidationUsd: 0,
  healthy: true,
  healthFactor: Number.POSITIVE_INFINITY,
  ltv: 0,
};

export function useBorrowDeskLive() {
  const { address, isConnected, chainId } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const { writeContractAsync, data: txHash, isPending, error: writeError } =
    useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  const onRobinhood = chainId === robinhoodChain.id;
  const ready = Boolean(isConnected && address && onRobinhood);

  const health = useReadContract({
    address: market,
    abi: borrowDeskAbi,
    functionName: "accountHealth",
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: ready, refetchInterval: 15_000 },
  });

  const debtRaw = useReadContract({
    address: market,
    abi: borrowDeskAbi,
    functionName: "debtOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: ready, refetchInterval: 15_000 },
  });

  const liquidityRaw = useReadContract({
    address: market,
    abi: borrowDeskAbi,
    functionName: "totalUsdgLiquidity",
    chainId: robinhoodChain.id,
    query: { refetchInterval: 20_000 },
  });

  const totalDebtRaw = useReadContract({
    address: market,
    abi: borrowDeskAbi,
    functionName: "totalDebt",
    chainId: robinhoodChain.id,
    query: { refetchInterval: 20_000 },
  });

  const usdgBal = useReadContract({
    address: USDG.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    chainId: robinhoodChain.id,
    query: { enabled: ready, refetchInterval: 15_000 },
  });

  const collateralReads = useReadContracts({
    contracts: LISTED_TOKENS.flatMap((token) => [
      {
        address: market,
        abi: borrowDeskAbi,
        functionName: "collateralBalance" as const,
        args: address ? ([address, token.address] as const) : undefined,
        chainId: robinhoodChain.id,
      },
      {
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: address ? ([address] as const) : undefined,
        chainId: robinhoodChain.id,
      },
    ]),
    query: { enabled: ready, refetchInterval: 15_000 },
  });

  const { collateral, walletHoldings } = useMemo(() => {
    const collateralMap: Record<string, number> = {};
    const walletMap: Record<string, number> = {};
    if (!collateralReads.data) {
      return { collateral: collateralMap, walletHoldings: walletMap };
    }

    LISTED_TOKENS.forEach((token, i) => {
      const col = collateralReads.data?.[i * 2];
      const wal = collateralReads.data?.[i * 2 + 1];
      if (col?.status === "success" && typeof col.result === "bigint") {
        collateralMap[token.symbol] = fromTokenUnits(col.result);
      }
      if (wal?.status === "success" && typeof wal.result === "bigint") {
        walletMap[token.symbol] = fromTokenUnits(wal.result);
      }
    });
    return { collateral: collateralMap, walletHoldings: walletMap };
  }, [collateralReads.data]);

  const ensureChain = useCallback(async () => {
    if (chainId !== robinhoodChain.id) {
      await switchChain({ chainId: robinhoodChain.id });
    }
  }, [chainId, switchChain]);

  const approveAndDeposit = useCallback(
    async (symbol: string, amount: number) => {
      if (!address) throw new Error("Connect wallet");
      const token = getToken(symbol);
      if (!token) throw new Error("Unknown token");
      await ensureChain();
      const units = toTokenUnits(amount, 18);
      await writeContractAsync({
        chainId: robinhoodChain.id,
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [market, units],
      });
      return writeContractAsync({
        chainId: robinhoodChain.id,
        address: market,
        abi: borrowDeskAbi,
        functionName: "deposit",
        args: [token.address, units],
      });
    },
    [address, ensureChain, writeContractAsync],
  );

  const withdraw = useCallback(
    async (symbol: string, amount: number) => {
      if (!address) throw new Error("Connect wallet");
      const token = getToken(symbol);
      if (!token) throw new Error("Unknown token");
      await ensureChain();
      return writeContractAsync({
        chainId: robinhoodChain.id,
        address: market,
        abi: borrowDeskAbi,
        functionName: "withdraw",
        args: [token.address, toTokenUnits(amount, 18)],
      });
    },
    [address, ensureChain, writeContractAsync],
  );

  const borrow = useCallback(
    async (amount: number) => {
      if (!address) throw new Error("Connect wallet");
      await ensureChain();
      return writeContractAsync({
        chainId: robinhoodChain.id,
        address: market,
        abi: borrowDeskAbi,
        functionName: "borrow",
        args: [toUsdgUnits(amount)],
      });
    },
    [address, ensureChain, writeContractAsync],
  );

  const repay = useCallback(
    async (amount: number) => {
      if (!address) throw new Error("Connect wallet");
      await ensureChain();
      const units = toUsdgUnits(amount);
      await writeContractAsync({
        chainId: robinhoodChain.id,
        address: USDG.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [market, units],
      });
      return writeContractAsync({
        chainId: robinhoodChain.id,
        address: market,
        abi: borrowDeskAbi,
        functionName: "repay",
        args: [units],
      });
    },
    [address, ensureChain, writeContractAsync],
  );

  const liquidate = useCallback(
    async (borrower: `0x${string}`, symbol: string, repayAmount: number) => {
      if (!address) throw new Error("Connect wallet");
      const token = getToken(symbol);
      if (!token) throw new Error("Unknown token");
      await ensureChain();
      const units = toUsdgUnits(repayAmount);
      await writeContractAsync({
        chainId: robinhoodChain.id,
        address: USDG.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [market, units],
      });
      return writeContractAsync({
        chainId: robinhoodChain.id,
        address: market,
        abi: borrowDeskAbi,
        functionName: "liquidate",
        args: [borrower, token.address, units],
      });
    },
    [address, ensureChain, writeContractAsync],
  );

  const liveMetrics = useMemo(() => {
    const h = health.data;
    if (!h) return emptyMetrics;
    const [collateralUsd, debtUsd, borrowingPowerUsd, liquidationUsd, healthy] =
      h;
    const debt = Number(debtUsd) > 0 ? fromUsd1e18(debtUsd) : 0;
    const collat = fromUsd1e18(collateralUsd);
    return {
      collateralUsd: collat,
      debtUsd: debt,
      borrowPowerUsd: fromUsd1e18(borrowingPowerUsd),
      liquidationUsd: fromUsd1e18(liquidationUsd),
      healthy,
      healthFactor:
        debt <= 0
          ? Number.POSITIVE_INFINITY
          : fromUsd1e18(liquidationUsd) / debt,
      ltv: collat > 0 ? debt / collat : 0,
    };
  }, [health.data]);

  return {
    isConnected,
    address,
    chainId,
    onRobinhood,
    ready,
    isPending: isPending || isConfirming || isSwitching,
    txHash,
    isSuccess,
    writeError,
    liveMetrics,
    collateral,
    walletHoldings,
    poolUsdg: liquidityRaw.data != null ? fromUsdgUnits(liquidityRaw.data) : 0,
    protocolDebtUsdg:
      totalDebtRaw.data != null ? fromUsdgUnits(totalDebtRaw.data) : 0,
    walletUsdg: usdgBal.data != null ? fromUsdgUnits(usdgBal.data) : 0,
    debtUsdg: debtRaw.data != null ? fromUsdgUnits(debtRaw.data) : 0,
    approveAndDeposit,
    withdraw,
    borrow,
    repay,
    liquidate,
    switchToRobinhood: () => switchChain({ chainId: robinhoodChain.id }),
    refetch: () => {
      void health.refetch();
      void debtRaw.refetch();
      void liquidityRaw.refetch();
      void totalDebtRaw.refetch();
      void usdgBal.refetch();
      void collateralReads.refetch();
    },
  };
}
