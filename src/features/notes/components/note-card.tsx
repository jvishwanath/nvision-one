"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2 } from "lucide-react";
import type { Note } from "../types";

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onEdit: (note: Note) => void;
}

export function NoteCard({ note, onDelete, onEdit }: NoteCardProps) {
    return (
        <Card className="animate-fade-in">
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
                        onClick={() => onEdit(note)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors"
                        aria-label={`Edit ${note.title}`}
                    >
                        <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                        onClick={() => onDelete(note.id)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                        aria-label={`Delete ${note.title}`}
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
        </Card>
    );
}
