"use client";

import { useEffect, useState } from "react";
import { Plus, MapPin, Calendar, Trash2, ArrowLeft, Clock, Pencil } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useTravelStore } from "../store";
import { TripForm } from "./trip-form";
import { formatDate } from "@/lib/utils";
import type { ItineraryTag, Trip, CreateTripInput } from "../types";
import { cn } from "@/lib/utils";

const TAG_OPTIONS: { value: ItineraryTag; label: string }[] = [
    { value: "flight", label: "Flight" },
    { value: "car", label: "Car" },
    { value: "place", label: "Place" },
    { value: "restaurant", label: "Restaurant" },
    { value: "ticket", label: "Ticket" },
    { value: "hotel", label: "Hotel" },
    { value: "experience", label: "Experience" },
];

const TAG_STYLES: Record<ItineraryTag, string> = {
    flight: "bg-sky-500/15 text-sky-500 border-sky-500/30",
    car: "bg-amber-500/15 text-amber-500 border-amber-500/30",
    place: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30",
    restaurant: "bg-rose-500/15 text-rose-500 border-rose-500/30",
    ticket: "bg-fuchsia-500/15 text-fuchsia-500 border-fuchsia-500/30",
    hotel: "bg-indigo-500/15 text-indigo-500 border-indigo-500/30",
    experience: "bg-slate-500/15 text-slate-500 border-slate-500/30",
};

export function TripList() {
    const searchParams = useSearchParams();
    const {
        trips,
        selectedTrip,
        itinerary,
        loading,
        loadTrips,
        addTrip,
        updateTrip,
        deleteTrip,
        selectTrip,
        addItineraryItem,
        deleteItineraryItem,
    } = useTravelStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [itineraryFormOpen, setItineraryFormOpen] = useState(false);
    const [day, setDay] = useState("1");
    const [activity, setActivity] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [tag, setTag] = useState<ItineraryTag>("experience");

    useEffect(() => {
        loadTrips();
    }, [loadTrips]);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setEditingTrip(null);
            setFormOpen(true);
        }
    }, [searchParams]);

    const handleTripSubmit = async (data: CreateTripInput) => {
        if (editingTrip) {
            await updateTrip(editingTrip.id, data);
            setEditingTrip(null);
            return;
        }

        await addTrip(data);
    };

    const handleAddItinerary = () => {
        if (!selectedTrip || !activity.trim()) return;
        addItineraryItem({
            tripId: selectedTrip.id,
            day: Number(day),
            activity: activity.trim(),
            time,
            notes: notes.trim(),
            tag,
        });
        setActivity("");
        setTime("");
        setNotes("");
        setTag("experience");
        setItineraryFormOpen(false);
    };

    /* ── Trip Detail View ──────────── */
    if (selectedTrip) {
        return (
            <div className="space-y-4">
                <button
                    onClick={() => selectTrip(null)}
                    className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" /> Back to trips
                </button>

                <Card className="gradient-primary text-white border-0">
                    <div className="flex items-start justify-between gap-2">
                        <h2 className="text-lg font-bold">{selectedTrip.name}</h2>
                        <button
                            onClick={() => {
                                setEditingTrip(selectedTrip);
                                setFormOpen(true);
                            }}
                            className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                            aria-label={`Edit ${selectedTrip.name}`}
                        >
                            <Pencil className="h-3.5 w-3.5" />
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs">
                        <MapPin className="h-3.5 w-3.5" />
                        {selectedTrip.destination}
                    </div>
                    <div className="flex items-center gap-1.5 mt-1 text-white/80 text-xs">
                        <Calendar className="h-3.5 w-3.5" />
                        {formatDate(selectedTrip.startDate)} — {formatDate(selectedTrip.endDate)}
                    </div>
                </Card>

                <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Itinerary
                    </h3>
                    <Button size="sm" onClick={() => setItineraryFormOpen(true)}>
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                    </Button>
                </div>

                {itinerary.length === 0 ? (
                    <Card>
                        <p className="text-sm text-muted-foreground text-center py-4">
                            No itinerary items yet
                        </p>
                    </Card>
                ) : (
                    <div className="space-y-2">
                        {itinerary.map((item) => (
                            <Card key={item.id} className="animate-fade-in">
                                <div className="flex items-start justify-between gap-2">
                                    <div>
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="primary">Day {item.day}</Badge>
                                            <Badge
                                                className={cn(
                                                    "capitalize border",
                                                    TAG_STYLES[item.tag]
                                                )}
                                            >
                                                {item.tag}
                                            </Badge>
                                            {item.time && (
                                                <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                    <Clock className="h-3 w-3" />
                                                    {item.time}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium mt-1.5">{item.activity}</p>
                                        {item.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">{item.notes}</p>
                                        )}
                                    </div>
                                    <button
                                        onClick={() => deleteItineraryItem(item.id)}
                                        className="shrink-0 h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={itineraryFormOpen} onClose={() => setItineraryFormOpen(false)} title="Add Activity">
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input id="itin-day" label="Day" type="number" min="1" value={day} onChange={(e) => setDay(e.target.value)} />
                            <Input id="itin-time" label="Time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                        <Select
                            id="itin-tag"
                            label="Tag"
                            value={tag}
                            onChange={(value) => setTag(value as ItineraryTag)}
                            options={TAG_OPTIONS}
                        />
                        <Input id="itin-activity" label="Activity" placeholder="Visit museum" value={activity} onChange={(e) => setActivity(e.target.value)} />
                        <Input id="itin-notes" label="Notes" placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
                        <Button onClick={handleAddItinerary} className="w-full">Add to Itinerary</Button>
                    </div>
                </Dialog>
            </div>
        );
    }

    /* ── Trip List View ────────────── */
    return (
        <div className="space-y-4">
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : trips.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No trips yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Tap + to plan one</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {trips.map((trip) => (
                        <Card
                            key={trip.id}
                            onClick={() => selectTrip(trip)}
                            className="animate-fade-in cursor-pointer"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div>
                                    <h4 className="text-sm font-semibold">{trip.name}</h4>
                                    <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3" />
                                        {trip.destination}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5 text-[10px] text-muted-foreground/60">
                                        <Calendar className="h-3 w-3" />
                                        {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deleteTrip(trip.id);
                                    }}
                                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTrip(trip);
                                        setFormOpen(true);
                                    }}
                                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                    aria-label={`Edit ${trip.name}`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <button
                onClick={() => {
                    setEditingTrip(null);
                    setFormOpen(true);
                }}
                className="fixed bottom-20 right-4 h-14 w-14 gradient-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:shadow-primary/50 active:scale-90 transition-all duration-200 z-40"
            >
                <Plus className="h-6 w-6" />
            </button>

            <TripForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingTrip(null);
                }}
                onSubmit={handleTripSubmit}
                initialData={editingTrip ?? undefined}
            />
        </div>
    );
}
