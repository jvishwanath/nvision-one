import { z } from "zod";

export const TradeType = z.enum(["buy", "sell"]);
export type TradeType = z.infer<typeof TradeType>;

export const TradeSchema = z.object({
    id: z.string(),
    symbol: z.string().min(1, "Symbol is required"),
    type: TradeType,
    quantity: z.number().positive("Quantity must be positive"),
    price: z.number().positive("Price must be positive"),
    timestamp: z.string(),
});

export type Trade = z.infer<typeof TradeSchema>;

export const CreateTradeSchema = TradeSchema.omit({ id: true, timestamp: true });
export type CreateTradeInput = z.infer<typeof CreateTradeSchema>;

export interface PortfolioPosition {
    symbol: string;
    quantity: number;
    avgCost: number;
    currentPrice: number;
    totalValue: number;
    pnl: number;
    pnlPercent: number;
}

export const WatchlistEntrySchema = z.object({
    id: z.string(),
    symbol: z.string().min(1, "Symbol is required"),
    createdAt: z.string(),
});

export type WatchlistEntry = z.infer<typeof WatchlistEntrySchema>;
