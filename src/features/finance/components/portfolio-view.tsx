"use client";

import { useEffect, useState } from "react";
import { Plus, TrendingUp, TrendingDown, DollarSign } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "../store";
import { TradeForm } from "./trade-form";
import { formatCurrency } from "@/lib/utils";

export function PortfolioView() {
    const { trades, portfolio, cashBalance, loading, loadTrades, executeTrade } =
        useFinanceStore();
    const [formOpen, setFormOpen] = useState(false);

    useEffect(() => {
        loadTrades();
    }, [loadTrades]);

    const totalPortfolioValue = portfolio.reduce((acc, p) => acc + p.totalValue, 0);
    const totalPnl = portfolio.reduce((acc, p) => acc + p.pnl, 0);
    const totalValue = cashBalance + totalPortfolioValue;

    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 gap-3">
                <Card className="gradient-primary text-white border-0">
                    <p className="text-[10px] uppercase tracking-wider opacity-80">Net Worth</p>
                    <p className="text-xl font-bold mt-1">{formatCurrency(totalValue)}</p>
                </Card>
                <Card>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Cash</p>
                    <p className="text-xl font-bold mt-1 flex items-center gap-1">
                        <DollarSign className="h-4 w-4 text-primary" />
                        {formatCurrency(cashBalance)}
                    </p>
                </Card>
            </div>

            {/* Total P&L */}
            {portfolio.length > 0 && (
                <Card>
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Total P&L</span>
                        <span className={`text-sm font-bold flex items-center gap-1 ${totalPnl >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {totalPnl >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                            {formatCurrency(totalPnl)}
                        </span>
                    </div>
                </Card>
            )}

            {/* Positions */}
            <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Positions
                </h3>
                {portfolio.length === 0 ? (
                    <Card>
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No positions yet — execute a trade to start
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {portfolio.map((pos) => (
                            <Card key={pos.symbol} className="animate-fade-in">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold">{pos.symbol}</p>
                                        <p className="text-[10px] text-muted-foreground">
                                            {pos.quantity} shares @ {formatCurrency(pos.avgCost)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-semibold">{formatCurrency(pos.totalValue)}</p>
                                        <Badge variant={pos.pnl >= 0 ? "success" : "destructive"}>
                                            {pos.pnl >= 0 ? "+" : ""}
                                            {pos.pnlPercent.toFixed(2)}%
                                        </Badge>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}
            </div>

            {/* Trade History */}
            {trades.length > 0 && (
                <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        Recent Trades
                    </h3>
                    <div className="space-y-1.5">
                        {trades.slice(0, 10).map((trade) => (
                            <Card key={trade.id} className="py-2.5 px-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Badge variant={trade.type === "buy" ? "success" : "destructive"}>
                                            {trade.type}
                                        </Badge>
                                        <span className="text-xs font-semibold">{trade.symbol}</span>
                                    </div>
                                    <span className="text-xs text-muted-foreground">
                                        {trade.quantity} @ {formatCurrency(trade.price)}
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => setFormOpen(true)}
                className="fixed bottom-20 right-4 h-14 w-14 gradient-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:shadow-primary/50 active:scale-90 transition-all duration-200 z-40"
            >
                <Plus className="h-6 w-6" />
            </button>

            <TradeForm open={formOpen} onClose={() => setFormOpen(false)} onSubmit={executeTrade} />
        </div>
    );
}
