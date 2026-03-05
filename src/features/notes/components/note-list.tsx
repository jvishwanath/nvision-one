"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus, Search } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useNoteStore } from "../store";
import { NoteCard } from "./note-card";
import { NoteEditor } from "./note-editor";
import type { CreateNoteInput, Note } from "../types";

export function NoteList() {
    const searchParams = useSearchParams();
    const { notes, loading, searchQuery, selectedTag, loadNotes, addNote, updateNote, deleteNote, setSearchQuery, setSelectedTag } =
        useNoteStore();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingNote, setEditingNote] = useState<Note | null>(null);

    const handleSubmit = async (data: CreateNoteInput) => {
        if (editingNote) {
            await updateNote(editingNote.id, data);
            setEditingNote(null);
            return;
        }
        await addNote(data);
    };

    useEffect(() => {
        loadNotes();
    }, [loadNotes]);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setEditingNote(null);
            setEditorOpen(true);
        }
    }, [searchParams]);

    const allTags = useMemo(() => {
        const tagSet = new Set<string>();
        notes.forEach((n) => n.tags.forEach((t) => tagSet.add(t)));
        return Array.from(tagSet).sort();
    }, [notes]);

    const filteredNotes = useMemo(() => {
        let result = notes;
        if (searchQuery) {
            const q = searchQuery.toLowerCase();
            result = result.filter(
                (n) =>
                    n.title.toLowerCase().includes(q) ||
                    n.content.toLowerCase().includes(q)
            );
        }
        if (selectedTag) {
            result = result.filter((n) => n.tags.includes(selectedTag));
        }
        return result;
    }, [notes, searchQuery, selectedTag]);

    return (
        <div className="space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    placeholder="Search notes…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary transition-all"
                />
            </div>

            {/* Tag filters */}
            {allTags.length > 0 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
                    <button
                        onClick={() => setSelectedTag(null)}
                        className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${!selectedTag
                                ? "gradient-primary text-white"
                                : "bg-secondary text-muted-foreground"
                            }`}
                    >
                        All
                    </button>
                    {allTags.map((tag) => (
                        <button
                            key={tag}
                            onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
                            className={`shrink-0 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all ${selectedTag === tag
                                    ? "gradient-primary text-white"
                                    : "bg-secondary text-muted-foreground"
                                }`}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            {/* Notes */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredNotes.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No notes yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Tap + to create one</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredNotes.map((note) => (
                        <NoteCard
                            key={note.id}
                            note={note}
                            onDelete={deleteNote}
                            onEdit={(selectedNote) => {
                                setEditingNote(selectedNote);
                                setEditorOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => {
                    setEditingNote(null);
                    setEditorOpen(true);
                }}
                className="fixed bottom-20 right-4 h-14 w-14 gradient-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:shadow-primary/50 active:scale-90 transition-all duration-200 z-40"
            >
                <Plus className="h-6 w-6" />
            </button>

            <NoteEditor
                open={editorOpen}
                onClose={() => {
                    setEditorOpen(false);
                    setEditingNote(null);
                }}
                onSubmit={handleSubmit}
                initialData={editingNote ?? undefined}
            />
        </div>
    );
}
