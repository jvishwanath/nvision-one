"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { renderMarkdown } from "@/lib/markdown";
import type { Note } from "../types";

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onEdit: (note: Note) => void;
    onTogglePin: (id: string) => void;
}

export function NoteCard({ note, onDelete, onEdit, onTogglePin }: NoteCardProps) {
    const [detailOpen, setDetailOpen] = useState(false);

    return (
        <>
        <div
            className="rounded-xl cursor-pointer select-none"
            onClick={() => setDetailOpen(true)}
        >
            <Card className={`animate-fade-in ${note.pinned ? "border-l-2 border-l-primary" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                        {note.pinned && <Pin className="h-3 w-3 text-primary shrink-0 rotate-45" />}
                        <h4 className="text-sm font-semibold truncate">{note.title}</h4>
                    </div>
                    {note.content && (
                        <div className="mt-1 line-clamp-3 text-muted-foreground text-xs">
                            {renderMarkdown(note.content)}
                        </div>
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
                <div className="shrink-0">
                    <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onTogglePin(note.id); }}
                        className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${note.pinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                        aria-label={note.pinned ? "Unpin note" : "Pin note"}
                    >
                        <Pin className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            </Card>
        </div>

        <DetailSheet
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title={note.title}
            onEdit={() => { setDetailOpen(false); onEdit(note); }}
            onDelete={() => { setDetailOpen(false); onDelete(note.id); }}
            actions={
                <button
                    type="button"
                    onClick={() => onTogglePin(note.id)}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg transition-colors ${note.pinned ? "text-primary hover:bg-primary/10" : "text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
                    aria-label={note.pinned ? "Unpin note" : "Pin note"}
                >
                    <Pin className="h-3.5 w-3.5" />
                </button>
            }
        >
            <div className="space-y-4">
                {note.pinned && (
                    <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                        <Pin className="h-3 w-3 rotate-45" />
                        Pinned
                    </div>
                )}

                {note.content ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm">
                        {renderMarkdown(note.content)}
                    </div>
                ) : (
                    <p className="text-sm text-muted-foreground italic">No content</p>
                )}

                {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                        {note.tags.map((tag) => (
                            <Badge key={tag} variant="primary" className="text-[10px]">
                                {tag}
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="text-[10px] text-muted-foreground/60 space-y-0.5">
                    <p>Created {new Date(note.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    <p>Updated {new Date(note.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
            </div>
        </DetailSheet>
        </>
    );
}
