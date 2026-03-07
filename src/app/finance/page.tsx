"use client";

import { Suspense, useState } from "react";
import { TopBar } from "@/components/top-bar";
import { PortfolioView } from "@/features/finance/components/portfolio-view";
import { PortfolioPL } from "@/features/finance/components/portfolio-pl";
import { TradeForm } from "@/features/finance/components/trade-form";
import { tradeRepository } from "@/features/finance/repository";
import { toast } from "@/components/ui/toast";
import { Plus } from "lucide-react";
import type { CreateTradeInput } from "@/features/finance/types";

type Tab = "watchlist" | "portfolio";

export default function FinancePage() {
    const [tab, setTab] = useState<Tab>("watchlist");
    const [tradeOpen, setTradeOpen] = useState(false);

    const handleTrade = async (data: CreateTradeInput): Promise<boolean> => {
        try {
            await tradeRepository.create(data);
            toast("Trade logged");
            return true;
        } catch {
            return false;
        }
    };

    return (
        <>
            <TopBar title="Finance" />
            <div className="p-4 space-y-4">
                {/* Tabs */}
                <div className="flex items-center gap-2">
                    {(["watchlist", "portfolio"] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                                tab === t
                                    ? "gradient-primary text-white shadow-md"
                                    : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                        >
                            {t === "watchlist" ? "Watchlist" : "Portfolio"}
                        </button>
                    ))}
                </div>

                <Suspense fallback={null}>
                    {tab === "watchlist" ? <PortfolioView /> : <PortfolioPL />}
                </Suspense>

                {tab === "portfolio" && (
                    <>
                        <button
                            onClick={() => setTradeOpen(true)}
                            className="fixed bottom-20 right-4 h-14 w-14 gradient-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:shadow-primary/50 active:scale-90 transition-all duration-200 z-40"
                        >
                            <Plus className="h-6 w-6" />
                        </button>
                        <TradeForm open={tradeOpen} onClose={() => setTradeOpen(false)} onSubmit={handleTrade} />
                    </>
                )}
            </div>
        </>
    );
}
