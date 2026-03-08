"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, MapPin, Calendar, Trash2, ArrowLeft, Clock, Pencil, Ellipsis, Plane, Share2 } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { useTravelStore } from "../store";
import { TripForm } from "./trip-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ShareDialog } from "@/components/share-dialog";
import { toast } from "@/components/ui/toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullIndicator } from "@/components/ui/pull-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
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
        updateItineraryItem,
        deleteItineraryItem,
    } = useTravelStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
    const [itineraryFormOpen, setItineraryFormOpen] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [date, setDate] = useState("");
    const [activity, setActivity] = useState("");
    const [time, setTime] = useState("");
    const [notes, setNotes] = useState("");
    const [tag, setTag] = useState<ItineraryTag>("experience");
    const [actionsOpenTripId, setActionsOpenTripId] = useState<string | null>(null);
    const [pointerStartX, setPointerStartX] = useState<number | null>(null);
    const [deletingTripId, setDeletingTripId] = useState<string | null>(null);
    const [deletingItineraryId, setDeletingItineraryId] = useState<string | null>(null);
    const [shareOpen, setShareOpen] = useState(false);

    const handlePullRefresh = useCallback(async () => { await loadTrips(); }, [loadTrips]);
    const { pulling, refreshing, pullDistance } = usePullToRefresh({ onRefresh: handlePullRefresh });

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
            toast("Trip updated");
            return;
        }
        await addTrip(data);
        toast("Trip created");
    };

    const resetItineraryForm = () => {
        setDate(selectedTrip?.startDate ?? "");
        setActivity("");
        setTime("");
        setNotes("");
        setTag("experience");
        setEditingItemId(null);
    };

    const openAddItinerary = () => {
        resetItineraryForm();
        setItineraryFormOpen(true);
    };

    const openEditItinerary = (item: import("../types").ItineraryItem) => {
        setEditingItemId(item.id);
        setDate(item.date);
        setActivity(item.activity);
        setTime(item.time);
        setNotes(item.notes);
        setTag(item.tag);
        setItineraryFormOpen(true);
    };

    const handleItinerarySubmit = async () => {
        if (!selectedTrip || !activity.trim() || !date) return;
        try {
            if (editingItemId) {
                await updateItineraryItem(editingItemId, {
                    date,
                    activity: activity.trim(),
                    time,
                    notes: notes.trim(),
                    tag,
                });
                toast("Activity updated");
            } else {
                await addItineraryItem({
                    tripId: selectedTrip.id,
                    date,
                    activity: activity.trim(),
                    time,
                    notes: notes.trim(),
                    tag,
                });
                toast("Activity added");
            }
            resetItineraryForm();
            setItineraryFormOpen(false);
        } catch (err) {
            toast(err instanceof Error ? err.message : "Failed to save activity");
        }
    };

    const handleConfirmDeleteTrip = async () => {
        if (!deletingTripId) return;
        await deleteTrip(deletingTripId);
        setDeletingTripId(null);
        setActionsOpenTripId(null);
        toast("Trip deleted");
    };

    const handleConfirmDeleteItinerary = async () => {
        if (!deletingItineraryId) return;
        await deleteItineraryItem(deletingItineraryId);
        setDeletingItineraryId(null);
        toast("Activity removed");
    };

    const handleTripPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary) return;
        setPointerStartX(event.clientX);
    };

    const handleTripPointerUp = (event: React.PointerEvent<HTMLDivElement>, tripId: string) => {
        if (pointerStartX === null) return;
        const deltaX = event.clientX - pointerStartX;
        setPointerStartX(null);
        if (deltaX < -32) {
            setActionsOpenTripId(tripId);
        } else if (deltaX > 20 && actionsOpenTripId === tripId) {
            setActionsOpenTripId(null);
        }
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
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setShareOpen(true)}
                                className="h-8 w-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                                aria-label={`Share ${selectedTrip.name}`}
                            >
                                <Share2 className="h-3.5 w-3.5" />
                            </button>
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
                    <h3 className="text-base font-semibold text-muted-foreground uppercase tracking-wider">
                        Itinerary
                    </h3>
                    <Button size="sm" onClick={openAddItinerary}>
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
                            <Card key={item.id} className="animate-fade-in cursor-pointer hover:ring-1 hover:ring-primary/30 transition-all" onClick={() => openEditItinerary(item)}>
                                <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <Badge variant="primary">
                                                <Calendar className="h-2.5 w-2.5 mr-1" />
                                                {formatDate(item.date)}
                                            </Badge>
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
                                        <p className="text-xl font-medium mt-1.5">{item.activity}</p>
                                        {item.notes && (
                                            <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                                        )}
                                    </div>
                                    <div className="shrink-0 flex items-center gap-0.5">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); openEditItinerary(item); }}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                                        >
                                            <Pencil className="h-3 w-3" />
                                        </button>
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setDeletingItineraryId(item.id); }}
                                            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                </div>
                            </Card>
                        ))}
                    </div>
                )}

                <Dialog open={itineraryFormOpen} onClose={() => { setItineraryFormOpen(false); resetItineraryForm(); }} title={editingItemId ? "Edit Activity" : "Add Activity"}>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <Input id="itin-date" label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
                        <Button onClick={handleItinerarySubmit} className="w-full">{editingItemId ? "Update Activity" : "Add to Itinerary"}</Button>
                    </div>
                </Dialog>

                <ConfirmDialog
                    open={deletingItineraryId !== null}
                    message="This activity will be removed from the itinerary."
                    onConfirm={handleConfirmDeleteItinerary}
                    onCancel={() => setDeletingItineraryId(null)}
                />

                <ShareDialog
                    open={shareOpen}
                    onClose={() => setShareOpen(false)}
                    itemType="trip"
                    itemId={selectedTrip.id}
                    itemTitle={selectedTrip.name}
                />
            </div>
        );
    }

    /* ── Trip List View ────────────── */
    return (
        <div className="space-y-4">
            <PullIndicator pulling={pulling} refreshing={refreshing} pullDistance={pullDistance} />
            {loading ? (
                <ListSkeleton count={3} />
            ) : trips.length === 0 ? (
                <EmptyState icon={Plane} title="No trips yet" subtitle="Tap + to plan your next adventure" />
            ) : (
                <div className="space-y-2">
                    {[...trips].sort((a, b) => {
                        const today = new Date().toISOString().slice(0, 10);
                        const aStatus = a.startDate > today ? 0 : a.endDate >= today ? 1 : 2;
                        const bStatus = b.startDate > today ? 0 : b.endDate >= today ? 1 : 2;
                        if (aStatus !== bStatus) return aStatus - bStatus;
                        return a.startDate.localeCompare(b.startDate);
                    }).map((trip) => {
                        const today = new Date().toISOString().slice(0, 10);
                        const isUpcoming = trip.startDate > today;
                        const isActive = trip.startDate <= today && trip.endDate >= today;
                        const isPast = trip.endDate < today;
                        let statusLabel = "";
                        let statusColor = "";
                        if (isActive) {
                            statusLabel = "In progress";
                            statusColor = "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
                        } else if (isUpcoming) {
                            const daysAway = Math.ceil((new Date(trip.startDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
                            statusLabel = daysAway === 0 ? "Today!" : daysAway === 1 ? "Tomorrow" : `${daysAway}d away`;
                            statusColor = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30";
                        } else {
                            statusLabel = "Completed";
                            statusColor = "bg-muted text-muted-foreground border-border";
                        }
                        return (
                        <div
                            key={trip.id}
                            className="relative overflow-hidden rounded-xl"
                            onPointerDown={handleTripPointerDown}
                            onPointerUp={(event) => handleTripPointerUp(event, trip.id)}
                            onPointerCancel={() => setPointerStartX(null)}
                        >
                            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center gap-1 bg-muted/70">
                                <button
                                    onClick={() => {
                                        setEditingTrip(trip);
                                        setFormOpen(true);
                                        setActionsOpenTripId(null);
                                    }}
                                    className="h-8 w-8 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-all flex items-center justify-center"
                                    aria-label={`Edit ${trip.name}`}
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                    onClick={() => setDeletingTripId(trip.id)}
                                    className="h-8 w-8 rounded-lg bg-destructive text-destructive-foreground active:scale-95 transition-all flex items-center justify-center"
                                    aria-label={`Delete ${trip.name}`}
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </button>
                            </div>

                            <Card
                                className={`animate-fade-in transition-transform duration-200 ${actionsOpenTripId === trip.id ? "-translate-x-24" : "translate-x-0"}`}
                            >
                                <div className="flex items-start justify-between gap-2">
                                    <button
                                        type="button"
                                        onClick={() => selectTrip(trip)}
                                        className="flex-1 text-left"
                                    >
                                        <div className="flex items-center gap-2">
                                            <h4 className="text-xl font-semibold">{trip.name}</h4>
                                            <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${statusColor}`}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-1 text-sm text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            {trip.destination}
                                        </div>
                                        <div className="flex items-center gap-1.5 mt-0.5 text-xs text-muted-foreground/60">
                                            <Calendar className="h-3 w-3" />
                                            {formatDate(trip.startDate)} — {formatDate(trip.endDate)}
                                        </div>
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActionsOpenTripId((prev) => (prev === trip.id ? null : trip.id))
                                        }
                                        className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                                        aria-label={`${actionsOpenTripId === trip.id ? "Hide" : "Show"} actions for ${trip.name}`}
                                    >
                                        <Ellipsis className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </Card>
                        </div>
                        );
                    })}
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

            <ConfirmDialog
                open={deletingTripId !== null}
                message="This trip and its itinerary will be permanently deleted."
                onConfirm={handleConfirmDeleteTrip}
                onCancel={() => setDeletingTripId(null)}
            />
        </div>
    );
}
