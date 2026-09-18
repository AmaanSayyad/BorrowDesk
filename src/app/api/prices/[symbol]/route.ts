import { NextResponse } from "next/server";
import { STOCK_TOKENS } from "@/lib/tokens";

export async function GET(
  _request: Request,
  context: { params: Promise<{ symbol: string }> },
) {
  const { symbol: raw } = await context.params;
  const symbol = raw.toUpperCase();
  const token = STOCK_TOKENS.find((t) => t.symbol === symbol);

  if (!token) {
    return NextResponse.json({ error: "Unknown symbol" }, { status: 404 });
  }

  try {
    const res = await fetch(`https://api.robinhood.com/rhj/prices/${symbol}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 15 },
    });

    if (!res.ok) {
      return NextResponse.json({
        symbol,
        price: token.fallbackPrice,
        source: "fallback",
      });
    }

    const data = await res.json();
    const quote = data.quotes?.[0];
    const bid = Number(quote?.tokenBid ?? quote?.bid);
    const ask = Number(quote?.tokenAsk ?? quote?.ask);
    const mid =
      Number.isFinite(bid) && Number.isFinite(ask)
        ? (bid + ask) / 2
        : token.fallbackPrice;

    return NextResponse.json({
      symbol,
      price: mid,
      bid,
      ask,
      source: "robinhood",
      generatedAt: quote?.generatedAt,
    });
  } catch {
    return NextResponse.json({
      symbol,
      price: token.fallbackPrice,
      source: "fallback",
    });
  }
}
