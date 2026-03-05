import { create } from "zustand";
import type { WatchlistEntry } from "./types";
import { watchlistRepository } from "./repository";
import type { StockQuote } from "@/lib/services";
import { logger } from "@/lib/logger";
import { apiClient } from "@/lib/api-client";

const QUOTE_CACHE_KEY = "lifeos_watchlist_quotes";

export interface WatchlistQuote extends StockQuote {
    id: string;
}

interface FinanceState {
    loading: boolean;
    symbols: WatchlistEntry[];
    quotes: WatchlistQuote[];
    error: string | null;
    refresh: () => Promise<void>;
    addSymbol: (symbol: string) => Promise<void>;
    removeSymbol: (id: string) => Promise<void>;
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    loading: false,
    symbols: [],
    quotes: [],
    error: null,

    refresh: async () => {
        set({ loading: true, error: null });
        try {
            let cachedBySymbol = new Map<string, WatchlistQuote>();
            const existing = get().quotes;
            if (existing.length > 0) {
                cachedBySymbol = new Map(existing.map((quote) => [quote.symbol, quote]));
            } else if (typeof window !== "undefined") {
                const raw = window.localStorage.getItem(QUOTE_CACHE_KEY);
                if (raw) {
                    const parsed = JSON.parse(raw) as WatchlistQuote[];
                    cachedBySymbol = new Map(parsed.map((quote) => [quote.symbol, quote]));
                }
            }

            const entries = await watchlistRepository.ensureDefaults();
            const symbols = entries.map((entry) => entry.symbol);
            const quotes = await apiClient<StockQuote[]>(`/api/finance/quotes?symbols=${encodeURIComponent(symbols.join(","))}`);
            const merged: WatchlistQuote[] = entries.map((entry) => {
                const quote = quotes.find((q) => q.symbol === entry.symbol);
                const cached = cachedBySymbol.get(entry.symbol);
                const hasLivePrice = (quote?.price ?? 0) > 0;
                return {
                    id: entry.id,
                    symbol: entry.symbol,
                    name: hasLivePrice ? (quote?.name ?? entry.symbol) : (cached?.name ?? quote?.name ?? entry.symbol),
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

            set({ symbols: entries, quotes: merged, loading: false, error: null });
        } catch (err) {
            logger.error("Failed to refresh watchlist", err);
            set({ loading: false, error: err instanceof Error ? err.message : "Unknown error" });
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
