import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import type { CreateItineraryItemInput, CreateTripInput, ItineraryItem, Trip } from "@/features/travel/types";
import { ItineraryTagSchema } from "@/features/travel/schemas";

type TripRow = ReturnType<typeof getSchema>["trips"]["$inferSelect"];
type ItineraryRow = ReturnType<typeof getSchema>["itineraryItems"]["$inferSelect"];

function toTrip(row: TripRow): Trip {
  return { id: row.id, name: row.name, destination: row.destination, startDate: row.startDate, endDate: row.endDate, createdAt: row.createdAt };
}

function toItinerary(row: ItineraryRow): ItineraryItem {
  return { id: row.id, tripId: row.tripId, date: row.date, activity: row.activity, time: row.time, notes: row.notes, tag: ItineraryTagSchema.parse(row.tag) };
}

async function ownsTrip(userId: string, tripId: string): Promise<boolean> {
  const { trips } = getSchema();
  const [row] = await db.select({ id: trips.id }).from(trips).where(and(eq(trips.id, tripId), eq(trips.userId, userId))).limit(1);
  return !!row;
}

/* ── Trips ── */

export async function listTrips(userId: string): Promise<Trip[]> {
  const { trips } = getSchema();
  const rows = await db.select().from(trips).where(eq(trips.userId, userId)).orderBy(desc(trips.startDate));
  return rows.map(toTrip);
}

export async function getTripById(userId: string, id: string): Promise<Trip | null> {
  const { trips } = getSchema();
  const [row] = await db.select().from(trips).where(and(eq(trips.id, id), eq(trips.userId, userId))).limit(1);
  return row ? toTrip(row) : null;
}

export async function createTrip(userId: string, input: CreateTripInput): Promise<Trip> {
  const { trips } = getSchema();
  const row: TripRow = { id: crypto.randomUUID(), userId, ...input, createdAt: new Date().toISOString() };
  await db.insert(trips).values(row);
  return toTrip(row);
}

export async function updateTrip(userId: string, id: string, changes: Partial<CreateTripInput>): Promise<Trip | null> {
  const { trips } = getSchema();
  const update: Record<string, string> = {};
  if (changes.name !== undefined) update.name = changes.name;
  if (changes.destination !== undefined) update.destination = changes.destination;
  if (changes.startDate !== undefined) update.startDate = changes.startDate;
  if (changes.endDate !== undefined) update.endDate = changes.endDate;

  if (Object.keys(update).length === 0) return getTripById(userId, id);
  await db.update(trips).set(update).where(and(eq(trips.id, id), eq(trips.userId, userId)));
  return getTripById(userId, id);
}

export async function deleteTrip(userId: string, id: string): Promise<void> {
  const { trips } = getSchema();
  await db.delete(trips).where(and(eq(trips.id, id), eq(trips.userId, userId)));
}

export async function countTrips(userId: string): Promise<number> {
  const { trips } = getSchema();
  const [row] = await db.select({ value: count() }).from(trips).where(eq(trips.userId, userId));
  return row?.value ?? 0;
}

/* ── Itinerary ── */

export async function listItineraryByTrip(userId: string, tripId: string): Promise<ItineraryItem[]> {
  const { itineraryItems } = getSchema();
  if (!(await ownsTrip(userId, tripId))) return [];
  const rows = await db.select().from(itineraryItems).where(eq(itineraryItems.tripId, tripId)).orderBy(itineraryItems.date);
  return rows.map(toItinerary);
}

export async function addItineraryItem(userId: string, input: CreateItineraryItemInput): Promise<ItineraryItem> {
  const { itineraryItems } = getSchema();
  if (!(await ownsTrip(userId, input.tripId))) throw new Error("Trip not found");
  const row: ItineraryRow = { id: crypto.randomUUID(), ...input };
  await db.insert(itineraryItems).values(row);
  return toItinerary(row);
}

export async function updateItineraryItem(userId: string, id: string, changes: Partial<ItineraryItem>): Promise<ItineraryItem | null> {
  const { itineraryItems } = getSchema();
  const [item] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  if (!item || !(await ownsTrip(userId, item.tripId))) return null;

  const { id: _id, tripId: _tripId, ...allowed } = changes;
  await db.update(itineraryItems).set(allowed).where(eq(itineraryItems.id, id));
  const [updated] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  return updated ? toItinerary(updated) : null;
}

export async function deleteItineraryItem(userId: string, id: string): Promise<void> {
  const { itineraryItems } = getSchema();
  const [item] = await db.select().from(itineraryItems).where(eq(itineraryItems.id, id)).limit(1);
  if (!item || !(await ownsTrip(userId, item.tripId))) return;
  await db.delete(itineraryItems).where(eq(itineraryItems.id, id));
}

export async function listSharedTrips(userId: string): Promise<Array<Trip & { _shared: true; _permission: string; _ownerEmail: string }>> {
  const { shares, trips, users } = getSchema();
  const rows = await db
    .select({
      id: trips.id,
      name: trips.name,
      destination: trips.destination,
      startDate: trips.startDate,
      endDate: trips.endDate,
      createdAt: trips.createdAt,
      permission: shares.permission,
      ownerEmail: users.email,
    })
    .from(shares)
    .innerJoin(trips, eq(shares.itemId, trips.id))
    .innerJoin(users, eq(shares.ownerId, users.id))
    .where(and(eq(shares.sharedWith, userId), eq(shares.itemType, "trip")));

  return rows.map((r: typeof rows[number]) => ({
    id: r.id,
    name: r.name,
    destination: r.destination,
    startDate: r.startDate,
    endDate: r.endDate,
    createdAt: r.createdAt,
    _shared: true as const,
    _permission: r.permission,
    _ownerEmail: r.ownerEmail,
  }));
}
