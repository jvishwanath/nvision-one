import { create } from "zustand";
import type { Trip, CreateTripInput, ItineraryItem, CreateItineraryItemInput } from "./types";
import { travelRepository } from "./repository";
import { logger } from "@/lib/logger";

interface TravelState {
    trips: Trip[];
    selectedTrip: Trip | null;
    itinerary: ItineraryItem[];
    loading: boolean;
    loadTrips: () => Promise<void>;
    addTrip: (input: CreateTripInput) => Promise<void>;
    updateTrip: (id: string, changes: Partial<Trip>) => Promise<void>;
    deleteTrip: (id: string) => Promise<void>;
    selectTrip: (trip: Trip | null) => Promise<void>;
    addItineraryItem: (input: CreateItineraryItemInput) => Promise<void>;
    updateItineraryItem: (id: string, changes: Partial<ItineraryItem>) => Promise<void>;
    deleteItineraryItem: (id: string) => Promise<void>;
}

export const useTravelStore = create<TravelState>((set, get) => ({
    trips: [],
    selectedTrip: null,
    itinerary: [],
    loading: false,

    loadTrips: async () => {
        set({ loading: true });
        try {
            const trips = await travelRepository.getAllTrips();
            set({ trips });
        } catch (err) {
            logger.error("Failed to load trips", err);
        } finally {
            set({ loading: false });
        }
    },

    addTrip: async (input) => {
        await travelRepository.createTrip(input);
        await get().loadTrips();
    },

    updateTrip: async (id, changes) => {
        await travelRepository.updateTrip(id, changes);
        if (get().selectedTrip?.id === id) {
            const refreshed = await travelRepository.getTripById(id);
            set({ selectedTrip: refreshed ?? null });
        }
        await get().loadTrips();
    },

    deleteTrip: async (id) => {
        await travelRepository.deleteTrip(id);
        if (get().selectedTrip?.id === id) {
            set({ selectedTrip: null, itinerary: [] });
        }
        await get().loadTrips();
    },

    selectTrip: async (trip) => {
        set({ selectedTrip: trip, itinerary: [] });
        if (!trip) return;
        try {
            const itinerary = await travelRepository.getItineraryByTrip(trip.id);
            set({ itinerary });
        } catch (err) {
            logger.error("Failed to load itinerary", err);
        }
    },

    addItineraryItem: async (input) => {
        const created = await travelRepository.addItineraryItem(input);
        set((s) => ({ itinerary: [...s.itinerary, created].sort((a, b) => a.date.localeCompare(b.date)) }));
    },

    updateItineraryItem: async (id, changes) => {
        const updated = await travelRepository.updateItineraryItem(id, changes);
        if (!updated) throw new Error("Item not found");
        set((s) => ({ itinerary: s.itinerary.map((i) => (i.id === id ? updated : i)).sort((a, b) => a.date.localeCompare(b.date)) }));
    },

    deleteItineraryItem: async (id) => {
        await travelRepository.deleteItineraryItem(id);
        set((s) => ({ itinerary: s.itinerary.filter((i) => i.id !== id) }));
    },
}));
