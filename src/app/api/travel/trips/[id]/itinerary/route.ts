import { z } from "zod";
import { CreateItineraryItemSchema } from "@/features/travel/schemas";
import { addItineraryItem, listItineraryByTrip } from "@/server/repositories/travel";
import { jsonError, requireUserId } from "@/server/api";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const items = await listItineraryByTrip(userId, params.id);
    return Response.json(items);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load itinerary", 500, error);
  }
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const body = await request.json();
    const parsed = CreateItineraryItemSchema.safeParse({ ...body, tripId: params.id });
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const item = await addItineraryItem(userId, parsed.data);
    return Response.json(item, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to add itinerary item", 500, error);
  }
}
