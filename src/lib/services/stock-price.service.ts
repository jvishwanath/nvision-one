export interface StockQuote {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
}

export interface IStockPriceService {
    getQuote(symbol: string): Promise<StockQuote>;
    search(query: string): Promise<{ symbol: string; name: string }[]>;
}

/** Stub implementation — inject Yahoo Finance or similar API */
export class MockStockPriceService implements IStockPriceService {
    private readonly mockData: Record<string, StockQuote> = {
        AAPL: { symbol: "AAPL", price: 178.72, change: 2.31, changePercent: 1.31 },
        GOOGL: { symbol: "GOOGL", price: 141.8, change: -0.95, changePercent: -0.67 },
        MSFT: { symbol: "MSFT", price: 378.91, change: 4.12, changePercent: 1.1 },
        TSLA: { symbol: "TSLA", price: 248.48, change: -3.22, changePercent: -1.28 },
        AMZN: { symbol: "AMZN", price: 185.07, change: 1.58, changePercent: 0.86 },
    };

    async getQuote(symbol: string): Promise<StockQuote> {
        const upper = symbol.toUpperCase();
        return (
            this.mockData[upper] ?? {
                symbol: upper,
                price: 100 + Math.random() * 100,
                change: (Math.random() - 0.5) * 10,
                changePercent: (Math.random() - 0.5) * 5,
            }
        );
    }

    async search(query: string) {
        const q = query.toUpperCase();
        return Object.keys(this.mockData)
            .filter((s) => s.includes(q))
            .map((s) => ({ symbol: s, name: `${s} Inc.` }));
    }
}

export const stockPriceService: IStockPriceService = new MockStockPriceService();
