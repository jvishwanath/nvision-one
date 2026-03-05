import { z } from "zod";
import { jsonError, requireUserId } from "@/server/api";
import { toggleTask } from "@/server/repositories/tasks";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function PATCH(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const task = await toggleTask(userId, params.id);
    if (!task) return jsonError("Not found", 404);
    return Response.json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to toggle task", 500, error);
  }
}
