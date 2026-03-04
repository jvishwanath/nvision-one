import { create } from "zustand";
import type { Trade, CreateTradeInput, PortfolioPosition } from "./types";
import { tradeRepository } from "./repository";
import { stockPriceService } from "@/lib/services";
import { logger } from "@/lib/logger";

interface FinanceState {
    trades: Trade[];
    portfolio: PortfolioPosition[];
    cashBalance: number;
    loading: boolean;
    loadTrades: () => Promise<void>;
    executeTrade: (input: CreateTradeInput) => Promise<boolean>;
    deleteTrade: (id: string) => Promise<void>;
    refreshPortfolio: () => Promise<void>;
}

const INITIAL_CASH = 100_000;

export const useFinanceStore = create<FinanceState>((set, get) => ({
    trades: [],
    portfolio: [],
    cashBalance: INITIAL_CASH,
    loading: false,

    loadTrades: async () => {
        set({ loading: true });
        try {
            const trades = await tradeRepository.getAll();
            set({ trades, loading: false });
            await get().refreshPortfolio();
        } catch (err) {
            logger.error("Failed to load trades", err);
            set({ loading: false });
        }
    },

    executeTrade: async (input) => {
        const { cashBalance, trades } = get();
        const cost = input.price * input.quantity;

        if (input.type === "buy" && cost > cashBalance) {
            logger.warn("Insufficient funds for trade");
            return false;
        }

        if (input.type === "sell") {
            // Check if user has enough shares
            const symbolTrades = trades.filter((t) => t.symbol === input.symbol);
            const held = symbolTrades.reduce(
                (acc, t) => acc + (t.type === "buy" ? t.quantity : -t.quantity),
                0
            );
            if (input.quantity > held) {
                logger.warn("Insufficient shares to sell");
                return false;
            }
        }

        try {
            await tradeRepository.create(input);
            const newBalance =
                input.type === "buy" ? cashBalance - cost : cashBalance + cost;
            set({ cashBalance: newBalance });
            await get().loadTrades();
            return true;
        } catch (err) {
            logger.error("Failed to execute trade", err);
            return false;
        }
    },

    deleteTrade: async (id) => {
        try {
            await tradeRepository.remove(id);
            await get().loadTrades();
        } catch (err) {
            logger.error("Failed to delete trade", err);
        }
    },

    refreshPortfolio: async () => {
        const { trades } = get();
        const posMap = new Map<string, { qty: number; totalCost: number }>();

        for (const t of trades) {
            const existing = posMap.get(t.symbol) ?? { qty: 0, totalCost: 0 };
            if (t.type === "buy") {
                existing.qty += t.quantity;
                existing.totalCost += t.price * t.quantity;
            } else {
                existing.qty -= t.quantity;
                existing.totalCost -= t.price * t.quantity;
            }
            posMap.set(t.symbol, existing);
        }

        const positions: PortfolioPosition[] = [];
        for (const [symbol, pos] of posMap) {
            if (pos.qty <= 0) continue;
            try {
                const quote = await stockPriceService.getQuote(symbol);
                const avgCost = pos.totalCost / pos.qty;
                const totalValue = quote.price * pos.qty;
                const pnl = totalValue - pos.totalCost;
                positions.push({
                    symbol,
                    quantity: pos.qty,
                    avgCost,
                    currentPrice: quote.price,
                    totalValue,
                    pnl,
                    pnlPercent: (pnl / pos.totalCost) * 100,
                });
            } catch (err) {
                logger.error(`Failed to get quote for ${symbol}`, err);
            }
        }

        set({ portfolio: positions });
    },
}));
