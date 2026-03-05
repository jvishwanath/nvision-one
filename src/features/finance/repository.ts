import { db } from "@/lib/db";
import type { Trade, CreateTradeInput, WatchlistEntry } from "./types";
import { generateId } from "@/lib/utils";
import { tradeHttpRepository, watchlistHttpRepository } from "./repository.http";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"] as const;

const tradeLocalRepository = {
    async getAll(): Promise<Trade[]> {
        return db.trades.orderBy("timestamp").reverse().toArray();
    },

    async create(input: CreateTradeInput): Promise<Trade> {
        const trade: Trade = {
            ...input,
            id: generateId(),
            timestamp: new Date().toISOString(),
        };
        await db.trades.add(trade);
        return trade;
    },

    async remove(id: string): Promise<void> {
        await db.trades.delete(id);
    },

    async getBySymbol(symbol: string): Promise<Trade[]> {
        const normalized = symbol.toUpperCase();
        return db.trades.where("symbol").equals(normalized).toArray();
    },

    async count(): Promise<number> {
        return db.trades.count();
    },
};

const watchlistLocalRepository = {
    async getAll(): Promise<WatchlistEntry[]> {
        return db.watchlist.orderBy("createdAt").toArray();
    },

    async add(symbolInput: string): Promise<WatchlistEntry> {
        const symbol = symbolInput.trim().toUpperCase();
        if (!symbol) {
            throw new Error("Symbol is required");
        }
        const existing = await db.watchlist.where("symbol").equals(symbol).first();
        if (existing) {
            return existing;
        }
        const entry: WatchlistEntry = {
            id: generateId(),
            symbol,
            createdAt: new Date().toISOString(),
        };
        await db.watchlist.add(entry);
        return entry;
    },

    async remove(id: string): Promise<void> {
        await db.watchlist.delete(id);
    },

    async count(): Promise<number> {
        return db.watchlist.count();
    },

    async ensureDefaults(): Promise<WatchlistEntry[]> {
        const count = await db.watchlist.count();
        if (count > 0) {
            return watchlistLocalRepository.getAll();
        }
        const now = Date.now();
        const entries: WatchlistEntry[] = DEFAULT_SYMBOLS.map((symbol, index) => ({
            id: generateId(),
            symbol,
            createdAt: new Date(now + index).toISOString(),
        }));
        await db.watchlist.bulkAdd(entries);
        return entries;
    },
};

const useServerPersistence = process.env.NEXT_PUBLIC_PERSISTENCE !== "local";

export const tradeRepository = useServerPersistence ? tradeHttpRepository : tradeLocalRepository;
export const watchlistRepository = useServerPersistence ? watchlistHttpRepository : watchlistLocalRepository;
