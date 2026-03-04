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
    deleteTrip: (id: string) => Promise<void>;
    selectTrip: (trip: Trip | null) => Promise<void>;
    addItineraryItem: (input: CreateItineraryItemInput) => Promise<void>;
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
            set({ trips, loading: false });
        } catch (err) {
            logger.error("Failed to load trips", err);
            set({ loading: false });
        }
    },

    addTrip: async (input) => {
        try {
            await travelRepository.createTrip(input);
            await get().loadTrips();
        } catch (err) {
            logger.error("Failed to add trip", err);
        }
    },

    deleteTrip: async (id) => {
        try {
            await travelRepository.deleteTrip(id);
            if (get().selectedTrip?.id === id) {
                set({ selectedTrip: null, itinerary: [] });
            }
            await get().loadTrips();
        } catch (err) {
            logger.error("Failed to delete trip", err);
        }
    },

    selectTrip: async (trip) => {
        set({ selectedTrip: trip });
        if (trip) {
            try {
                const itinerary = await travelRepository.getItineraryByTrip(trip.id);
                set({ itinerary });
            } catch (err) {
                logger.error("Failed to load itinerary", err);
            }
        } else {
            set({ itinerary: [] });
        }
    },

    addItineraryItem: async (input) => {
        try {
            await travelRepository.addItineraryItem(input);
            const { selectedTrip } = get();
            if (selectedTrip) {
                const itinerary = await travelRepository.getItineraryByTrip(selectedTrip.id);
                set({ itinerary });
            }
        } catch (err) {
            logger.error("Failed to add itinerary item", err);
        }
    },

    deleteItineraryItem: async (id) => {
        try {
            await travelRepository.deleteItineraryItem(id);
            const { selectedTrip } = get();
            if (selectedTrip) {
                const itinerary = await travelRepository.getItineraryByTrip(selectedTrip.id);
                set({ itinerary });
            }
        } catch (err) {
            logger.error("Failed to delete itinerary item", err);
        }
    },
}));
