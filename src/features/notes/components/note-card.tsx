"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ellipsis, Pencil, Trash2 } from "lucide-react";
import type { Note } from "../types";

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onEdit: (note: Note) => void;
}

export function NoteCard({ note, onDelete, onEdit }: NoteCardProps) {
    const [actionsOpen, setActionsOpen] = useState(false);
    const pointerStartXRef = useRef<number | null>(null);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary) return;
        pointerStartXRef.current = event.clientX;
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const startX = pointerStartXRef.current;
        pointerStartXRef.current = null;
        if (startX === null) return;
        const deltaX = event.clientX - startX;
        if (deltaX < -32) {
            setActionsOpen(true);
        } else if (deltaX > 20) {
            setActionsOpen(false);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                pointerStartXRef.current = null;
            }}
        >
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center gap-1 bg-muted/70">
                <button
                    onClick={() => onEdit(note)}
                    className="h-8 w-8 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-all flex items-center justify-center"
                    aria-label={`Edit ${note.title}`}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => onDelete(note.id)}
                    className="h-8 w-8 rounded-lg bg-destructive text-destructive-foreground active:scale-95 transition-all flex items-center justify-center"
                    aria-label={`Delete ${note.title}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <Card className={`animate-fade-in transition-transform duration-200 ${actionsOpen ? "-translate-x-24" : "translate-x-0"}`}>
                <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold truncate">{note.title}</h4>
                    {note.content && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-3">
                            {note.content}
                        </p>
                    )}
                    {note.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {note.tags.map((tag) => (
                                <Badge key={tag} variant="primary" className="text-[9px]">
                                    {tag}
                                </Badge>
                            ))}
                        </div>
                    )}
                    <p className="text-[10px] text-muted-foreground/60 mt-2">
                        {new Date(note.updatedAt).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                        })}
                    </p>
                </div>
                <div className="shrink-0 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setActionsOpen((prev) => !prev)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`${actionsOpen ? "Hide" : "Show"} actions for ${note.title}`}
                    >
                        <Ellipsis className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            </Card>
        </div>
    );
}
