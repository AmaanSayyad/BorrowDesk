"use client";

import { useEffect, useRef } from "react";
import { tradingViewSymbol } from "@/lib/tradingview";

const SRC =
  "https://s3.tradingview.com/external-embedding/embed-widget-mini-symbol-overview.js";

export function TvMiniChart({
  symbol,
  width = 140,
  height = 48,
}: {
  symbol: string;
  width?: number;
  height?: number;
}) {
  const tv = tradingViewSymbol(symbol);
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = host.current;
    if (!root || !tv) return;
    root.innerHTML = "";
    const widget = document.createElement("div");
    widget.className = "tradingview-widget-container__widget";
    const script = document.createElement("script");
    script.src = SRC;
    script.async = true;
    script.type = "text/javascript";
    script.textContent = JSON.stringify({
      symbol: tv,
      width,
      height,
      locale: "en",
      dateRange: "1M",
      colorTheme: "dark",
      isTransparent: true,
      autosize: false,
      chartOnly: true,
      noTimeScale: true,
    });
    root.appendChild(widget);
    root.appendChild(script);
    return () => {
      root.innerHTML = "";
    };
  }, [height, tv, width]);

  if (!tv) return null;

  return (
    <div
      ref={host}
      className="tradingview-widget-container overflow-hidden"
      style={{ width, height }}
    />
  );
}
