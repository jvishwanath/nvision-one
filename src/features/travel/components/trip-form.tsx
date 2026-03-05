"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog } from "@/components/ui/dialog";
import type { CreateTripInput, Trip } from "../types";

interface TripFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTripInput) => void;
    initialData?: Trip;
}

export function TripForm({ open, onClose, onSubmit, initialData }: TripFormProps) {
    const [name, setName] = useState(initialData?.name ?? "");
    const [destination, setDestination] = useState(initialData?.destination ?? "");
    const [startDate, setStartDate] = useState(initialData?.startDate ?? "");
    const [endDate, setEndDate] = useState(initialData?.endDate ?? "");

    useEffect(() => {
        setName(initialData?.name ?? "");
        setDestination(initialData?.destination ?? "");
        setStartDate(initialData?.startDate ?? "");
        setEndDate(initialData?.endDate ?? "");
    }, [initialData, open]);

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
        <Dialog open={open} onClose={onClose} title={initialData ? "Edit Trip" : "New Trip"}>
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
                    {initialData ? "Update Trip" : "Create Trip"}
                </Button>
            </div>
        </Dialog>
    );
}
