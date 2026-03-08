import { db } from "@/lib/db";
import type { Note, CreateNoteInput } from "./types";
import { generateId } from "@/lib/utils";
import { noteHttpRepository } from "./repository.http";

const noteLocalRepository = {
    async getAll(): Promise<Note[]> {
        return db.notes.orderBy("createdAt").reverse().toArray();
    },

    async getById(id: string): Promise<Note | undefined> {
        return db.notes.get(id);
    },

    async create(input: CreateNoteInput): Promise<Note> {
        const now = new Date().toISOString();
        const note: Note = {
            ...input,
            id: generateId(),
            createdAt: now,
            updatedAt: now,
        };
        await db.notes.add(note);
        return note;
    },

    async update(id: string, changes: Partial<Note>): Promise<void> {
        await db.notes.update(id, { ...changes, updatedAt: new Date().toISOString() });
    },

    async remove(id: string): Promise<void> {
        await db.notes.delete(id);
    },

    async search(query: string): Promise<Note[]> {
        const q = query.toLowerCase();
        const all = await db.notes.toArray();
        return all.filter(
            (n) =>
                n.title.toLowerCase().includes(q) ||
                n.content.toLowerCase().includes(q) ||
                n.tags.some((t) => t.toLowerCase().includes(q))
        );
    },

    async count(): Promise<number> {
        return db.notes.count();
    },
};

const useServerPersistence = process.env.NEXT_PUBLIC_PERSISTENCE !== "local";

export const noteRepository = useServerPersistence ? noteHttpRepository : noteLocalRepository;
