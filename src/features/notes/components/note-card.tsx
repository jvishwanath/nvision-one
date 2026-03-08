"use client";

import { useState } from "react";
import { Share2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { ShareDialog } from "@/components/share-dialog";
import { renderMarkdown } from "@/lib/markdown";
import type { Note } from "../types";

interface NoteCardProps {
    note: Note;
    onDelete: (id: string) => void;
    onEdit: (note: Note) => void;
}

export function NoteCard({ note, onDelete, onEdit }: NoteCardProps) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [shareOpen, setShareOpen] = useState(false);

    return (
        <>
        <div
            className="rounded-xl cursor-pointer select-none"
            onClick={() => setDetailOpen(true)}
        >
            <Card className="animate-fade-in">
                <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-semibold truncate">{note.title}</h4>
                    {note.content && (
                        <div className="mt-1 line-clamp-3 text-muted-foreground text-base">
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
                <>
                <button
                    type="button"
                    onClick={() => { setDetailOpen(false); setShareOpen(true); }}
                    className="h-8 w-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    aria-label="Share note"
                >
                    <Share2 className="h-3.5 w-3.5" />
                </button>
                </>
            }
        >
            <div className="space-y-4">
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

        <ShareDialog
            open={shareOpen}
            onClose={() => setShareOpen(false)}
            itemType="note"
            itemId={note.id}
            itemTitle={note.title}
        />
        </>
    );
}
