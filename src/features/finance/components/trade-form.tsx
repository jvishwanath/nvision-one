"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import type { CreateTradeInput } from "../types";

interface TradeFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTradeInput) => Promise<boolean>;
}

export function TradeForm({ open, onClose, onSubmit }: TradeFormProps) {
    const [symbol, setSymbol] = useState("");
    const [type, setType] = useState<string>("buy");
    const [quantity, setQuantity] = useState("");
    const [price, setPrice] = useState("");
    const [error, setError] = useState("");

    const handleSubmit = async () => {
        if (!symbol.trim() || !quantity || !price) {
            setError("All fields are required");
            return;
        }
        const success = await onSubmit({
            symbol: symbol.toUpperCase().trim(),
            type: type as "buy" | "sell",
            quantity: Number(quantity),
            price: Number(price),
        });
        if (success) {
            setSymbol("");
            setQuantity("");
            setPrice("");
            setError("");
            onClose();
        } else {
            setError("Trade failed — check balance or holdings");
        }
    };

    return (
        <Dialog open={open} onClose={onClose} title="Execute Trade">
            <div className="space-y-4">
                {error && (
                    <div className="text-xs text-destructive bg-destructive/10 p-2 rounded-lg">
                        {error}
                    </div>
                )}
                <Input
                    id="trade-symbol"
                    label="Symbol"
                    placeholder="AAPL"
                    value={symbol}
                    onChange={(e) => setSymbol(e.target.value)}
                    autoFocus
                />
                <Select
                    id="trade-type"
                    label="Type"
                    options={[
                        { value: "buy", label: "Buy" },
                        { value: "sell", label: "Sell" },
                    ]}
                    value={type}
                    onChange={setType}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="trade-qty"
                        label="Quantity"
                        type="number"
                        placeholder="10"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                    />
                    <Input
                        id="trade-price"
                        label="Price ($)"
                        type="number"
                        step="0.01"
                        placeholder="150.00"
                        value={price}
                        onChange={(e) => setPrice(e.target.value)}
                    />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                    Execute Trade
                </Button>
            </div>
        </Dialog>
    );
}
