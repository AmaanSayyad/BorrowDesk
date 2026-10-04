export type EventRiskKind = "earnings" | "macro" | "vol";

export type EventRisk = {
  label: string;
  kind: EventRiskKind;
  detail: string;
  until: string;
};

export const EVENT_RISKS: Record<string, EventRisk> = {
  NVDA: {
    label: "NVDA Earnings",
    kind: "earnings",
    detail: "Q4 2026 earnings expected",
    until: "2026-10-15",
  },
  TSLA: {
    label: "TSLA Delivery",
    kind: "earnings",
    detail: "Q3 delivery numbers due",
    until: "2026-10-08",
  },
  META: {
    label: "META Earnings",
    kind: "earnings",
    detail: "Q3 2026 earnings report",
    until: "2026-10-20",
  },
  GOOGL: {
    label: "GOOGL Earnings",
    kind: "earnings",
    detail: "Q3 2026 earnings expected",
    until: "2026-10-22",
  },
  AMZN: {
    label: "AMZN Earnings",
    kind: "earnings",
    detail: "Q3 2026 earnings report",
    until: "2026-10-25",
  },
  COIN: {
    label: "COIN Earnings",
    kind: "earnings",
    detail: "Q3 2026 results",
    until: "2026-10-18",
  },
  MSTR: {
    label: "MSTR Vol",
    kind: "vol",
    detail: "High implied volatility period",
    until: "2026-10-10",
  },
  GME: {
    label: "GME Vol",
    kind: "vol",
    detail: "Elevated social sentiment",
    until: "2026-10-31",
  },
  SPY: {
    label: "FOMC Meeting",
    kind: "macro",
    detail: "Fed rate decision expected",
    until: "2026-10-28",
  },
  QQQ: {
    label: "FOMC Meeting",
    kind: "macro",
    detail: "Fed rate decision expected",
    until: "2026-10-28",
  },
};

export function activeEventRisks(symbol?: string): EventRisk[] {
  const today = "2026-10-04";
  const risks = symbol ? [EVENT_RISKS[symbol]].filter(Boolean) : Object.values(EVENT_RISKS);
  return risks.filter((r) => r.until >= today);
}

export function allActiveEventRisks(): Array<EventRisk & { symbol: string }> {
  const today = "2026-10-04";
  return Object.entries(EVENT_RISKS)
    .filter(([, risk]) => risk.until >= today)
    .map(([symbol, risk]) => ({ ...risk, symbol }));
}
