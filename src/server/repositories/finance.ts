import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { trades, watchlist } from "@/server/db/schema";
import type { CreateTradeInput, Trade, WatchlistEntry } from "@/features/finance/types";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"] as const;
type TradeRow = typeof trades.$inferSelect;
type WatchlistRow = typeof watchlist.$inferSelect;

function toClientTrade(row: TradeRow): Trade {
  const { userId: _userId, ...trade } = row;
  return {
    ...trade,
    type: trade.type === "sell" ? "sell" : "buy",
  };
}

function toClientWatchlist(row: WatchlistRow): WatchlistEntry {
  const { userId: _userId, ...entry } = row;
  return entry;
}

export async function listTrades(userId: string): Promise<Trade[]> {
  const rows = await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.timestamp));
  return rows.map(toClientTrade);
}

export async function createTrade(userId: string, input: CreateTradeInput): Promise<Trade> {
  const created: TradeRow = {
    id: crypto.randomUUID(),
    userId,
    symbol: input.symbol.trim().toUpperCase(),
    type: input.type,
    quantity: input.quantity,
    price: input.price,
    timestamp: new Date().toISOString(),
  };

  await db.insert(trades).values(created);
  return toClientTrade(created);
}

export async function deleteTrade(userId: string, id: string) {
  await db.delete(trades).where(and(eq(trades.userId, userId), eq(trades.id, id)));
}

export async function countTrades(userId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(trades).where(eq(trades.userId, userId));
  return row?.value ?? 0;
}

export async function listWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const rows = await db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(watchlist.createdAt);
  return rows.map(toClientWatchlist);
}

export async function addWatchlistSymbol(userId: string, symbolInput: string): Promise<WatchlistEntry> {
  const symbol = symbolInput.trim().toUpperCase();
  const [existing] = await db
    .select()
    .from(watchlist)
    .where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol)))
    .limit(1);

  if (existing) return existing;

  const created: WatchlistRow = {
    id: crypto.randomUUID(),
    userId,
    symbol,
    createdAt: new Date().toISOString(),
  };
  await db.insert(watchlist).values(created);
  return toClientWatchlist(created);
}

export async function removeWatchlistSymbol(userId: string, id: string) {
  await db.delete(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.id, id)));
}

export async function ensureDefaultWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const current = await listWatchlist(userId);
  if (current.length > 0) return current;

  await Promise.all(DEFAULT_SYMBOLS.map((symbol) => addWatchlistSymbol(userId, symbol)));
  return listWatchlist(userId);
}
