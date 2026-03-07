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

export interface StockQuoteDetail extends StockQuote {
    marketCap?: number;
    dayHigh?: number;
    dayLow?: number;
    open?: number;
    previousClose?: number;
    fiftyTwoWeekHigh?: number;
    fiftyTwoWeekLow?: number;
    volume?: number;
    avgVolume?: number;
    peRatio?: number;
    eps?: number;
    dividendYield?: number;
    beta?: number;
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

async function fetchChartData(symbol: string): Promise<Record<string, unknown>> {
    const url = `${CHART_ENDPOINT}/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
    const response = await fetch(url, {
        headers: {
            "Accept": "application/json",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
            "Referer": "https://finance.yahoo.com/",
        },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw new Error(`Chart request failed: ${response.status}`);
    const data = await response.json();
    const result = data?.chart?.result?.[0];
    if (!result) throw new Error(`No chart data for ${symbol}`);
    return result;
}

async function fetchChartQuote(symbol: string): Promise<StockQuote> {
    const result = await fetchChartData(symbol);
    const meta = result.meta as Record<string, unknown> | undefined;
    const price = Number(meta?.regularMarketPrice ?? 0);
    const prevClose = Number(meta?.chartPreviousClose ?? meta?.previousClose ?? price);
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;
    return {
        symbol: (String(meta?.symbol ?? symbol)).toUpperCase(),
        name: String(meta?.longName ?? meta?.shortName ?? symbol),
        price,
        change,
        changePercent,
        currency: String(meta?.currency ?? "USD"),
        exchange: meta?.exchangeName ? String(meta.exchangeName) : meta?.fullExchangeName ? String(meta.fullExchangeName) : undefined,
    };
}

function safeNum(v: unknown): number | undefined {
    if (v === undefined || v === null) return undefined;
    const n = Number(v);
    return isNaN(n) ? undefined : n;
}

async function fetchChartDetail(symbol: string): Promise<StockQuoteDetail> {
    const result = await fetchChartData(symbol);
    const meta = result.meta as Record<string, unknown> | undefined;
    const price = Number(meta?.regularMarketPrice ?? 0);
    const prevClose = Number(meta?.chartPreviousClose ?? meta?.previousClose ?? price);
    const change = price - prevClose;
    const changePercent = prevClose > 0 ? (change / prevClose) * 100 : 0;

    // Extract today's open from OHLCV indicators
    const indicators = result.indicators as Record<string, unknown[]> | undefined;
    const quoteArr = indicators?.quote as Record<string, unknown[]>[] | undefined;
    const ohlcv = quoteArr?.[0];
    const openArr = ohlcv?.open as number[] | undefined;
    const todayOpen = openArr?.[openArr.length - 1];

    const detail: StockQuoteDetail = {
        symbol: (String(meta?.symbol ?? symbol)).toUpperCase(),
        name: String(meta?.longName ?? meta?.shortName ?? symbol),
        price,
        change,
        changePercent,
        currency: String(meta?.currency ?? "USD"),
        exchange: meta?.exchangeName ? String(meta.exchangeName) : meta?.fullExchangeName ? String(meta.fullExchangeName) : undefined,
        dayHigh: safeNum(meta?.regularMarketDayHigh),
        dayLow: safeNum(meta?.regularMarketDayLow),
        open: safeNum(meta?.regularMarketDayOpen ?? meta?.regularMarketOpen ?? todayOpen),
        previousClose: safeNum(meta?.previousClose ?? meta?.chartPreviousClose),
        fiftyTwoWeekHigh: safeNum(meta?.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: safeNum(meta?.fiftyTwoWeekLow),
        volume: safeNum(meta?.regularMarketVolume),
    };

    // Enrich open from Stooq OHLCV for supported symbols
    if (!detail.open && isStooqSupported(symbol)) {
        try {
            const ticker = `${symbol.toLowerCase()}.us`;
            const stooqUrl = `${STOOQ_DAILY_ENDPOINT}?s=${encodeURIComponent(ticker)}&i=d`;
            const stooqResp = await fetch(stooqUrl, {
                headers: { "Accept": "text/csv" },
                signal: AbortSignal.timeout(5000),
            });
            if (stooqResp.ok) {
                const csv = await stooqResp.text();
                const lines = csv.trim().split("\n").filter((l) => l.trim().length > 0);
                if (lines.length >= 2) {
                    const vals = lines[lines.length - 1].split(",").map((v) => v.replace(/^"|"$/g, "").trim());
                    detail.open = detail.open ?? safeNum(vals[1]);
                    detail.avgVolume = detail.avgVolume ?? safeNum(vals[5]);
                }
            }
        } catch {
            // best-effort
        }
    }

    // Try enriching fundamentals via Yahoo (try multiple hosts/endpoints)
    const yahooHeaders = {
        "Accept": "application/json",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com/",
        "Origin": "https://finance.yahoo.com",
    };

    const enrichFromYahooPayload = (payload: Record<string, unknown>) => {
        detail.marketCap = detail.marketCap ?? safeNum(payload.marketCap);
        detail.open = detail.open ?? safeNum(payload.regularMarketOpen);
        detail.avgVolume = detail.avgVolume ?? safeNum(payload.averageDailyVolume3Month ?? payload.averageDailyVolume10Day);
        detail.peRatio = detail.peRatio ?? safeNum(payload.trailingPE ?? payload.forwardPE);
        detail.eps = detail.eps ?? safeNum(payload.epsTrailingTwelveMonths ?? payload.epsForward);
        const divYield = safeNum(payload.trailingAnnualDividendYield ?? payload.dividendYield);
        if (divYield !== undefined && detail.dividendYield === undefined) {
            detail.dividendYield = divYield > 1 ? divYield : divYield * 100;
        }
        detail.beta = detail.beta ?? safeNum(payload.beta);
        detail.marketState = detail.marketState ?? (typeof payload.marketState === "string" ? payload.marketState : undefined);
    };

    const enrichFromV10 = (summaryResult: Record<string, Record<string, unknown>>) => {
        const priceModule = summaryResult.price ?? {};
        const summaryDetail = summaryResult.summaryDetail ?? {};
        const keyStats = summaryResult.defaultKeyStatistics ?? {};
        const raw = (obj: Record<string, unknown>, key: string): number | undefined => {
            const field = obj[key] as Record<string, unknown> | undefined;
            return safeNum(field?.raw);
        };
        detail.marketCap = detail.marketCap ?? raw(priceModule, "marketCap");
        detail.open = detail.open ?? raw(priceModule, "regularMarketOpen");
        detail.volume = detail.volume ?? raw(priceModule, "regularMarketVolume");
        detail.avgVolume = detail.avgVolume ?? raw(summaryDetail, "averageVolume");
        detail.peRatio = detail.peRatio ?? raw(summaryDetail, "trailingPE");
        detail.eps = detail.eps ?? raw(keyStats, "trailingEps");
        const divRaw = raw(summaryDetail, "dividendYield");
        if (divRaw !== undefined && detail.dividendYield === undefined) {
            detail.dividendYield = divRaw > 1 ? divRaw : divRaw * 100;
        }
        detail.beta = detail.beta ?? raw(keyStats, "beta");
    };

    // Try query2 v7 (flat payload, often less blocked)
    try {
        const resp = await fetch(
            `https://query2.finance.yahoo.com/v7/finance/quote?symbols=${encodeURIComponent(symbol)}`,
            { headers: yahooHeaders, signal: AbortSignal.timeout(5000) },
        );
        if (resp.ok) {
            const data = await resp.json();
            const payload = data?.quoteResponse?.result?.[0];
            if (payload) enrichFromYahooPayload(payload);
        }
    } catch { /* best-effort */ }

    // Try query2 v10 if fundamentals still missing
    if (detail.peRatio === undefined || detail.marketCap === undefined) {
        try {
            const modules = "price,summaryDetail,defaultKeyStatistics";
            const resp = await fetch(
                `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=${modules}`,
                { headers: yahooHeaders, signal: AbortSignal.timeout(5000) },
            );
            if (resp.ok) {
                const data = await resp.json();
                const summaryResult = data?.quoteSummary?.result?.[0];
                if (summaryResult) enrichFromV10(summaryResult);
            }
        } catch { /* best-effort */ }
    }

    // Strategy: Scrape Yahoo Finance quote page for embedded JSON data
    if (detail.peRatio === undefined || detail.marketCap === undefined) {
        try {
            const pageResp = await fetch(`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}/`, {
                headers: {
                    "Accept": "text/html,application/xhtml+xml",
                    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
                    "Accept-Language": "en-US,en;q=0.9",
                },
                signal: AbortSignal.timeout(8000),
            });
            if (pageResp.ok) {
                const html = await pageResp.text();
                const jsonMatch = html.match(/root\.App\.main\s*=\s*(\{[\s\S]+?\});\s*\n/)
                    ?? html.match(/"QuoteSummaryStore":([\s\S]+?\}),"}/);

                if (jsonMatch?.[1]) {
                    const blob = JSON.parse(jsonMatch[1]);
                    const store = blob?.context?.dispatcher?.stores?.QuoteSummaryStore
                        ?? blob?.QuoteSummaryStore
                        ?? blob;
                    const priceM = store?.price ?? {};
                    const summaryM = store?.summaryDetail ?? {};
                    const statsM = store?.defaultKeyStatistics ?? {};
                    const rv = (obj: Record<string, unknown>, key: string): number | undefined => {
                        const f = obj[key] as Record<string, unknown> | undefined;
                        return safeNum(f?.raw ?? f);
                    };
                    detail.marketCap = detail.marketCap ?? rv(priceM, "marketCap");
                    detail.peRatio = detail.peRatio ?? rv(summaryM, "trailingPE");
                    detail.eps = detail.eps ?? rv(statsM, "trailingEps");
                    detail.avgVolume = detail.avgVolume ?? rv(summaryM, "averageVolume");
                    const dv = rv(summaryM, "dividendYield");
                    if (dv !== undefined && detail.dividendYield === undefined) {
                        detail.dividendYield = dv > 1 ? dv : dv * 100;
                    }
                    detail.beta = detail.beta ?? rv(statsM, "beta");
                }
            }
        } catch { /* best-effort */ }
    }

    return detail;
}

async function fetchStooqQuote(symbol: string): Promise<StockQuote> {
    if (!isStooqSupported(symbol)) return emptyQuote(symbol);
    const ticker = `${symbol.toLowerCase()}.us`;
    const url = `${STOOQ_DAILY_ENDPOINT}?s=${encodeURIComponent(ticker)}&i=d`;
    const response = await fetch(url, {
        headers: { "Accept": "text/csv" },
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
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
    getDetailedQuote(symbol: string): Promise<StockQuoteDetail>;
    search(query: string): Promise<QuoteSearchResult[]>;
}

const QUOTE_ENDPOINT = "https://query1.finance.yahoo.com/v7/finance/quote";
const QUOTE_SUMMARY_ENDPOINT = "https://query1.finance.yahoo.com/v10/finance/quoteSummary";
const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart";
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

function rawNum(val: unknown): number | undefined {
    if (val === null || val === undefined) return undefined;
    if (typeof val === "number") return val;
    if (typeof val === "object" && val !== null && "raw" in val) return rawNum((val as Record<string, unknown>).raw);
    const n = Number(val);
    return Number.isFinite(n) ? n : undefined;
}

function mapDetailedPayload(payload: any): StockQuoteDetail {
    const base = mapQuotePayload(payload);
    return {
        ...base,
        marketCap: rawNum(payload.marketCap),
        dayHigh: rawNum(payload.regularMarketDayHigh),
        dayLow: rawNum(payload.regularMarketDayLow),
        open: rawNum(payload.regularMarketOpen),
        previousClose: rawNum(payload.regularMarketPreviousClose),
        fiftyTwoWeekHigh: rawNum(payload.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: rawNum(payload.fiftyTwoWeekLow),
        volume: rawNum(payload.regularMarketVolume),
        avgVolume: rawNum(payload.averageDailyVolume3Month),
        peRatio: rawNum(payload.trailingPE),
        eps: rawNum(payload.epsTrailingTwelveMonths),
        dividendYield: rawNum(payload.dividendYield),
        beta: rawNum(payload.beta),
    };
}

function mapSummaryToDetail(symbol: string, result: any): StockQuoteDetail {
    const price = result?.price ?? {};
    const summary = result?.summaryDetail ?? {};
    const stats = result?.defaultKeyStatistics ?? {};

    return {
        symbol: (price.symbol ?? symbol).toUpperCase(),
        name: price.longName ?? price.shortName ?? symbol,
        price: rawNum(price.regularMarketPrice) ?? 0,
        change: rawNum(price.regularMarketChange) ?? 0,
        changePercent: rawNum(price.regularMarketChangePercent) ?? 0,
        currency: price.currency ?? "USD",
        exchange: price.exchangeName ?? price.exchange,
        marketState: price.marketState,
        marketCap: rawNum(price.marketCap),
        dayHigh: rawNum(summary.dayHigh ?? price.regularMarketDayHigh),
        dayLow: rawNum(summary.dayLow ?? price.regularMarketDayLow),
        open: rawNum(summary.open ?? price.regularMarketOpen),
        previousClose: rawNum(summary.previousClose ?? price.regularMarketPreviousClose),
        fiftyTwoWeekHigh: rawNum(summary.fiftyTwoWeekHigh),
        fiftyTwoWeekLow: rawNum(summary.fiftyTwoWeekLow),
        volume: rawNum(summary.volume ?? price.regularMarketVolume),
        avgVolume: rawNum(summary.averageVolume ?? summary.averageDailyVolume3Month),
        peRatio: rawNum(summary.trailingPE ?? stats.trailingPE),
        eps: rawNum(stats.trailingEps),
        dividendYield: rawNum(summary.dividendYield) !== undefined
            ? (rawNum(summary.dividendYield)! * 100)
            : undefined,
        beta: rawNum(stats.beta),
    };
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

let _yahooCrumb: string | null = null;
let _yahooCookie: string | null = null;
let _crumbFetchedAt = 0;
const CRUMB_TTL_MS = 30 * 60 * 1000;

async function getYahooCrumb(): Promise<{ crumb: string; cookie: string } | null> {
    if (_yahooCrumb && _yahooCookie && (Date.now() - _crumbFetchedAt) < CRUMB_TTL_MS) {
        return { crumb: _yahooCrumb, cookie: _yahooCookie };
    }
    try {
        const consentResp = await fetch("https://fc.yahoo.com/", {
            headers: { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" },
            redirect: "manual",
            signal: AbortSignal.timeout(5000),
        });
        const cookies = consentResp.headers.getSetCookie?.() ?? [];
        const cookieStr = cookies.map((c) => c.split(";")[0]).join("; ");
        if (!cookieStr) return null;

        const crumbResp = await fetch("https://query2.finance.yahoo.com/v1/test/getcrumb", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
                "Cookie": cookieStr,
            },
            signal: AbortSignal.timeout(5000),
        });
        if (!crumbResp.ok) return null;
        const crumb = (await crumbResp.text()).trim();
        if (!crumb || crumb.includes("<")) return null;

        _yahooCrumb = crumb;
        _yahooCookie = cookieStr;
        _crumbFetchedAt = Date.now();
        return { crumb, cookie: cookieStr };
    } catch {
        return null;
    }
}

async function fetchJson<T>(url: string): Promise<T> {
    const auth = await getYahooCrumb();
    const separator = url.includes("?") ? "&" : "?";
    const finalUrl = auth ? `${url}${separator}crumb=${encodeURIComponent(auth.crumb)}` : url;
    const headers: Record<string, string> = {
        "Accept": "application/json",
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Referer": "https://finance.yahoo.com/",
        "Origin": "https://finance.yahoo.com",
    };
    if (auth) headers["Cookie"] = auth.cookie;

    const response = await fetch(finalUrl, {
        headers,
        next: { revalidate: 60 },
        signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) {
        throw new Error(`Yahoo Finance request failed: ${response.status}`);
    }
    return response.json() as Promise<T>;
}

export class YahooStockPriceService implements IStockPriceService {
    private _yf: any = null;
    private async getYf2() {
        if (!this._yf) {
            const mod = await import("yahoo-finance2");
            const YF = mod.default;
            this._yf = new YF({ suppressNotices: ["yahooSurvey"] });
        }
        return this._yf;
    }

    async getQuotes(symbols: string[]): Promise<StockQuote[]> {
        if (symbols.length === 0) return [];
        const normalizedSymbols = symbols.map((s) => assertString(s, "symbol"));

        // Strategy 1: yahoo-finance2 package (handles crumb/cookie internally)
        try {
            const yf = await this.getYf2();
            const results: any = await yf.quote(normalizedSymbols);
            const arr: any[] = Array.isArray(results) ? results : [results];
            const bySymbol = new Map<string, StockQuote>();
            for (const r of arr) {
                if (!r || !r.symbol) continue;
                bySymbol.set(r.symbol.toUpperCase(), {
                    symbol: r.symbol,
                    name: r.longName ?? r.shortName ?? r.symbol,
                    price: r.regularMarketPrice ?? 0,
                    change: r.regularMarketChange ?? 0,
                    changePercent: r.regularMarketChangePercent ?? 0,
                    currency: r.currency ?? "USD",
                    exchange: r.fullExchangeName ?? r.exchange,
                    marketState: r.marketState,
                });
            }

            if (bySymbol.size > 0) {
                return normalizedSymbols.map((s) => bySymbol.get(s) ?? emptyQuote(s));
            }
        } catch { /* fall through */ }

        // Strategy 2: Stooq + chart fallback
        try {
            return await Promise.all(
                normalizedSymbols.map(async (symbol) => {
                    if (isStooqSupported(symbol)) {
                        try { return await fetchStooqQuote(symbol); } catch { /* fall through */ }
                    }
                    try { return await fetchChartQuote(symbol); } catch { return emptyQuote(symbol); }
                })
            );
        } catch {
            return normalizedSymbols.map(emptyQuote);
        }
    }

    async getQuote(symbol: string): Promise<StockQuote> {
        const [quote] = await this.getQuotes([symbol]);
        if (!quote) throw new Error(`Quote not found for ${symbol}`);
        return quote;
    }

    async getDetailedQuote(symbol: string): Promise<StockQuoteDetail> {
        const normalized = assertString(symbol, "symbol");

        // Strategy 1: yahoo-finance2 quoteSummary (most detailed, handles auth)
        try {
            const yf = await this.getYf2();
            const result: any = await yf.quoteSummary(normalized, {
                modules: ["price", "summaryDetail", "defaultKeyStatistics"],
            });

            const price: any = result.price;
            const summary: any = result.summaryDetail;
            const stats: any = result.defaultKeyStatistics;

            if (price && (price.regularMarketPrice ?? 0) > 0) {
                const divYieldRaw = rawNum(summary?.dividendYield);
                return {
                    symbol: price.symbol ?? normalized,
                    name: price.longName ?? price.shortName ?? normalized,
                    price: rawNum(price.regularMarketPrice) ?? 0,
                    change: rawNum(price.regularMarketChange) ?? 0,
                    changePercent: rawNum(price.regularMarketChangePercent) ?? 0,
                    currency: price.currency ?? "USD",
                    exchange: price.exchangeName ?? price.exchange,
                    marketState: price.marketState,
                    marketCap: rawNum(price.marketCap),
                    dayHigh: rawNum(summary?.dayHigh ?? price.regularMarketDayHigh),
                    dayLow: rawNum(summary?.dayLow ?? price.regularMarketDayLow),
                    open: rawNum(summary?.open ?? price.regularMarketOpen),
                    previousClose: rawNum(summary?.previousClose ?? price.regularMarketPreviousClose),
                    fiftyTwoWeekHigh: rawNum(summary?.fiftyTwoWeekHigh),
                    fiftyTwoWeekLow: rawNum(summary?.fiftyTwoWeekLow),
                    volume: rawNum(summary?.volume ?? price.regularMarketVolume),
                    avgVolume: rawNum(summary?.averageVolume ?? summary?.averageDailyVolume3Month),
                    peRatio: rawNum(summary?.trailingPE ?? stats?.trailingPE),
                    eps: rawNum(stats?.trailingEps),
                    dividendYield: divYieldRaw !== undefined ? (divYieldRaw > 1 ? divYieldRaw : divYieldRaw * 100) : undefined,
                    beta: rawNum(stats?.beta),
                };
            }
        } catch { /* fall through */ }

        // Strategy 2: yahoo-finance2 quote (flat, less fields but still good)
        try {
            const yf = await this.getYf2();
            const r: any = await yf.quote(normalized);
            if (r && (r.regularMarketPrice ?? 0) > 0) {
                const divYieldRaw = rawNum(r.trailingAnnualDividendYield ?? r.dividendYield);
                return {
                    symbol: r.symbol ?? normalized,
                    name: r.longName ?? r.shortName ?? normalized,
                    price: r.regularMarketPrice ?? 0,
                    change: r.regularMarketChange ?? 0,
                    changePercent: r.regularMarketChangePercent ?? 0,
                    currency: r.currency ?? "USD",
                    exchange: r.fullExchangeName ?? r.exchange,
                    marketState: r.marketState,
                    marketCap: rawNum(r.marketCap),
                    dayHigh: rawNum(r.regularMarketDayHigh),
                    dayLow: rawNum(r.regularMarketDayLow),
                    open: rawNum(r.regularMarketOpen),
                    previousClose: rawNum(r.regularMarketPreviousClose),
                    fiftyTwoWeekHigh: rawNum(r.fiftyTwoWeekHigh),
                    fiftyTwoWeekLow: rawNum(r.fiftyTwoWeekLow),
                    volume: rawNum(r.regularMarketVolume),
                    avgVolume: rawNum(r.averageDailyVolume3Month),
                    peRatio: rawNum(r.trailingPE),
                    eps: rawNum(r.epsTrailingTwelveMonths),
                    dividendYield: divYieldRaw !== undefined ? (divYieldRaw > 1 ? divYieldRaw : divYieldRaw * 100) : undefined,
                    beta: rawNum(r.beta),
                };
            }
        } catch { /* fall through */ }

        // Strategy 3: Yahoo v8 chart (meta has some fields)
        try {
            const detail = await fetchChartDetail(normalized);
            if (detail.price > 0) return detail;
        } catch { /* fall through */ }

        // Strategy 4: Stooq (price-only)
        try {
            return await this.getQuote(symbol);
        } catch {
            return { symbol: normalized, name: normalized, price: 0, change: 0, changePercent: 0, currency: "USD" };
        }
    }

    async search(query: string): Promise<QuoteSearchResult[]> {
        try {
            const yf = await this.getYf2();
            const result: any = await yf.search(query);
            return (result.quotes ?? [])
                .filter((item: any) => item.symbol && (item.longname || item.shortname))
                .map((item: any) => ({
                    symbol: String(item.symbol),
                    name: String(item.longname ?? item.shortname),
                }));
        } catch {
            return [];
        }
    }
}

export const stockPriceService: IStockPriceService = new YahooStockPriceService();
