import Dexie, { type EntityTable } from "dexie";

/* ── Task ─────────────────────────────────────── */
export interface TaskRecord {
    id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string | null;
    completed: boolean;
    subtasks: Array<{ id: string; title: string; completed: boolean }>;
    createdAt: string;
    updatedAt: string;
}

/* ── Note ─────────────────────────────────────── */
export interface NoteRecord {
    id: string;
    title: string;
    content: string;
    tags: string[];
    pinned: boolean;
    createdAt: string;
    updatedAt: string;
}

/* ── Database ─────────────────────────────────── */
class LifeOSDB extends Dexie {
    tasks!: EntityTable<TaskRecord, "id">;
    notes!: EntityTable<NoteRecord, "id">;

    constructor() {
        super("LifeOSDB");

        this.version(5).stores({
            tasks: "id, priority, completed, dueDate, createdAt, [priority+completed], [priority+dueDate]",
            notes: "id, *tags, pinned, createdAt",
            trades: null,
            watchlist: null,
            trips: null,
            itineraryItems: null,
        });
    }
}

export const db = new LifeOSDB();
