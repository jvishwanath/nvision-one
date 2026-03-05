"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog } from "@/components/ui/dialog";
import type { CreateNoteInput, Note } from "../types";

interface NoteEditorProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateNoteInput) => void;
    initialData?: Note;
}

export function NoteEditor({ open, onClose, onSubmit, initialData }: NoteEditorProps) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [content, setContent] = useState(initialData?.content ?? "");
    const [tagsInput, setTagsInput] = useState(initialData?.tags.join(", ") ?? "");

    useEffect(() => {
        setTitle(initialData?.title ?? "");
        setContent(initialData?.content ?? "");
        setTagsInput(initialData?.tags.join(", ") ?? "");
    }, [initialData, open]);

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            content: content.trim(),
            tags: tagsInput
                .split(",")
                .map((t) => t.trim())
                .filter(Boolean),
        });
        setTitle("");
        setContent("");
        setTagsInput("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} title={initialData ? "Edit Note" : "New Note"}>
            <div className="space-y-4">
                <Input
                    id="note-title"
                    label="Title"
                    placeholder="Note title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                />
                <Textarea
                    id="note-content"
                    label="Content"
                    placeholder="Write your thoughts…"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    className="min-h-[120px]"
                />
                <Input
                    id="note-tags"
                    label="Tags (comma separated)"
                    placeholder="personal, ideas, work"
                    value={tagsInput}
                    onChange={(e) => setTagsInput(e.target.value)}
                />
                <Button onClick={handleSubmit} className="w-full">
                    {initialData ? "Update Note" : "Save Note"}
                </Button>
            </div>
        </Dialog>
    );
}
