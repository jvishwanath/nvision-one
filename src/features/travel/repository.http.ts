import { apiClient } from "@/lib/api-client";
import type { CreateItineraryItemInput, CreateTripInput, ItineraryItem, Trip } from "./types";

export const travelHttpRepository = {
  getAllTrips: () => apiClient<Trip[]>("/api/travel/trips"),
  getTripById: (id: string) => apiClient<Trip>(`/api/travel/trips/${id}`),
  createTrip: (input: CreateTripInput) =>
    apiClient<Trip>("/api/travel/trips", { method: "POST", body: JSON.stringify(input) }),
  updateTrip: (id: string, changes: Partial<Trip>) =>
    apiClient<Trip>(`/api/travel/trips/${id}`, { method: "PATCH", body: JSON.stringify(changes) }),
  deleteTrip: (id: string) => apiClient<void>(`/api/travel/trips/${id}`, { method: "DELETE" }),
  countTrips: async () => (await travelHttpRepository.getAllTrips()).length,
  getItineraryByTrip: (tripId: string) => apiClient<ItineraryItem[]>(`/api/travel/trips/${tripId}/itinerary`),
  addItineraryItem: (input: CreateItineraryItemInput) =>
    apiClient<ItineraryItem>(`/api/travel/trips/${input.tripId}/itinerary`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  deleteItineraryItem: (id: string) => apiClient<void>(`/api/travel/itinerary/${id}`, { method: "DELETE" }),
};
