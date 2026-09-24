"use client";

import { useMemo, useRef } from "react";
import { useBorrowDeskLive } from "@/hooks/useBorrowDeskLive";
import { formatUsd } from "@/lib/utils";

export function ShareCard() {
  const live = useBorrowDeskLive();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const shareUrl = useMemo(() => {
    if (typeof window === "undefined" || !live.address) return "";
    return `${window.location.origin}/share?a=${live.address}`;
  }, [live.address]);

  const copyLink = () => {
    if (!shareUrl) return;
    void navigator.clipboard.writeText(shareUrl);
  };

  const downloadCard = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    ctx.fillStyle = "#0a0a0a";
    ctx.fillRect(0, 0, 800, 600);

    ctx.fillStyle = "#ccff00";
    ctx.font = "bold 32px system-ui";
    ctx.fillText("BorrowDesk Position", 40, 60);

    ctx.fillStyle = "#888";
    ctx.font = "14px monospace";
    ctx.fillText(live.address || "", 40, 90);

    ctx.fillStyle = "#fff";
    ctx.font = "20px system-ui";
    ctx.fillText(`Collateral: ${formatUsd(live.liveMetrics.collateralUsd)}`, 40, 150);
    ctx.fillText(`Debt: ${formatUsd(live.liveMetrics.debtUsd)}`, 40, 190);
    ctx.fillText(`LTV: ${(live.liveMetrics.ltv * 100).toFixed(1)}%`, 40, 230);
    ctx.fillText(
      `Health Factor: ${live.liveMetrics.healthFactor.toFixed(2)}`,
      40,
      270
    );
    ctx.fillText(
      `Buffer: ${formatUsd(Math.max(0, live.liveMetrics.liquidationUsd - live.liveMetrics.debtUsd))}`,
      40,
      310
    );

    const assets = Object.entries(live.collateral)
      .filter(([, amt]) => amt > 0)
      .map(([sym, amt]) => `${sym}: ${amt.toFixed(4)}`)
      .join(", ");
    ctx.font = "16px system-ui";
    ctx.fillStyle = "#aaa";
    ctx.fillText(`Assets: ${assets || "None"}`, 40, 360);

    const link = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = link;
    a.download = "borrowdesk-position.png";
    a.click();
  };

  if (!live.ready) {
    return (
      <div className="panel panel-tight rounded-2xl">
        <div className="section-kicker">Share Position</div>
        <p className="mt-3 text-sm text-rh-muted">
          Connect wallet to share your position
        </p>
      </div>
    );
  }

  const buffer = Math.max(
    0,
    live.liveMetrics.liquidationUsd - live.liveMetrics.debtUsd
  );

  return (
    <div className="panel panel-tight rounded-2xl">
      <div className="section-kicker">Share Position</div>
      <h2 className="mt-1 text-xl font-medium text-white">
        Share your BorrowDesk position
      </h2>

      <div className="mt-4 rounded-2xl border border-rh-border bg-black p-4">
        <div className="grid gap-2 text-sm">
          <div className="flex justify-between">
            <span className="text-rh-dim">Collateral</span>
            <span className="font-medium text-white">
              {formatUsd(live.liveMetrics.collateralUsd)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-rh-dim">Debt</span>
            <span className="font-medium text-white">
              {formatUsd(live.liveMetrics.debtUsd)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-rh-dim">LTV</span>
            <span className="font-medium text-rh-lime">
              {(live.liveMetrics.ltv * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-rh-dim">Health Factor</span>
            <span
              className={`font-medium ${
                live.liveMetrics.healthFactor < 1.2
                  ? "text-danger"
                  : live.liveMetrics.healthFactor < 1.5
                    ? "text-warn"
                    : "text-ok"
              }`}
            >
              {live.liveMetrics.healthFactor.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-rh-dim">Buffer</span>
            <span className="font-medium text-white">{formatUsd(buffer)}</span>
          </div>
        </div>

        {Object.entries(live.collateral).filter(([, amt]) => amt > 0).length >
          0 && (
          <div className="mt-3 pt-3 border-t border-rh-border">
            <div className="text-xs text-rh-dim">Assets</div>
            <div className="mt-1 flex flex-wrap gap-2">
              {Object.entries(live.collateral)
                .filter(([, amt]) => amt > 0)
                .map(([sym, amt]) => (
                  <div
                    key={sym}
                    className="chip bg-black text-rh-muted border border-rh-border"
                  >
                    {sym}: {amt.toFixed(4)}
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={copyLink}
          className="ghost-btn h-11 flex-1 text-sm"
        >
          Copy link
        </button>
        <button
          type="button"
          onClick={downloadCard}
          className="ghost-btn h-11 flex-1 text-sm"
        >
          Download PNG
        </button>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
