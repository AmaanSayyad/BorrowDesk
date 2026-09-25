"use client";

import { useEffect, useRef, useState } from "react";
import {
  TradingViewCredit,
  TradingViewEmbed,
} from "@/components/charts/TradingViewEmbed";
import {
  TV_WATCHLIST,
  tradingViewHref,
  tradingViewSymbol,
} from "@/lib/tradingview";

const ADVANCED =
  "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
const CHART_RATIO = 0.62;

export function PriceChart({ symbol }: { symbol: string }) {
  const tv = tradingViewSymbol(symbol);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 960, height: 480 });

  useEffect(() => {
    const node = box.current;
    if (!node) return;
    const measure = (target: HTMLDivElement) => {
      const width = Math.max(280, Math.round(target.clientWidth));
      const height = Math.round(
        Math.min(Math.max(320, width * CHART_RATIO), window.innerHeight * 0.72),
      );
      setSize((prev) =>
        Math.abs(prev.width - width) < 4 && Math.abs(prev.height - height) < 4
          ? prev
          : { width, height },
      );
    };
    measure(node);
    const observer = new ResizeObserver(() => measure(node));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  if (!tv) {
    return (
      <div
        ref={box}
        className="grid place-items-center rounded-xl border border-rh-border bg-rh-raised text-sm text-rh-muted"
        style={{ minHeight: size.height }}
      >
        No TradingView symbol for {symbol}
      </div>
    );
  }

  return (
    <div ref={box} className="w-full" style={{ minHeight: size.height }}>
      <TradingViewEmbed
        src={ADVANCED}
        width={size.width}
        height={size.height}
        className="overflow-hidden rounded-xl border border-rh-border"
        config={{
          symbol: tv,
          interval: "D",
          timezone: "Etc/UTC",
          theme: "dark",
          style: "1",
          locale: "en",
          backgroundColor: "rgba(0, 0, 0, 1)",
          gridColor: "rgba(42, 42, 42, 0.6)",
          hide_top_toolbar: false,
          hide_side_toolbar: false,
          hide_legend: false,
          hide_volume: false,
          allow_symbol_change: true,
          save_image: true,
          withdateranges: true,
          details: true,
          hotlist: false,
          calendar: false,
          watchlist: TV_WATCHLIST,
          studies: ["STD;RSI"],
          show_popup_button: true,
          popup_width: "1400",
          popup_height: "900",
          support_host: "https://www.tradingview.com",
        }}
      />
      <TradingViewCredit symbol={symbol} href={tradingViewHref(tv)} />
    </div>
  );
}

export function TradingViewTicker({ height = 46 }: { height?: number }) {
  return (
    <TradingViewEmbed
      src="https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js"
      height={height}
      className="overflow-hidden border-y border-rh-border"
      config={{
        symbols: [
          { proName: "NASDAQ:NVDA", title: "NVDA" },
          { proName: "NASDAQ:AAPL", title: "AAPL" },
          { proName: "NASDAQ:TSLA", title: "TSLA" },
          { proName: "AMEX:SPY", title: "SPY" },
          { proName: "NASDAQ:AMZN", title: "AMZN" },
          { proName: "NASDAQ:MSFT", title: "MSFT" },
          { proName: "NASDAQ:META", title: "META" },
          { proName: "NASDAQ:GOOGL", title: "GOOGL" },
        ],
        showSymbolLogo: true,
        colorTheme: "dark",
        isTransparent: true,
        displayMode: "adaptive",
        locale: "en",
      }}
    />
  );
}
