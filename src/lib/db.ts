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

/* ── Trade ────────────────────────────────────── */
export interface TradeRecord {
    id: string;
    symbol: string;
    type: "buy" | "sell";
    quantity: number;
    price: number;
    timestamp: string;
}

/* ── Watchlist ────────────────────────────────── */
export interface WatchlistRecord {
    id: string;
    symbol: string;
    createdAt: string;
}

/* ── Trip ─────────────────────────────────────── */
export interface TripRecord {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    createdAt: string;
}

/* ── Itinerary Item ───────────────────────────── */
export interface ItineraryItemRecord {
    id: string;
    tripId: string;
    date: string;
    activity: string;
    time: string;
    notes: string;
    tag: "flight" | "car" | "place" | "restaurant" | "ticket" | "hotel" | "experience";
}

/* ── Database ─────────────────────────────────── */
class LifeOSDB extends Dexie {
    tasks!: EntityTable<TaskRecord, "id">;
    notes!: EntityTable<NoteRecord, "id">;
    trades!: EntityTable<TradeRecord, "id">;
    watchlist!: EntityTable<WatchlistRecord, "id">;
    trips!: EntityTable<TripRecord, "id">;
    itineraryItems!: EntityTable<ItineraryItemRecord, "id">;

    constructor() {
        super("LifeOSDB");

        this.version(2).stores({
            tasks: "id, priority, completed, dueDate, createdAt, [priority+completed], [priority+dueDate]",
            notes: "id, *tags, createdAt",
            trades: "id, symbol, type, timestamp",
            watchlist: "id, symbol",
            trips: "id, destination, startDate",
            itineraryItems: "id, tripId, day, [tripId+day]",
        });

        this.version(3).stores({
            tasks: "id, priority, completed, dueDate, createdAt, [priority+completed], [priority+dueDate]",
            notes: "id, *tags, pinned, createdAt",
            trades: "id, symbol, type, timestamp",
            watchlist: "id, symbol",
            trips: "id, destination, startDate",
            itineraryItems: "id, tripId, day, [tripId+day]",
        }).upgrade((tx) => {
            return tx.table("notes").toCollection().modify((note) => {
                if (note.pinned === undefined) note.pinned = false;
            });
        });

        this.version(4).stores({
            tasks: "id, priority, completed, dueDate, createdAt, [priority+completed], [priority+dueDate]",
            notes: "id, *tags, pinned, createdAt",
            trades: "id, symbol, type, timestamp",
            watchlist: "id, symbol",
            trips: "id, destination, startDate",
            itineraryItems: "id, tripId, date, [tripId+date]",
        }).upgrade((tx) => {
            return tx.table("itineraryItems").toCollection().modify((item) => {
                if (item.day !== undefined && item.date === undefined) {
                    item.date = "";
                    delete item.day;
                }
            });
        });
    }
}

export const db = new LifeOSDB();
