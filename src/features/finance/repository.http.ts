import { apiClient } from "@/lib/api-client";
import type { CreateTradeInput, Trade, WatchlistEntry } from "./types";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"] as const;

export const tradeHttpRepository = {
  getAll: () => apiClient<Trade[]>("/api/finance/trades"),
  create: (input: CreateTradeInput) =>
    apiClient<Trade>("/api/finance/trades", { method: "POST", body: JSON.stringify(input) }),
  remove: (id: string) => apiClient<void>(`/api/finance/trades/${id}`, { method: "DELETE" }),
  async getBySymbol(symbol: string): Promise<Trade[]> {
    const normalized = symbol.toUpperCase();
    return (await this.getAll()).filter((trade) => trade.symbol === normalized);
  },
  count: async () => (await tradeHttpRepository.getAll()).length,
};

export const watchlistHttpRepository = {
  getAll: () => apiClient<WatchlistEntry[]>("/api/finance/watchlist"),
  add: (symbolInput: string) =>
    apiClient<WatchlistEntry>("/api/finance/watchlist", {
      method: "POST",
      body: JSON.stringify({ symbol: symbolInput }),
    }),
  remove: (id: string) => apiClient<void>(`/api/finance/watchlist/${id}`, { method: "DELETE" }),
  async ensureDefaults(): Promise<WatchlistEntry[]> {
    const existing = await this.getAll();
    if (existing.length > 0) return existing;
    await Promise.all(DEFAULT_SYMBOLS.map((symbol) => this.add(symbol)));
    return this.getAll();
  },
};
