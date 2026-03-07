import { create } from "zustand";
import type { WatchlistEntry } from "./types";
import { watchlistRepository } from "./repository";
import type { StockQuote } from "@/lib/services";
import { logger } from "@/lib/logger";
import { apiClient } from "@/lib/api-client";

const NAME_FALLBACKS: Record<string, string> = {
    AAPL: "Apple", AMZN: "Amazon", GOOGL: "Alphabet", MSFT: "Microsoft", NVDA: "NVIDIA", TSLA: "Tesla",
};

function resolveName(symbol: string, live?: string, cached?: string): string {
    const s = symbol.trim().toUpperCase();
    const candidate = (live ?? cached ?? "").trim();
    if (candidate && candidate.toUpperCase() !== s) return candidate;
    return NAME_FALLBACKS[s] ?? s;
}

const QUOTE_CACHE_KEY = "lifeos_watchlist_quotes";
const INDICES_CACHE_KEY = "lifeos_market_indices";

function readLocalJson<T>(key: string): T[] {
    if (typeof window === "undefined") return [];
    try {
        const raw = window.localStorage.getItem(key);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
}

function writeLocalJson(key: string, data: unknown): void {
    if (typeof window !== "undefined") window.localStorage.setItem(key, JSON.stringify(data));
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

function mergeQuote(entry: WatchlistEntry, live: StockQuote | undefined, cached: WatchlistQuote | undefined): WatchlistQuote {
    const hasLive = (live?.price ?? 0) > 0;
    return {
        id: entry.id,
        symbol: entry.symbol,
        name: resolveName(entry.symbol, live?.name, cached?.name),
        price: hasLive ? (live?.price ?? 0) : (cached?.price ?? 0),
        change: hasLive ? (live?.change ?? 0) : (cached?.change ?? 0),
        changePercent: hasLive ? (live?.changePercent ?? 0) : (cached?.changePercent ?? 0),
        currency: hasLive ? (live?.currency ?? "USD") : (cached?.currency ?? "USD"),
        exchange: live?.exchange ?? cached?.exchange,
        marketState: live?.marketState ?? cached?.marketState,
    };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
    loading: false,
    refreshing: false,
    symbols: [],
    quotes: [],
    indices: readLocalJson<MarketIndex>(INDICES_CACHE_KEY),
    error: null,

    refresh: async () => {
        const hasExisting = get().quotes.length > 0;
        set({ loading: !hasExisting, refreshing: true, error: null });
        try {
            const cached = new Map<string, WatchlistQuote>(
                (hasExisting ? get().quotes : readLocalJson<WatchlistQuote>(QUOTE_CACHE_KEY)).map((q) => [q.symbol, q]),
            );

            const entries = await watchlistRepository.ensureDefaults();

            if (cached.size > 0) {
                set({ symbols: entries, quotes: entries.map((e) => mergeQuote(e, undefined, cached.get(e.symbol))) });
            }

            const liveQuotes = await apiClient<StockQuote[]>(`/api/finance/quotes?symbols=${encodeURIComponent(entries.map((e) => e.symbol).join(","))}`);
            const liveMap = new Map(liveQuotes.map((q) => [q.symbol, q]));
            const merged = entries.map((e) => mergeQuote(e, liveMap.get(e.symbol), cached.get(e.symbol)));
            writeLocalJson(QUOTE_CACHE_KEY, merged);
            set({ symbols: entries, quotes: merged, loading: false, refreshing: false });

            try {
                const idxQuotes = await apiClient<StockQuote[]>(`/api/finance/quotes?symbols=${encodeURIComponent(INDEX_SYMBOLS.map((i) => i.symbol).join(","))}`);
                const idxMap = new Map(idxQuotes.map((q) => [q.symbol.toUpperCase(), q]));
                const indices: MarketIndex[] = INDEX_SYMBOLS.map((idx) => {
                    const q = idxMap.get(idx.symbol.toUpperCase());
                    return { label: idx.label, symbol: idx.symbol, price: q?.price ?? 0, change: q?.change ?? 0, changePercent: q?.changePercent ?? 0 };
                });
                writeLocalJson(INDICES_CACHE_KEY, indices);
                set({ indices });
            } catch {
                /* indices are best-effort */
            }
        } catch (err) {
            logger.error("Failed to refresh watchlist", err);
            set({ loading: false, refreshing: false, error: err instanceof Error ? err.message : "Unknown error" });
        }
    },

    addSymbol: async (symbol) => {
        await watchlistRepository.add(symbol);
        await get().refresh();
    },

    removeSymbol: async (id) => {
        await watchlistRepository.remove(id);
        set((s) => ({
            symbols: s.symbols.filter((e) => e.id !== id),
            quotes: s.quotes.filter((q) => q.id !== id),
        }));
    },
}));
