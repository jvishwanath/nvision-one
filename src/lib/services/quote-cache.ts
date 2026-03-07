import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { logger } from "@/lib/logger";
import type { StockQuote, StockQuoteDetail } from "./stock-price.service";

const CACHE_DIR = join(process.cwd(), "data", ".quote-cache");
const QUOTES_FILE = join(CACHE_DIR, "quotes.json");
const DETAILS_FILE = join(CACHE_DIR, "details.json");

const STALE_TTL_MS = 24 * 60 * 60 * 1000; // serve stale data up to 24h old

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function ensureDir() {
  if (!existsSync(CACHE_DIR)) {
    mkdirSync(CACHE_DIR, { recursive: true });
  }
}

function readCache<T>(file: string): Map<string, CacheEntry<T>> {
  try {
    if (!existsSync(file)) return new Map();
    const raw = readFileSync(file, "utf-8");
    const entries: [string, CacheEntry<T>][] = JSON.parse(raw);
    return new Map(entries);
  } catch {
    return new Map();
  }
}

function writeCache<T>(file: string, cache: Map<string, CacheEntry<T>>) {
  try {
    ensureDir();
    writeFileSync(file, JSON.stringify([...cache]), "utf-8");
  } catch (err) {
    logger.warn("Failed to write quote cache", err);
  }
}

// In-memory caches (loaded lazily from disk)
let quotesCache: Map<string, CacheEntry<StockQuote>> | null = null;
let detailsCache: Map<string, CacheEntry<StockQuoteDetail>> | null = null;

function getQuotesCache(): Map<string, CacheEntry<StockQuote>> {
  if (!quotesCache) quotesCache = readCache<StockQuote>(QUOTES_FILE);
  return quotesCache;
}

function getDetailsCache(): Map<string, CacheEntry<StockQuoteDetail>> {
  if (!detailsCache) detailsCache = readCache<StockQuoteDetail>(DETAILS_FILE);
  return detailsCache;
}

export function cacheQuotes(quotes: StockQuote[]) {
  const cache = getQuotesCache();
  const now = Date.now();
  for (const q of quotes) {
    if (q.price > 0) {
      cache.set(q.symbol.toUpperCase(), { data: q, timestamp: now });
    }
  }
  writeCache(QUOTES_FILE, cache);
}

export function getCachedQuotes(symbols: string[]): StockQuote[] | null {
  const cache = getQuotesCache();
  const now = Date.now();
  const results: StockQuote[] = [];
  let hasAny = false;

  for (const sym of symbols) {
    const entry = cache.get(sym.toUpperCase());
    if (entry && (now - entry.timestamp) < STALE_TTL_MS) {
      results.push(entry.data);
      hasAny = true;
    } else {
      results.push({ symbol: sym, name: sym, price: 0, change: 0, changePercent: 0, currency: "USD" });
    }
  }

  return hasAny ? results : null;
}

export function cacheDetail(detail: StockQuoteDetail) {
  if (!detail.symbol || detail.price === 0) return;
  const cache = getDetailsCache();
  cache.set(detail.symbol.toUpperCase(), { data: detail, timestamp: Date.now() });
  writeCache(DETAILS_FILE, cache);
}

export function getCachedDetail(symbol: string): StockQuoteDetail | null {
  const cache = getDetailsCache();
  const entry = cache.get(symbol.toUpperCase());
  if (!entry) return null;
  if ((Date.now() - entry.timestamp) > STALE_TTL_MS) return null;
  return entry.data;
}
