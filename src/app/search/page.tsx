"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, CheckSquare, StickyNote, Plane } from "lucide-react";
import Link from "next/link";
import { TopBar } from "@/components/top-bar";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { taskRepository } from "@/features/tasks/repository";
import { noteRepository } from "@/features/notes/repository";
import { travelRepository } from "@/features/travel/repository";
import type { Task } from "@/features/tasks/types";
import type { Note } from "@/features/notes/types";
import type { Trip } from "@/features/travel/types";
import {
    decryptTaskFields,
    decryptNoteFields,
    decryptTripFields,
    decryptArray,
} from "@/lib/crypto/entity-crypto";

interface SearchResult {
    type: "task" | "note" | "trip";
    id: string;
    title: string;
    subtitle: string;
    href: string;
}

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [tasks, setTasks] = useState<Task[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loaded, setLoaded] = useState(false);

    useEffect(() => {
        (async () => {
            const [rawTasks, rawNotes, rawTrips] = await Promise.all([
                taskRepository.getAll(),
                noteRepository.getAll(),
                travelRepository.getAllTrips(),
            ]);
            
            // Decrypt all data before setting state
            const [tasks, notes, trips] = await Promise.all([
                decryptArray(rawTasks, decryptTaskFields),
                decryptArray(rawNotes, decryptNoteFields),
                decryptArray(rawTrips, decryptTripFields),
            ]);
            
            setTasks(tasks);
            setNotes(notes);
            setTrips(trips);
            setLoaded(true);
        })();
    }, []);

    const results = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const out: SearchResult[] = [];

        for (const task of tasks) {
            if (task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q)) {
                out.push({
                    type: "task",
                    id: task.id,
                    title: task.title,
                    subtitle: task.completed ? "Completed" : task.priority,
                    href: "/tasks",
                });
            }
        }

        for (const note of notes) {
            if (note.title.toLowerCase().includes(q) || note.content.toLowerCase().includes(q)) {
                out.push({
                    type: "note",
                    id: note.id,
                    title: note.title,
                    subtitle: note.tags.length > 0 ? note.tags.join(", ") : "Note",
                    href: "/notes",
                });
            }
        }

        for (const trip of trips) {
            if (trip.name.toLowerCase().includes(q) || trip.destination.toLowerCase().includes(q)) {
                out.push({
                    type: "trip",
                    id: trip.id,
                    title: trip.name,
                    subtitle: trip.destination,
                    href: "/travel",
                });
            }
        }

        return out.slice(0, 20);
    }, [query, tasks, notes, trips]);

    const iconMap = {
        task: CheckSquare,
        note: StickyNote,
        trip: Plane,
    };

    const colorMap = {
        task: "text-violet-500",
        note: "text-blue-500",
        trip: "text-emerald-500",
    };

    return (
        <>
            <TopBar title="Search" />
            <div className="p-4 space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        placeholder="Search tasks, notes, trips…"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        autoFocus
                        className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all"
                    />
                </div>

                {!loaded ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : query.trim() && results.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground text-sm">No results found</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Try a different search term</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {results.map((r) => {
                            const Icon = iconMap[r.type];
                            return (
                                <Link key={`${r.type}-${r.id}`} href={r.href}>
                                    <Card className="flex items-center gap-3 hover:border-primary/30 transition-colors">
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center bg-muted ${colorMap[r.type]}`}>
                                            <Icon className="h-4 w-4" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{r.title}</p>
                                            <p className="text-[10px] text-muted-foreground">{r.subtitle}</p>
                                        </div>
                                        <Badge variant="outline" className="text-[9px] capitalize">{r.type}</Badge>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                )}

                {!query.trim() && loaded && (
                    <div className="text-center py-12">
                        <Search className="h-8 w-8 mx-auto text-muted-foreground/30 mb-3" />
                        <p className="text-muted-foreground text-sm">Search across all your data</p>
                        <p className="text-muted-foreground/60 text-xs mt-1">Tasks, notes, and trips</p>
                    </div>
                )}
            </div>
        </>
    );
}
