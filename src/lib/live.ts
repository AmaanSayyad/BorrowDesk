import { parseUnits, formatUnits, type Address } from "viem";
import { MAINNET } from "./deployments";
import { USDG } from "./tokens";

export const MARKET = MAINNET.market as Address;

export function toUsdgUnits(amount: number): bigint {
  return parseUnits(String(amount), USDG.decimals);
}

export function fromUsdgUnits(raw: bigint): number {
  return Number(formatUnits(raw, USDG.decimals));
}

export function toTokenUnits(amount: number, decimals = 18): bigint {
  return parseUnits(String(amount), decimals);
}

export function fromTokenUnits(raw: bigint, decimals = 18): number {
  return Number(formatUnits(raw, decimals));
}

/** accountHealth returns 1e18 USD values */
export function fromUsd1e18(raw: bigint): number {
  return Number(formatUnits(raw, 18));
}
