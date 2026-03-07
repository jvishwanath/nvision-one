import { create } from "zustand";
import type { WatchlistEntry } from "./types";
import { watchlistRepository } from "./repository";
import type { StockQuote } from "@/lib/services";
import { logger } from "@/lib/logger";
import { apiClient } from "@/lib/api-client";

const COMPANY_NAME_FALLBACKS: Record<string, string> = {
    AAPL: "Apple",
    AMZN: "Amazon",
    GOOGL: "Alphabet",
    MSFT: "Microsoft",
    NVDA: "NVIDIA",
    TSLA: "Tesla",
};

function resolveCompanyName(symbol: string, liveName?: string, cachedName?: string) {
    const normalizedSymbol = symbol.trim().toUpperCase();
    const candidate = (liveName ?? cachedName ?? "").trim();
    if (candidate && candidate.toUpperCase() !== normalizedSymbol) {
        return candidate;
    }
    return COMPANY_NAME_FALLBACKS[normalizedSymbol] ?? normalizedSymbol;
}

const QUOTE_CACHE_KEY = "lifeos_watchlist_quotes";

function readCachedQuotes(): WatchlistQuote[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(QUOTE_CACHE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as WatchlistQuote[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export interface WatchlistQuote extends StockQuote {
    id: string;
}

export interface MarketIndex {
    label: string;
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

interface FinanceState {
    loading: boolean;
    refreshing: boolean;
    symbols: WatchlistEntry[];
    quotes: WatchlistQuote[];
    indices: MarketIndex[];
    error: string | null;
    refresh: () => Promise<void>;
    addSymbol: (symbol: string) => Promise<void>;
    removeSymbol: (id: string) => Promise<void>;
}

const INDEX_SYMBOLS = [
    { label: "DOW", symbol: "^DJI" },
    { label: "S&P", symbol: "^GSPC" },
    { label: "NASDAQ", symbol: "^IXIC" },
    { label: "BTC", symbol: "BTC-USD" },
];

const INDICES_CACHE_KEY = "lifeos_market_indices";

function readCachedIndices(): MarketIndex[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(INDICES_CACHE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as MarketIndex[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    loading: false,
    refreshing: false,
    symbols: [],
    quotes: [],
    indices: readCachedIndices(),
    error: null,

    refresh: async () => {
        const hasExisting = get().quotes.length > 0;
        set({ loading: !hasExisting, refreshing: true, error: null });
        try {
            let cachedBySymbol = new Map<string, WatchlistQuote>();
            const existing = get().quotes;
            if (existing.length > 0) {
                cachedBySymbol = new Map(existing.map((quote) => [quote.symbol, quote]));
            } else {
                const parsed = readCachedQuotes();
                cachedBySymbol = new Map(parsed.map((quote) => [quote.symbol, quote]));
            }

            const entries = await watchlistRepository.ensureDefaults();
            if (cachedBySymbol.size > 0) {
                const cachedMerged: WatchlistQuote[] = entries.map((entry) => {
                    const cached = cachedBySymbol.get(entry.symbol);
                    return {
                        id: entry.id,
                        symbol: entry.symbol,
                        name: resolveCompanyName(entry.symbol, undefined, cached?.name),
                        price: cached?.price ?? 0,
                        change: cached?.change ?? 0,
                        changePercent: cached?.changePercent ?? 0,
                        currency: cached?.currency ?? "USD",
                        exchange: cached?.exchange,
                        marketState: cached?.marketState,
                    };
                });

                set({ symbols: entries, quotes: cachedMerged, loading: true, error: null });
            }

            const symbols = entries.map((entry) => entry.symbol);
            const quotes = await apiClient<StockQuote[]>(`/api/finance/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
            const merged: WatchlistQuote[] = entries.map((entry) => {
                const quote = quotes.find((q) => q.symbol === entry.symbol);
                const cached = cachedBySymbol.get(entry.symbol);
                const hasLivePrice = (quote?.price ?? 0) > 0;
                const name = resolveCompanyName(entry.symbol, quote?.name, cached?.name);
                return {
                    id: entry.id,
                    symbol: entry.symbol,
                    name,
                    price: hasLivePrice ? (quote?.price ?? 0) : (cached?.price ?? 0),
                    change: hasLivePrice ? (quote?.change ?? 0) : (cached?.change ?? 0),
                    changePercent: hasLivePrice ? (quote?.changePercent ?? 0) : (cached?.changePercent ?? 0),
                    currency: hasLivePrice ? (quote?.currency ?? "USD") : (cached?.currency ?? quote?.currency ?? "USD"),
                    exchange: quote?.exchange,
                    marketState: quote?.marketState,
                };
            });

            if (typeof window !== "undefined") {
                window.localStorage.setItem(QUOTE_CACHE_KEY, JSON.stringify(merged));
            }

            set({ symbols: entries, quotes: merged, loading: false, refreshing: false, error: null });

            // Fetch market indices in the background
            try {
                const idxSymbols = INDEX_SYMBOLS.map((i) => i.symbol).join(",");
                const idxQuotes = await apiClient<StockQuote[]>(`/api/finance/quotes?symbols=${encodeURIComponent(idxSymbols)}`);
                const idxBySymbol = new Map(idxQuotes.map((q) => [q.symbol.toUpperCase(), q]));
                const indices: MarketIndex[] = INDEX_SYMBOLS.map((idx) => {
                    const q = idxBySymbol.get(idx.symbol.toUpperCase());
                    return {
                        label: idx.label,
                        symbol: idx.symbol,
                        price: q?.price ?? 0,
                        change: q?.change ?? 0,
                        changePercent: q?.changePercent ?? 0,
                    };
                });
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(INDICES_CACHE_KEY, JSON.stringify(indices));
                }
                set({ indices });
            } catch {
                // Indices are best-effort; keep cached values.
            }
        } catch (err) {
            logger.error("Failed to refresh watchlist", err);
            set({ loading: false, refreshing: false, error: err instanceof Error ? err.message : "Unknown error" });
        }
    },

    addSymbol: async (symbol) => {
        try {
            await watchlistRepository.add(symbol);
            await get().refresh();
        } catch (err) {
            logger.error("Failed to add symbol", err);
            set({ error: err instanceof Error ? err.message : "Failed to add symbol" });
        }
    },

    removeSymbol: async (id) => {
        try {
            await watchlistRepository.remove(id);
            set((state) => ({
                symbols: state.symbols.filter((entry) => entry.id !== id),
                quotes: state.quotes.filter((quote) => quote.id !== id),
            }));
        } catch (err) {
            logger.error("Failed to remove symbol", err);
            set({ error: err instanceof Error ? err.message : "Failed to remove symbol" });
        }
    },
}));
