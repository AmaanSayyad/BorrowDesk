export type LtvPreset = "conservative" | "balanced" | "max" | number;

export type DeskPreferences = {
  watchlist: string[];
  ltvPreset: LtvPreset;
};

const STORAGE_KEY = "borrowdesk:prefs";

export function getDeskPrefs(wallet?: `0x${string}`): DeskPreferences {
  if (typeof window === "undefined" || !wallet) {
    return { watchlist: [], ltvPreset: "balanced" };
  }
  try {
    const key = `${STORAGE_KEY}:${wallet.toLowerCase()}`;
    const stored = localStorage.getItem(key);
    if (!stored) return { watchlist: [], ltvPreset: "balanced" };
    return JSON.parse(stored) as DeskPreferences;
  } catch {
    return { watchlist: [], ltvPreset: "balanced" };
  }
}

export function setDeskPrefs(wallet: `0x${string}`, prefs: Partial<DeskPreferences>) {
  if (typeof window === "undefined") return;
  try {
    const key = `${STORAGE_KEY}:${wallet.toLowerCase()}`;
    const current = getDeskPrefs(wallet);
    const updated = { ...current, ...prefs };
    localStorage.setItem(key, JSON.stringify(updated));
  } catch {
    // no-op
  }
}

export function addToWatchlist(wallet: `0x${string}`, symbol: string) {
  const prefs = getDeskPrefs(wallet);
  if (!prefs.watchlist.includes(symbol)) {
    setDeskPrefs(wallet, { watchlist: [...prefs.watchlist, symbol] });
  }
}

export function removeFromWatchlist(wallet: `0x${string}`, symbol: string) {
  const prefs = getDeskPrefs(wallet);
  setDeskPrefs(wallet, { watchlist: prefs.watchlist.filter((s) => s !== symbol) });
}

export function setLtvPreset(wallet: `0x${string}`, preset: LtvPreset) {
  setDeskPrefs(wallet, { ltvPreset: preset });
}

export function getLtvPercent(preset: LtvPreset, maxLtv: number): number {
  if (typeof preset === "number") return Math.min(preset, maxLtv);
  if (preset === "conservative") return Math.min(40, maxLtv);
  if (preset === "balanced") return Math.min(50, maxLtv);
  if (preset === "max") return maxLtv;
  return Math.min(50, maxLtv);
}
