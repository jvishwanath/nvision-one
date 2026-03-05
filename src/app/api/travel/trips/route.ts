import { CreateTripSchema } from "@/features/travel/schemas";
import { createTrip, listTrips } from "@/server/repositories/travel";
import { jsonError, requireUserId } from "@/server/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const trips = await listTrips(userId);
    return Response.json(trips);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load trips", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = CreateTripSchema.safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const trip = await createTrip(userId, parsed.data);
    return Response.json(trip, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to create trip", 500, error);
  }
}
