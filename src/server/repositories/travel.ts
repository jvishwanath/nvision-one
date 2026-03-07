import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { itineraryItems, trips } from "@/server/db/schema";
import type { CreateItineraryItemInput, CreateTripInput, ItineraryItem, Trip } from "@/features/travel/types";
import { ItineraryTagSchema } from "@/features/travel/schemas";

type TripRow = typeof trips.$inferSelect;
type ItineraryRow = typeof itineraryItems.$inferSelect;

function toClientTrip(row: TripRow): Trip {
  const { userId: _userId, ...trip } = row;
  return trip;
}

function toClientItinerary(row: ItineraryRow): ItineraryItem {
  return {
    ...row,
    tag: ItineraryTagSchema.parse(row.tag),
  };
}

export async function listTrips(userId: string): Promise<Trip[]> {
  const rows = await db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.startDate));
  return rows.map(toClientTrip);
}

export async function getTripById(userId: string, id: string): Promise<Trip | null> {
  const [trip] = await db
    .select()
    .from(trips)
    .where(and(eq(trips.userId, userId), eq(trips.id, id)))
    .limit(1);
  return trip ? toClientTrip(trip) : null;
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
  const created: TripRow = {
    id: crypto.randomUUID(),
    userId,
    name: input.name,
    destination: input.destination,
    startDate: input.startDate,
    endDate: input.endDate,
    createdAt: new Date().toISOString(),
  };
  await db.insert(trips).values(created);
  return toClientTrip(created);
}

export async function updateTrip(userId: string, id: string, changes: Partial<Trip>) {
  await db
    .update(trips)
    .set({
      name: changes.name,
      destination: changes.destination,
      startDate: changes.startDate,
      endDate: changes.endDate,
    })
    .where(and(eq(trips.userId, userId), eq(trips.id, id)));

  return getTripById(userId, id);
}

export async function deleteTrip(userId: string, id: string) {
  await db.delete(trips).where(and(eq(trips.userId, userId), eq(trips.id, id)));
}

export async function countTrips(userId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(trips).where(eq(trips.userId, userId));
  return row?.value ?? 0;
}

export async function listItineraryByTrip(userId: string, tripId: string): Promise<ItineraryItem[]> {
  const trip = await getTripById(userId, tripId);
  if (!trip) return [];
  const rows = await db.select().from(itineraryItems).where(eq(itineraryItems.tripId, tripId)).orderBy(itineraryItems.date);
  return rows.map(toClientItinerary);
}

export async function addItineraryItem(userId: string, input: CreateItineraryItemInput): Promise<ItineraryItem> {
  const trip = await getTripById(userId, input.tripId);
  if (!trip) {
    throw new Error("Trip not found");
  }

  const created: ItineraryItem = {
    id: crypto.randomUUID(),
    tripId: input.tripId,
    date: input.date,
    activity: input.activity,
    time: input.time,
    notes: input.notes,
    tag: input.tag,
  };
  await db.insert(itineraryItems).values(created);
  return created;
}

export async function updateItineraryItem(userId: string, id: string, changes: Partial<ItineraryItem>) {
  const [item] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  if (!item) return null;

  const trip = await getTripById(userId, item.tripId);
  if (!trip) return null;

  const { id: _id, tripId: _tripId, ...allowed } = changes;
  await db.update(itineraryItems).set(allowed).where(eq(itineraryItems.id, id));

  const [updated] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  return updated ? toClientItinerary(updated) : null;
}

export async function deleteItineraryItem(userId: string, id: string) {
  const [item] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  if (!item) return;

  const trip = await getTripById(userId, item.tripId);
  if (!trip) return;

  await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
}
