import { NextResponse } from "next/server";
import { createPublicClient, http, formatUnits } from "viem";
import { borrowDeskAbi } from "@/lib/abi/borrowdesk";
import { MAINNET } from "@/lib/deployments";
import { robinhoodChain } from "@/lib/chains";
import { USDG } from "@/lib/tokens";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const client = createPublicClient({
  chain: robinhoodChain,
  transport: http(MAINNET.rpcUrl, { timeout: 12_000 }),
});

export async function GET() {
  try {
    const [liquidity, totalDebt] = await Promise.all([
      client.readContract({
        address: MAINNET.market,
        abi: borrowDeskAbi,
        functionName: "totalUsdgLiquidity",
      }),
      client.readContract({
        address: MAINNET.market,
        abi: [
          {
            type: "function",
            name: "totalDebt",
            stateMutability: "view",
            inputs: [],
            outputs: [{ type: "uint256" }],
          },
        ] as const,
        functionName: "totalDebt",
      }).catch(() => BigInt(0)),
    ]);

    return NextResponse.json({
      market: MAINNET.market,
      poolUsdg: Number(formatUnits(liquidity, USDG.decimals)),
      poolUsdgRaw: liquidity.toString(),
      totalDebtUsdg: Number(formatUnits(totalDebt, USDG.decimals)),
      updatedAt: Date.now(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to read pool",
        market: MAINNET.market,
        poolUsdg: 0,
      },
      { status: 502 },
    );
  }
}
