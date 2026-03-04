"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { CreateTripInput } from "../types";

interface TripFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTripInput) => void;
}

export function TripForm({ open, onClose, onSubmit }: TripFormProps) {
    const [name, setName] = useState("");
    const [destination, setDestination] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const handleSubmit = () => {
        if (!name.trim() || !destination.trim() || !startDate || !endDate) return;
        onSubmit({
            name: name.trim(),
            destination: destination.trim(),
            startDate,
            endDate,
        });
        setName("");
        setDestination("");
        setStartDate("");
        setEndDate("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} title="New Trip">
            <div className="space-y-4">
                <Input
                    id="trip-name"
                    label="Trip Name"
                    placeholder="Summer Vacation"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoFocus
                />
                <Input
                    id="trip-dest"
                    label="Destination"
                    placeholder="Tokyo, Japan"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Input
                        id="trip-start"
                        label="Start Date"
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                    <Input
                        id="trip-end"
                        label="End Date"
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                    Create Trip
                </Button>
            </div>
        </Dialog>
    );
}
