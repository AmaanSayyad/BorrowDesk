/** Map Solidity custom errors / common wallet failures → one-line UI copy. */
const REASONS: Record<string, string> = {
  NotOwner: "Only the market owner can do that.",
  Reentrancy: "Transaction re-entered the market and was blocked.",
  ZeroAddress: "A zero address was passed.",
  ZeroAmount: "Amount must be greater than zero.",
  MarketNotListed: "That Stock Token is not listed as collateral yet.",
  InvalidParams: "Market parameters are invalid.",
  TransferFailed: "Token transfer failed - check balance and allowance.",
  InsufficientCollateral: "Not enough collateral for that borrow or withdraw.",
  InsufficientLiquidity: "Pool does not have enough idle USDG right now.",
  HealthyPosition: "Account is healthy - cannot liquidate.",
  StaleOracle: "Oracle print is too old. Wait for a fresh equity mark.",
  InvalidOracle: "Oracle returned an invalid price.",
  ExceedsBalance: "Amount exceeds the deposited collateral balance.",
  // ERC-20 / wallet
  ERC20InsufficientBalance: "Wallet balance is too low for this transfer.",
  ERC20InsufficientAllowance: "Approve the market for this token amount first.",
  UserRejected: "You rejected the wallet request.",
};

function extractErrorName(raw: string): string | null {
  // viem: "The contract function \"borrow\" reverted with the following reason: InsufficientLiquidity()"
  const custom =
    raw.match(/Error:\s*([A-Za-z0-9_]+)\(/)?.[1] ||
    raw.match(/reverted with the following reason:\s*([A-Za-z0-9_]+)/i)?.[1] ||
    raw.match(/\b([A-Z][A-Za-z0-9_]+)\(\)/)?.[1];
  if (custom) return custom;

  if (/user rejected|denied transaction|rejected the request/i.test(raw)) {
    return "UserRejected";
  }
  if (/insufficient allowance/i.test(raw)) return "ERC20InsufficientAllowance";
  if (/insufficient balance/i.test(raw)) return "ERC20InsufficientBalance";
  return null;
}

/** Turn a thrown wallet / contract error into short plain English. */
export function explainRevert(err: unknown): string {
  const raw =
    err instanceof Error
      ? `${err.message}\n${(err as Error & { cause?: unknown }).cause ?? ""}`
      : String(err);

  const name = extractErrorName(raw);
  if (name && REASONS[name]) return REASONS[name];

  // Shorten noisy viem dumps
  const short = raw
    .split("\n")[0]
    ?.replace(/^.*?Error:\s*/i, "")
    .slice(0, 180);
  return short || "Transaction failed";
}

export { REASONS };
