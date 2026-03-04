"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import type { Note } from "../types";

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
}

export function NoteCard({ note, onDelete }: NoteCardProps) {
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
                <button
                    onClick={() => onDelete(note.id)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </Card>
    );
}
