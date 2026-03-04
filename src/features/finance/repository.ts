import { db } from "@/lib/db";
import type { Trade, CreateTradeInput } from "./types";
import { generateId } from "@/lib/utils";

export const tradeRepository = {
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
        return db.trades.where("symbol").equalsIgnoreCase(symbol).toArray();
    },

    async count(): Promise<number> {
        return db.trades.count();
    },
};
