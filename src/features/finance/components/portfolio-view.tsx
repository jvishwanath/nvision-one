"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { PointerEvent as ReactPointerEvent } from "react";
import { useSearchParams } from "next/navigation";
import { RefreshCw, Plus, X, Search, ArrowUpDown, DollarSign, Percent } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useFinanceStore } from "../store";

import type { MarketIndex } from "../store";

type SortMode = "symbol" | "change" | "changePercent";
type SortDirection = "asc" | "desc";

const INDEX_LABELS: MarketIndex[] = [
    { label: "DOW", symbol: "^DJI", price: 0, change: 0, changePercent: 0 },
    { label: "S&P", symbol: "^GSPC", price: 0, change: 0, changePercent: 0 },
    { label: "NASDAQ", symbol: "^IXIC", price: 0, change: 0, changePercent: 0 },
    { label: "BTC", symbol: "BTC-USD", price: 0, change: 0, changePercent: 0 },
];

function formatPrice(value: number, currency = "USD") {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(value);
}

export function PortfolioView() {
    const searchParams = useSearchParams();
    const { quotes, loading, refreshing, indices, error, refresh, addSymbol, removeSymbol } = useFinanceStore();
    const [symbolInput, setSymbolInput] = useState("");
    const [adding, setAdding] = useState(false);
    const [swipedId, setSwipedId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [sortMode, setSortMode] = useState<SortMode>("symbol");
    const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
    const pointerStartXRef = useRef<number | null>(null);

    useEffect(() => {
        refresh();
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
    const visibleQuotes = useMemo(() => {
        const filtered = quotes.filter((quote) => {
            const q = searchQuery.trim().toLowerCase();
            if (!q) return true;
            return quote.symbol.toLowerCase().includes(q) || quote.name.toLowerCase().includes(q);
        });

        const sorted = [...filtered];
        if (sortMode === "change") {
            sorted.sort((a, b) => a.change - b.change);
        } else if (sortMode === "changePercent") {
            sorted.sort((a, b) => a.changePercent - b.changePercent);
        } else {
            sorted.sort((a, b) => a.symbol.localeCompare(b.symbol));
        }

        if (sortDirection === "desc") {
            sorted.reverse();
        }

        return sorted;
    }, [quotes, searchQuery, sortMode, sortDirection]);

    const handleSortClick = (mode: SortMode) => {
        if (sortMode === mode) {
            setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
            return;
        }

        setSortMode(mode);
        setSortDirection(mode === "symbol" ? "asc" : "desc");
    };

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
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-lg border border-border/60 bg-background/70 p-1">
                        <button
                            type="button"
                            onClick={() => handleSortClick("symbol")}
                            aria-label="Sort by ticker"
                            title="Sort by ticker"
                            className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${sortMode === "symbol" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <ArrowUpDown className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSortClick("change")}
                            aria-label="Sort by dollar change"
                            title="Sort by dollar change"
                            className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${sortMode === "change" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <DollarSign className="h-3.5 w-3.5" />
                        </button>
                        <button
                            type="button"
                            onClick={() => handleSortClick("changePercent")}
                            aria-label="Sort by percent change"
                            title="Sort by percent change"
                            className={`h-6 w-6 rounded-md flex items-center justify-center transition-colors ${sortMode === "changePercent" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                        >
                            <Percent className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Refresh quotes"
                        onClick={refresh}
                        disabled={refreshing}
                    >
                        <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
                    </Button>
                </div>
            </div>

            <div className="flex items-center justify-between gap-2 px-1">
                {(indices.length > 0 ? indices : INDEX_LABELS).map((idx) => {
                    const idxUp = idx.change >= 0;
                    const idxColor = idxUp ? "text-emerald-500" : "text-rose-500";
                    return (
                        <div key={idx.symbol} className="flex-1 text-center">
                            <p className="text-[10px] font-medium text-muted-foreground">{idx.label}</p>
                            <p className="text-[11px] font-semibold tabular-nums">
                                {idx.price > 0 ? idx.price.toLocaleString("en-US", { maximumFractionDigits: 0 }) : "—"}
                            </p>
                            <p className={`text-[10px] font-medium tabular-nums ${idxColor}`}>
                                {idx.price > 0 ? `${idxUp ? "+" : ""}${idx.changePercent.toFixed(2)}%` : ""}
                            </p>
                        </div>
                    );
                })}
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
                {loading && visibleQuotes.length === 0 &&
                    placeholderRows.map((_, idx) => (
                        <Card
                            key={`skeleton-${idx}`}
                            className="p-3 animate-pulse bg-muted/40 border-dashed"
                        >
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-3 bg-muted rounded w-1/3 mt-2" />
                        </Card>
                    ))}

                {!loading && visibleQuotes.length === 0 && (
                    <Card className="p-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            {searchQuery ? "No matching symbols." : "Add a symbol to get started."}
                        </p>
                    </Card>
                )}

                {visibleQuotes.map((quote) => {
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
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold whitespace-nowrap">
                                            {formatPrice(quote.price, quote.currency)}
                                            <span className={`ml-2 text-[11px] font-semibold ${changeClass}`}>
                                                {quote.change >= 0 ? "+" : ""}{quote.change.toFixed(2)} · {quote.changePercent.toFixed(2)}%
                                            </span>
                                        </p>
                                    </div>
                                </Card>
                            </div>
                        );
                    })}
            </div>

            <div className="fixed bottom-24 right-4 z-40 w-44">
                <div className="flex items-center gap-1 rounded-full border border-border/60 bg-background/95 px-2 py-1 shadow-lg backdrop-blur">
                    <Search className="h-3.5 w-3.5 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        placeholder="Search"
                        className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/70"
                        aria-label="Search watchlist"
                    />
                </div>
            </div>
        </div>
    );
}
