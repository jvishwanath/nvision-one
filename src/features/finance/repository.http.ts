import { apiClient } from "@/lib/api-client";
import type { CreateTradeInput, Trade, WatchlistEntry } from "./types";

export const tradeHttpRepository = {
  getAll: () => apiClient<Trade[]>("/api/finance/trades"),
  create: (input: CreateTradeInput) =>
    apiClient<Trade>("/api/finance/trades", { method: "POST", body: JSON.stringify(input) }),
  remove: (id: string) => apiClient<void>(`/api/finance/trades/${id}`, { method: "DELETE" }),
  count: async () => (await tradeHttpRepository.getAll()).length,
};

export const watchlistHttpRepository = {
  getAll: () => apiClient<WatchlistEntry[]>("/api/finance/watchlist"),
  add: (symbol: string) =>
    apiClient<WatchlistEntry>("/api/finance/watchlist", { method: "POST", body: JSON.stringify({ symbol }) }),
  remove: (id: string) => apiClient<void>(`/api/finance/watchlist/${id}`, { method: "DELETE" }),
  count: async () => (await watchlistHttpRepository.getAll()).length,
  ensureDefaults: () => apiClient<WatchlistEntry[]>("/api/finance/watchlist"),
};
