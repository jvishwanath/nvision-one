import { z } from "zod";
import { TaskSchema } from "@/features/tasks/schemas";
import { deleteTask, getTaskById, updateTask } from "@/server/repositories/tasks";
import { jsonError, requireUserId } from "@/server/api";

const paramsSchema = z.object({ id: z.string().min(1) });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const task = await getTaskById(userId, params.id);
    if (!task) return jsonError("Not found", 404);
    return Response.json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to load task", 500, error);
  }
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    const body = await request.json();
    const parsed = TaskSchema.partial().safeParse(body);
    if (!parsed.success) return jsonError("Invalid input", 400, parsed.error.flatten());
    const task = await updateTask(userId, params.id, parsed.data);
    if (!task) return jsonError("Not found", 404);
    return Response.json(task);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to update task", 500, error);
  }
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    const userId = await requireUserId();
    const params = paramsSchema.parse(await context.params);
    await deleteTask(userId, params.id);
    return new Response(null, { status: 204 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") return jsonError("Unauthorized", 401);
    return jsonError("Failed to delete task", 500, error);
  }
}
