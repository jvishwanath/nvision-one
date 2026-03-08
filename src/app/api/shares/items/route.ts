import { requireUserId, jsonError } from "@/server/api";
import { listSharedNotes } from "@/server/repositories/notes";
import { listSharedTasks } from "@/server/repositories/tasks";
import { listSharedTrips } from "@/server/repositories/travel";

export async function GET(request: Request) {
  try {
    const userId = await requireUserId();
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "note") {
      const notes = await listSharedNotes(userId);
      return Response.json(notes);
    }
    if (type === "task") {
      const tasks = await listSharedTasks(userId);
      return Response.json(tasks);
    }
    if (type === "trip") {
      const trips = await listSharedTrips(userId);
      return Response.json(trips);
    }

    const [notes, tasks, trips] = await Promise.all([
      listSharedNotes(userId),
      listSharedTasks(userId),
      listSharedTrips(userId),
    ]);

    return Response.json({ notes, tasks, trips });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to fetch shared items", 500);
  }
}
