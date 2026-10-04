/** TradingView pro symbols for BorrowDesk Stock Tokens */
const SYMBOLS: Record<string, string> = {
  NVDA: "NASDAQ:NVDA",
  AAPL: "NASDAQ:AAPL",
  TSLA: "NASDAQ:TSLA",
  SPY: "AMEX:SPY",
  AMZN: "NASDAQ:AMZN",
  MSFT: "NASDAQ:MSFT",
  META: "NASDAQ:META",
  GOOGL: "NASDAQ:GOOGL",
  AMD: "NASDAQ:AMD",
  ASML: "NASDAQ:ASML",
  BABA: "NYSE:BABA",
  COIN: "NASDAQ:COIN",
  CRCL: "NYSE:CRCL",
  DELL: "NYSE:DELL",
  GME: "NYSE:GME",
  INTC: "NASDAQ:INTC",
  IONQ: "NYSE:IONQ",
  MSTR: "NASDAQ:MSTR",
  MU: "NASDAQ:MU",
  PLTR: "NASDAQ:PLTR",
  RKLB: "NASDAQ:RKLB",
  SNDK: "NASDAQ:SNDK",
  SPCX: "NASDAQ:SPCX",
  TSM: "NYSE:TSM",
  USAR: "NYSE:USAR",
  QQQ: "NASDAQ:QQQ",
  SLV: "AMEX:SLV",
  USO: "AMEX:USO",
  SGOV: "AMEX:SGOV",
};

export const TV_WATCHLIST = Object.values(SYMBOLS);

export function tradingViewSymbol(symbol: string) {
  return SYMBOLS[symbol.toUpperCase()] ?? null;
}

export function tradingViewHref(tvSymbol: string) {
  return `https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tvSymbol)}`;
}
