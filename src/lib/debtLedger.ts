/** Client-side principal tracking for repay receipts (contract keeps principal private). */

const key = (address: string) =>
  `borrowdesk:debt:${address.toLowerCase()}`;

export type DebtLedger = {
  principalUsdg: number;
  openedAt: number;
};

export function readDebtLedger(address?: string | null): DebtLedger | null {
  if (!address || typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key(address));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DebtLedger;
    if (!Number.isFinite(parsed.principalUsdg)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeDebtLedger(address: string, ledger: DebtLedger) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key(address), JSON.stringify(ledger));
}

export function clearDebtLedger(address: string) {
  if (typeof window === "undefined") return;
  localStorage.removeItem(key(address));
}

export function recordBorrow(address: string, amount: number, priorDebt: number) {
  const existing = readDebtLedger(address);
  if (!existing || priorDebt <= 0) {
    writeDebtLedger(address, {
      principalUsdg: amount,
      openedAt: Date.now(),
    });
    return;
  }
  writeDebtLedger(address, {
    principalUsdg: existing.principalUsdg + amount,
    openedAt: existing.openedAt,
  });
}

export function recordRepay(address: string, amount: number, debtAfter: number) {
  if (debtAfter <= 0.000001) {
    clearDebtLedger(address);
    return;
  }
  const existing = readDebtLedger(address);
  if (!existing) return;
  writeDebtLedger(address, {
    principalUsdg: Math.max(0, existing.principalUsdg - amount),
    openedAt: existing.openedAt,
  });
}

export const BORROW_APR = 0.05;

export function interestPerDay(debtUsdg: number) {
  return (debtUsdg * BORROW_APR) / 365;
}

export function estimateRepaySplit(
  repayAmount: number,
  currentDebt: number,
  ledger: DebtLedger | null,
) {
  const debt = Math.max(0, currentDebt);
  const principal = ledger
    ? Math.min(ledger.principalUsdg, debt)
    : debt * 0.98;
  const interest = Math.max(0, debt - principal);
  const interestPortion = Math.min(repayAmount, interest);
  const principalPortion = Math.max(0, repayAmount - interestPortion);
  const daysOpen = ledger
    ? Math.max(0, (Date.now() - ledger.openedAt) / 86_400_000)
    : 0;
  return {
    principalPortion,
    interestPortion,
    daysOpen,
    remainingDebt: Math.max(0, debt - repayAmount),
    interestPerDay: interestPerDay(Math.max(0, debt - repayAmount)),
  };
}
