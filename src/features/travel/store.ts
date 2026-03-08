import { create } from "zustand";
import type { Trip, CreateTripInput, ItineraryItem, CreateItineraryItemInput } from "./types";
import { travelRepository } from "./repository";
import { logger } from "@/lib/logger";
import {
    encryptTripFields,
    decryptTripFields,
    encryptItineraryFields,
    decryptItineraryFields,
    decryptArray,
} from "@/lib/crypto/entity-crypto";

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
            const raw = await travelRepository.getAllTrips();
            const trips = await decryptArray(raw, decryptTripFields);
            set({ trips });
        } catch (err) {
            logger.error("Failed to load trips", err);
        } finally {
            set({ loading: false });
        }
    },

    addTrip: async (input) => {
        try {
            const encrypted = await encryptTripFields(input);
            await travelRepository.createTrip(encrypted);
            await get().loadTrips();
        } catch (err) {
            logger.error("Failed to add trip", err);
            throw err;
        }
    },

    updateTrip: async (id, changes) => {
        const toEncrypt = { name: "", destination: "", ...changes };
        const encrypted = await encryptTripFields(toEncrypt);
        const finalChanges: Partial<Trip> = { ...changes };
        if (changes.name !== undefined) finalChanges.name = encrypted.name;
        if (changes.destination !== undefined) finalChanges.destination = encrypted.destination;
        await travelRepository.updateTrip(id, finalChanges);
        if (get().selectedTrip?.id === id) {
            const refreshed = await travelRepository.getTripById(id);
            set({ selectedTrip: refreshed ? await decryptTripFields(refreshed) : null });
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
            const raw = await travelRepository.getItineraryByTrip(trip.id);
            const itinerary = await decryptArray(raw, decryptItineraryFields);
            set({ itinerary });
        } catch (err) {
            logger.error("Failed to load itinerary", err);
        }
    },

    addItineraryItem: async (input) => {
        const encrypted = await encryptItineraryFields(input);
        const created = await travelRepository.addItineraryItem(encrypted);
        const decrypted = await decryptItineraryFields(created);
        set((s) => ({ itinerary: [...s.itinerary, decrypted].sort((a, b) => a.date.localeCompare(b.date)) }));
    },

    updateItineraryItem: async (id, changes) => {
        const toEncrypt = { activity: "", notes: "", ...changes };
        const encrypted = await encryptItineraryFields(toEncrypt);
        const finalChanges: Partial<ItineraryItem> = { ...changes };
        if (changes.activity !== undefined) finalChanges.activity = encrypted.activity;
        if (changes.notes !== undefined) finalChanges.notes = encrypted.notes;
        const updated = await travelRepository.updateItineraryItem(id, finalChanges);
        if (!updated) throw new Error("Item not found");
        const decrypted = await decryptItineraryFields(updated);
        set((s) => ({ itinerary: s.itinerary.map((i) => (i.id === id ? decrypted : i)).sort((a, b) => a.date.localeCompare(b.date)) }));
    },

    deleteItineraryItem: async (id) => {
        await travelRepository.deleteItineraryItem(id);
        set((s) => ({ itinerary: s.itinerary.filter((i) => i.id !== id) }));
    },
}));
