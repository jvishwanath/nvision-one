import Dexie, { type EntityTable } from "dexie";

/* ── Task ─────────────────────────────────────── */
export interface TaskRecord {
    id: string;
    title: string;
    description: string;
    priority: "low" | "medium" | "high" | "urgent";
    dueDate: string | null;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

/* ── Note ─────────────────────────────────────── */
export interface NoteRecord {
    id: string;
    title: string;
    content: string;
    tags: string[];
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
    day: number;
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
    }
}

export const db = new LifeOSDB();
