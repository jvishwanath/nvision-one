export interface StockQuote {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency: string;
    exchange?: string;
    marketState?: string;
}

type StooqRow = {
    Date?: string;
    Open?: string;
    High?: string;
    Low?: string;
    Close?: string;
    Volume?: string;
};

function isStooqSupported(symbol: string): boolean {
    const upper = symbol.trim().toUpperCase();
    return !upper.startsWith("^") && !upper.includes("-");
}

function emptyQuote(symbol: string): StockQuote {
    return { symbol, name: symbol, price: 0, change: 0, changePercent: 0, currency: "USD" };
}

async function fetchStooqQuote(symbol: string): Promise<StockQuote> {
    if (!isStooqSupported(symbol)) return emptyQuote(symbol);
    const ticker = `${symbol.toLowerCase()}.us`;
    const url = `${STOOQ_DAILY_ENDPOINT}?s=${encodeURIComponent(ticker)}&i=d`;
    const response = await fetch(url, {
        headers: { "Accept": "text/csv" },
        next: { revalidate: 60 },
    });

    if (!response.ok) {
        throw new Error(`Stooq request failed: ${response.status}`);
    }

    const text = await response.text();
    const lines = text
        .trim()
        .split("\n")
        .filter((line) => line.trim().length > 0);
    if (lines.length < 2) {
        throw new Error(`No Stooq quote returned for ${symbol}`);
    }

    const parseRow = (line: string): StooqRow => {
        const values = line.split(",").map((value) => value.replace(/^"|"$/g, "").trim());
        return {
            Date: values[0],
            Open: values[1],
            High: values[2],
            Low: values[3],
            Close: values[4],
            Volume: values[5],
        };
    };

    const rows = lines.slice(1).map(parseRow);
    const latestRow = rows[rows.length - 1];
    const previousRow = rows.length > 1 ? rows[rows.length - 2] : undefined;

    const close = Number(latestRow?.Close ?? "NaN");
    const previousClose = Number(previousRow?.Close ?? "NaN");

    if (!Number.isFinite(close) || close <= 0) {
        throw new Error(`Invalid Stooq quote for ${symbol}`);
    }

    const change = Number.isFinite(previousClose) && previousClose > 0 ? close - previousClose : 0;
    const changePercent = Number.isFinite(previousClose) && previousClose > 0
        ? (change / previousClose) * 100
        : 0;

    return {
        symbol,
        name: symbol,
        price: close,
        change,
        changePercent,
        currency: "USD",
        exchange: "STOOQ",
    };
}

function isSymbolOnlyName(name: string | undefined, symbol: string): boolean {
    if (!name) return true;
    return name.trim().toUpperCase() === symbol.trim().toUpperCase();
}

export interface QuoteSearchResult {
    symbol: string;
    name: string;
}

export interface IStockPriceService {
    getQuote(symbol: string): Promise<StockQuote>;
    getQuotes(symbols: string[]): Promise<StockQuote[]>;
    search(query: string): Promise<QuoteSearchResult[]>;
}

const QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const SEARCH_ENDPOINT = "https://query2.finance.yahoo.com/v1/finance/search";
const STOOQ_DAILY_ENDPOINT = "https://stooq.com/q/d/l/";

function assertString(value: string, field: string): string {
    if (typeof value !== "string") {
        throw new Error(`${field} must be a string`);
    }
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error(`${field} cannot be empty`);
    }
    return trimmed.toUpperCase();
}

function mapQuotePayload(payload: any): StockQuote {
    const resolvedName =
        payload.longName ??
        payload.displayName ??
        payload.shortName ??
        payload.longname ??
        payload.shortname ??
        payload.name ??
        payload.symbol ??
        "Unknown";

    return {
        symbol: payload.symbol ?? "",
        name: resolvedName,
        price: Number(payload.regularMarketPrice ?? 0),
        change: Number(payload.regularMarketChange ?? 0),
        changePercent: Number(payload.regularMarketChangePercent ?? 0),
        currency: payload.currency ?? "USD",
        exchange: payload.fullExchangeName ?? payload.exchange,
        marketState: payload.marketState,
    };
}

async function fetchJson<T>(url: string): Promise<T> {
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "Accept-Language": "en-US,en;q=0.9",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
            "Referer": "https://finance.yahoo.com/",
            "Origin": "https://finance.yahoo.com",
        },
        next: { revalidate: 60 },
    });
    if (!response.ok) {
        throw new Error(`Yahoo Finance request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export class YahooStockPriceService implements IStockPriceService {
    async getQuotes(symbols: string[]): Promise<StockQuote[]> {
        if (symbols.length === 0) return [];
        const normalizedSymbols = symbols.map((s) => assertString(s, "symbol"));
        const joined = normalizedSymbols.join(",");

        try {
            const data = await fetchJson<any>(`${QUOTE_ENDPOINT}?symbols=${encodeURIComponent(joined)}`);
            const results = data?.quoteResponse?.result ?? [];
            const yahooQuotes: StockQuote[] = results.map(mapQuotePayload);
            const bySymbol = new Map<string, StockQuote>(
                yahooQuotes.map((quote: StockQuote) => [quote.symbol.toUpperCase(), quote])
            );

            const filled = await Promise.all(
                normalizedSymbols.map(async (symbol) => {
                    const yahoo = bySymbol.get(symbol);
                    if (yahoo) return yahoo;
                    try { return await fetchStooqQuote(symbol); } catch { return emptyQuote(symbol); }
                })
            );

            // Enrich any symbol-only names via Yahoo search
            const enriched = await Promise.all(
                filled.map(async (quote) => {
                    if (!isSymbolOnlyName(quote.name, quote.symbol)) return quote;
                    const name = await this.resolveNameViaSearch(quote.symbol);
                    return name ? { ...quote, name } : quote;
                })
            );

            return enriched;
        } catch {
            const fallback = await Promise.all(
                normalizedSymbols.map(async (symbol) => {
                    try { return await fetchStooqQuote(symbol); } catch { return emptyQuote(symbol); }
                })
            );
            const enriched = await Promise.all(
                fallback.map(async (quote) => {
                    const name = await this.resolveNameViaSearch(quote.symbol);
                    return name ? { ...quote, name } : quote;
                })
            );
            return enriched;
        }
    }

    async getQuote(symbol: string): Promise<StockQuote> {
        const [quote] = await this.getQuotes([symbol]);
        if (!quote) {
            throw new Error(`Quote not found for ${symbol}`);
        }
        return quote;
    }

    async search(query: string): Promise<QuoteSearchResult[]> {
        const normalized = assertString(query, "query");
        const data = await fetchJson<any>(`${SEARCH_ENDPOINT}?q=${encodeURIComponent(normalized)}`);
        const quotes = data?.quotes ?? [];
        return quotes
            .filter((item: any) => item.symbol && (item.longname || item.shortname))
            .map((item: any) => ({
                symbol: item.symbol,
                name: item.longname ?? item.shortname,
            }));
    }

    private async resolveNameViaSearch(symbol: string): Promise<string | null> {
        try {
            const candidates = await this.search(symbol);
            const normalized = symbol.toUpperCase();
            const match =
                candidates.find((c) => c.symbol.toUpperCase() === normalized) ??
                candidates.find((c) => c.symbol.toUpperCase().startsWith(normalized));
            if (match?.name && !isSymbolOnlyName(match.name, symbol)) {
                return match.name;
            }
        } catch {
            // Silent fallback.
        }
        return null;
    }
}

export const stockPriceService: IStockPriceService = new YahooStockPriceService();
