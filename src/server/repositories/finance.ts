import { and, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import type { CreateTradeInput, Trade, WatchlistEntry } from "@/features/finance/types";

const DEFAULT_SYMBOLS = ["AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA"] as const;
type TradeRow = ReturnType<typeof getSchema>["trades"]["$inferSelect"];
type WatchlistRow = ReturnType<typeof getSchema>["watchlist"]["$inferSelect"];

function toTrade(row: TradeRow): Trade {
  return { id: row.id, symbol: row.symbol, type: row.type === "sell" ? "sell" : "buy", quantity: row.quantity, price: row.price, timestamp: row.timestamp };
}

function toWatchlistEntry(row: WatchlistRow): WatchlistEntry {
  return { id: row.id, symbol: row.symbol, createdAt: row.createdAt };
}

/* ── Trades ── */

export async function listTrades(userId: string): Promise<Trade[]> {
  const { trades } = getSchema();
  const rows = await db.select().from(trades).where(eq(trades.userId, userId)).orderBy(desc(trades.timestamp));
  return rows.map(toTrade);
}

export async function createTrade(userId: string, input: CreateTradeInput): Promise<Trade> {
  const { trades } = getSchema();
  const row: TradeRow = { id: crypto.randomUUID(), userId, symbol: input.symbol.trim().toUpperCase(), type: input.type, quantity: input.quantity, price: input.price, timestamp: new Date().toISOString() };
  await db.insert(trades).values(row);
  return toTrade(row);
}

export async function deleteTrade(userId: string, id: string): Promise<void> {
  const { trades } = getSchema();
  await db.delete(trades).where(and(eq(trades.id, id), eq(trades.userId, userId)));
}

/* ── Watchlist ── */

export async function listWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const { watchlist } = getSchema();
  const rows = await db.select().from(watchlist).where(eq(watchlist.userId, userId)).orderBy(watchlist.createdAt);
  return rows.map(toWatchlistEntry);
}

export async function addWatchlistSymbol(userId: string, symbolInput: string): Promise<WatchlistEntry> {
  const { watchlist } = getSchema();
  const symbol = symbolInput.trim().toUpperCase();
  if (!symbol) throw new Error("Symbol is required");

  const [existing] = await db.select().from(watchlist).where(and(eq(watchlist.userId, userId), eq(watchlist.symbol, symbol))).limit(1);
  if (existing) return toWatchlistEntry(existing);

  const row: WatchlistRow = { id: crypto.randomUUID(), userId, symbol, createdAt: new Date().toISOString() };
  await db.insert(watchlist).values(row);
  return toWatchlistEntry(row);
}

export async function removeWatchlistSymbol(userId: string, id: string): Promise<void> {
  const { watchlist } = getSchema();
  await db.delete(watchlist).where(and(eq(watchlist.id, id), eq(watchlist.userId, userId)));
}

export async function ensureDefaultWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const { watchlist } = getSchema();
  const current = await listWatchlist(userId);
  if (current.length > 0) return current;

  const now = Date.now();
  const rows: WatchlistRow[] = DEFAULT_SYMBOLS.map((symbol, i) => ({
    id: crypto.randomUUID(), userId, symbol, createdAt: new Date(now + i).toISOString(),
  }));
  await db.insert(watchlist).values(rows);
  return rows.map(toWatchlistEntry);
}
