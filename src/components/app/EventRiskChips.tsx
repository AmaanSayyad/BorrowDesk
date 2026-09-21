"use client";

import { activeEventRisks, allActiveEventRisks, type EventRisk } from "@/lib/eventRisk";

export function EventRiskChips({
  symbol,
  limit,
}: {
  symbol?: string;
  /** Cap chips in dense rails; omit for all */
  limit?: number;
}) {
  const risks = symbol ? activeEventRisks(symbol) : allActiveEventRisks();
  if (risks.length === 0) return null;

  const shown = limit != null ? risks.slice(0, limit) : risks;
  const more = limit != null ? Math.max(0, risks.length - limit) : 0;

  const getKindColor = (kind: EventRisk["kind"]) => {
    if (kind === "earnings") return "bg-warn/15 text-warn border-warn/30";
    if (kind === "macro") return "bg-rh-cyan/15 text-rh-cyan border-rh-cyan/30";
    return "bg-danger/15 text-danger border-danger/30";
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {shown.map((risk, i) => {
        const sym = "symbol" in risk ? String((risk as { symbol?: string }).symbol ?? "") : "";
        return (
          <div
            key={`${sym}-${risk.label}-${i}`}
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${getKindColor(risk.kind)}`}
            title={risk.detail}
          >
            {sym ? <span className="font-medium">{sym}</span> : null}
            <span className="opacity-90">{risk.label.replace(`${sym} `, "")}</span>
          </div>
        );
      })}
      {more > 0 && (
        <span className="inline-flex items-center rounded-full border border-rh-border px-2 py-0.5 text-[10px] text-rh-dim">
          +{more}
        </span>
      )}
    </div>
  );
}
