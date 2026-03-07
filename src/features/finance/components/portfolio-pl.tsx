"use client";

import { useEffect, useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { tradeRepository } from "../repository";
import { useFinanceStore } from "../store";
import type { Trade } from "../types";

interface Position {
    symbol: string;
    quantity: number;
    avgCost: number;
    totalCost: number;
    currentPrice: number;
    marketValue: number;
    pnl: number;
    pnlPercent: number;
}

export function PortfolioPL() {
    const [trades, setTrades] = useState<Trade[]>([]);
    const [loading, setLoading] = useState(true);
    const quotes = useFinanceStore((s) => s.quotes);

    useEffect(() => {
        (async () => {
            setLoading(true);
            const all = await tradeRepository.getAll();
            setTrades(all);
            setLoading(false);
        })();
    }, []);

    const positions = useMemo(() => {
        const bySymbol = new Map<string, { qty: number; cost: number }>();
        for (const t of trades) {
            const s = t.symbol.toUpperCase();
            const cur = bySymbol.get(s) ?? { qty: 0, cost: 0 };
            if (t.type === "buy") {
                cur.qty += t.quantity;
                cur.cost += t.quantity * t.price;
            } else {
                cur.qty -= t.quantity;
                cur.cost -= t.quantity * t.price;
            }
            bySymbol.set(s, cur);
        }

        const result: Position[] = [];
        bySymbol.forEach((val, symbol) => {
            if (val.qty <= 0) return;
            const q = quotes.find((wq) => wq.symbol.toUpperCase() === symbol);
            const currentPrice = q?.price ?? 0;
            const marketValue = currentPrice * val.qty;
            const avgCost = val.cost / val.qty;
            const pnl = marketValue - val.cost;
            const pnlPercent = val.cost > 0 ? (pnl / val.cost) * 100 : 0;
            result.push({ symbol, quantity: val.qty, avgCost, totalCost: val.cost, currentPrice, marketValue, pnl, pnlPercent });
        });

        return result.sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl));
    }, [trades, quotes]);

    const totalCost = positions.reduce((s, p) => s + p.totalCost, 0);
    const totalValue = positions.reduce((s, p) => s + p.marketValue, 0);
    const totalPnl = totalValue - totalCost;
    const totalPnlPercent = totalCost > 0 ? (totalPnl / totalCost) * 100 : 0;

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (positions.length === 0) {
        return (
            <div className="text-center py-12">
                <p className="text-muted-foreground text-sm">No positions yet</p>
                <p className="text-muted-foreground/60 text-xs mt-1">Log trades to track your portfolio P&L</p>
            </div>
        );
    }

    const isUp = totalPnl >= 0;

    return (
        <div className="space-y-3">
            {/* Summary card */}
            <Card className="border-0 shadow-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Cost</p>
                        <p className="text-sm font-bold tabular-nums">${totalCost.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Value</p>
                        <p className="text-sm font-bold tabular-nums">${totalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                    </div>
                    <div>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">P&L</p>
                        <p className={`text-sm font-bold tabular-nums ${isUp ? "text-emerald-500" : "text-rose-500"}`}>
                            {isUp ? "+" : ""}{totalPnl.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                            <span className="text-[10px] ml-0.5">({isUp ? "+" : ""}{totalPnlPercent.toFixed(1)}%)</span>
                        </p>
                    </div>
                </div>
            </Card>

            {/* Position rows */}
            {positions.map((pos) => {
                const up = pos.pnl >= 0;
                return (
                    <Card key={pos.symbol} className="px-3 py-2">
                        <div className="flex items-center justify-between">
                            <div className="min-w-0">
                                <p className="text-xs font-bold">{pos.symbol}</p>
                                <p className="text-[10px] text-muted-foreground">
                                    {pos.quantity} shares · avg ${pos.avgCost.toFixed(2)}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-semibold tabular-nums">
                                    ${pos.marketValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}
                                </p>
                                <p className={`text-[10px] font-medium tabular-nums ${up ? "text-emerald-500" : "text-rose-500"}`}>
                                    {up ? "+" : ""}{pos.pnl.toFixed(2)} ({up ? "+" : ""}{pos.pnlPercent.toFixed(1)}%)
                                </p>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
