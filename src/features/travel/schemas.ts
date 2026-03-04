import { z } from "zod/v4";

export const TripSchema = z.object({
    id: z.string(),
    name: z.string().min(1, "Trip name is required"),
    destination: z.string().min(1, "Destination is required"),
    startDate: z.string(),
    endDate: z.string(),
    createdAt: z.string(),
});

export type Trip = z.infer<typeof TripSchema>;

export const CreateTripSchema = TripSchema.omit({ id: true, createdAt: true });
export type CreateTripInput = z.infer<typeof CreateTripSchema>;

export const ItineraryItemSchema = z.object({
    id: z.string(),
    tripId: z.string(),
    day: z.number().int().positive(),
    activity: z.string().min(1, "Activity is required"),
    time: z.string(),
    notes: z.string(),
});

export type ItineraryItem = z.infer<typeof ItineraryItemSchema>;

export const CreateItineraryItemSchema = ItineraryItemSchema.omit({ id: true });
export type CreateItineraryItemInput = z.infer<typeof CreateItineraryItemSchema>;
