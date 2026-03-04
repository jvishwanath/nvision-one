import { db } from "@/lib/db";
import type { Trip, CreateTripInput, ItineraryItem, CreateItineraryItemInput } from "./types";
import { generateId } from "@/lib/utils";

export const travelRepository = {
    /* ── Trips ───────── */
    async getAllTrips(): Promise<Trip[]> {
        return db.trips.orderBy("startDate").reverse().toArray();
    },

    async getTripById(id: string): Promise<Trip | undefined> {
        return db.trips.get(id);
    },

    async createTrip(input: CreateTripInput): Promise<Trip> {
        const trip: Trip = {
            ...input,
            id: generateId(),
            createdAt: new Date().toISOString(),
        };
        await db.trips.add(trip);
        return trip;
    },

    async updateTrip(id: string, changes: Partial<Trip>): Promise<void> {
        await db.trips.update(id, changes);
    },

    async deleteTrip(id: string): Promise<void> {
        await db.trips.delete(id);
        // Also delete associated itinerary items
        await db.itineraryItems.where("tripId").equals(id).delete();
    },

    async countTrips(): Promise<number> {
        return db.trips.count();
    },

    /* ── Itinerary Items ── */
    async getItineraryByTrip(tripId: string): Promise<ItineraryItem[]> {
        return db.itineraryItems
            .where("tripId")
            .equals(tripId)
            .sortBy("day");
    },

    async addItineraryItem(input: CreateItineraryItemInput): Promise<ItineraryItem> {
        const item: ItineraryItem = { ...input, id: generateId() };
        await db.itineraryItems.add(item);
        return item;
    },

    async deleteItineraryItem(id: string): Promise<void> {
        await db.itineraryItems.delete(id);
    },
};
