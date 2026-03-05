"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
    RefreshCw,
    Plus,
    X,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useFinanceStore } from "../store";

function formatPrice(value: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

export function PortfolioView() {
    const searchParams = useSearchParams();
    const { quotes, loading, error, refresh, addSymbol, removeSymbol } = useFinanceStore();
    const [symbolInput, setSymbolInput] = useState("");
    const [adding, setAdding] = useState(false);
    const [swipedId, setSwipedId] = useState<string | null>(null);
    const pointerStartXRef = useRef<number | null>(null);

    useEffect(() => {
        refresh();
    }, [refresh]);

    useEffect(() => {
        let intervalId: number | undefined;

        const start = () => {
            if (intervalId) return;
            intervalId = window.setInterval(() => {
                if (document.visibilityState === "visible") {
                    refresh();
                }
            }, 60_000);
        };

        const stop = () => {
            if (!intervalId) return;
            window.clearInterval(intervalId);
            intervalId = undefined;
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refresh();
                start();
            } else {
                stop();
            }
        };

        start();
        document.addEventListener("visibilitychange", onVisibilityChange);

        return () => {
            stop();
            document.removeEventListener("visibilitychange", onVisibilityChange);
        };
    }, [refresh]);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            const input = document.getElementById("add-symbol") as HTMLInputElement | null;
            input?.focus();
        }
    }, [searchParams]);

    const handleAdd = async () => {
        if (!symbolInput.trim()) return;
        setAdding(true);
        try {
            await addSymbol(symbolInput);
            setSymbolInput("");
        } finally {
            setAdding(false);
        }
    };

    const placeholderRows = useMemo(() => Array.from({ length: 4 }), []);

    const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary) return;
        pointerStartXRef.current = event.clientX;
    };

    const handlePointerEnd = (event: ReactPointerEvent<HTMLDivElement>, quoteId: string) => {
        const startX = pointerStartXRef.current;
        const endX = event.clientX;
        pointerStartXRef.current = null;
        if (startX === null || endX === null) return;
        const deltaX = endX - startX;
        if (deltaX < -40) {
            setSwipedId(quoteId);
        } else if (deltaX > 20 && swipedId === quoteId) {
            setSwipedId(null);
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-bold">Watchlist</h2>
                    <p className="text-xs text-muted-foreground">Track your favorite tickers in real time</p>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Refresh quotes"
                    onClick={refresh}
                    disabled={loading}
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </Button>
            </div>

            <Card className="p-3 space-y-3">
                <div className="flex items-center gap-2">
                    <Input
                        id="add-symbol"
                        placeholder="Add ticker (e.g. AAPL)"
                        value={symbolInput}
                        onChange={(e) => setSymbolInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                handleAdd();
                            }
                        }}
                    />
                    <Button onClick={handleAdd} disabled={adding || !symbolInput.trim()}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                    </Button>
                </div>
                {error && (
                    <p className="text-xs text-destructive bg-destructive/10 px-3 py-2 rounded-lg">
                        {error}
                    </p>
                )}
            </Card>

            <div className="space-y-2">
                {loading &&
                    placeholderRows.map((_, idx) => (
                        <Card
                            key={`skeleton-${idx}`}
                            className="p-3 animate-pulse bg-muted/40 border-dashed"
                        >
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-3 bg-muted rounded w-1/3 mt-2" />
                        </Card>
                    ))}

                {!loading && quotes.length === 0 && (
                    <Card className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Add a symbol to get started.
                        </p>
                    </Card>
                )}

                {!loading &&
                    quotes.map((quote) => {
                        const isUp = quote.change >= 0;
                        const changeClass = isUp ? "text-emerald-500" : "text-rose-500";

                        return (
                            <div
                                key={quote.id}
                                className="relative overflow-hidden rounded-xl"
                                onPointerDown={handlePointerDown}
                                onPointerUp={(event) => handlePointerEnd(event, quote.id)}
                                onPointerCancel={() => {
                                    pointerStartXRef.current = null;
                                }}
                            >
                                <div className="absolute inset-y-0 right-0 w-20 flex items-center justify-center bg-destructive/15">
                                    <button
                                        onClick={() => {
                                            removeSymbol(quote.id);
                                            setSwipedId(null);
                                        }}
                                        className="h-9 w-9 rounded-lg bg-destructive text-destructive-foreground active:scale-95 transition-all flex items-center justify-center"
                                        aria-label={`Remove ${quote.symbol}`}
                                        title={`Remove ${quote.symbol}`}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                <Card
                                    className={`px-3 py-2 flex items-center gap-2 transition-transform duration-200 ${swipedId === quote.id ? "-translate-x-20" : "translate-x-0"}`}
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs font-semibold tracking-tight text-foreground">
                                                {quote.symbol}
                                            </span>
                                            <p className="text-xs text-muted-foreground truncate">{quote.name}</p>
                                        </div>
                                    </div>
                                    <div className="text-right leading-tight">
                                        <p className="text-sm font-semibold">
                                            {formatPrice(quote.price, quote.currency)}
                                        </p>
                                        <p className={`text-[11px] font-semibold ${changeClass}`}>
                                            {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} ({quote.changePercent.toFixed(2)}%)
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
            </div>
        </div>
    );
}
