"use client";

import { useCallback, useState } from "react";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { erc20Abi, borrowDeskAbi } from "@/lib/abi/borrowdesk";
import { MAINNET } from "@/lib/deployments";
import { LISTED_TOKENS, USDG, getToken } from "@/lib/tokens";
import { toTokenUnits, toUsdgUnits } from "@/lib/live";
import { robinhoodChain } from "@/lib/chains";
import {
  RH_DEX,
  swapRouter02Abi,
  uniswapV3FactoryAbi,
  uniswapV3PoolAbi,
} from "@/lib/dex";

export function useSwapDeposit() {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: robinhoodChain.id });
  const { writeContractAsync } = useWriteContract();
  const [isPending, setIsPending] = useState(false);

  const findBestPool = useCallback(
    async (tokenOut: `0x${string}`) => {
      if (!publicClient) throw new Error("No client");
      const pools = await Promise.all(
        RH_DEX.fees.map(async (fee) => {
          try {
            const pool = await publicClient.readContract({
              address: RH_DEX.factory,
              abi: uniswapV3FactoryAbi,
              functionName: "getPool",
              args: [USDG.address, tokenOut, fee],
            });
            if (pool === "0x0000000000000000000000000000000000000000") return null;
            const liquidity = await publicClient.readContract({
              address: pool,
              abi: uniswapV3PoolAbi,
              functionName: "liquidity",
            });
            return { fee, liquidity: Number(liquidity) };
          } catch {
            return null;
          }
        }),
      );
      const valid = pools.filter((p) => p !== null) as Array<{ fee: number; liquidity: number }>;
      if (valid.length === 0) throw new Error("No pool found");
      valid.sort((a, b) => b.liquidity - a.liquidity);
      return valid[0].fee;
    },
    [publicClient],
  );

  const quoteSwap = useCallback(
    async (symbol: string, usdgAmount: number) => {
      const token = getToken(symbol);
      if (!token || !publicClient) throw new Error("Invalid token or client");
      const fee = await findBestPool(token.address);
      const amountIn = toUsdgUnits(usdgAmount);
      try {
        const result = await publicClient.simulateContract({
          address: RH_DEX.router,
          abi: swapRouter02Abi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: USDG.address,
              tokenOut: token.address,
              fee,
              recipient: address ?? "0x0000000000000000000000000000000000000000",
              amountIn,
              amountOutMinimum: BigInt(0),
              sqrtPriceLimitX96: BigInt(0),
            },
          ],
        });
        const amountOut = Number(result.result) / 1e18;
        return { amountOut, fee, amountOutRaw: result.result };
      } catch (e) {
        console.error("Quote error:", e);
        const fallback = usdgAmount / token.fallbackPrice;
        return { amountOut: fallback, fee, amountOutRaw: toTokenUnits(fallback, 18) };
      }
    },
    [publicClient, address, findBestPool],
  );

  const swapAndDeposit = useCallback(
    async (symbol: string, usdgAmount: number) => {
      if (!address) throw new Error("Connect wallet");
      const token = getToken(symbol);
      if (!token) throw new Error("Unknown token");
      setIsPending(true);
      try {
        const fee = await findBestPool(token.address);
        const amountIn = toUsdgUnits(usdgAmount);
        const minOut = toTokenUnits((usdgAmount / token.fallbackPrice) * 0.95, 18);

        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: USDG.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [RH_DEX.router, amountIn],
        });

        const swapResult = await writeContractAsync({
          chainId: robinhoodChain.id,
          address: RH_DEX.router,
          abi: swapRouter02Abi,
          functionName: "exactInputSingle",
          args: [
            {
              tokenIn: USDG.address,
              tokenOut: token.address,
              fee,
              recipient: address,
              amountIn,
              amountOutMinimum: minOut,
              sqrtPriceLimitX96: BigInt(0),
            },
          ],
        });

        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: token.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [MAINNET.market, BigInt(2 ** 256 - 1)],
        });

        await writeContractAsync({
          chainId: robinhoodChain.id,
          address: MAINNET.market,
          abi: borrowDeskAbi,
          functionName: "deposit",
          args: [token.address, minOut],
        });

        return swapResult;
      } finally {
        setIsPending(false);
      }
    },
    [address, findBestPool, writeContractAsync],
  );

  return {
    quoteSwap,
    swapAndDeposit,
    isPending,
  };
}
