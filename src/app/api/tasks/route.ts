import { CreateTaskSchema } from "@/features/tasks/schemas";
import { createTask, listTasks } from "@/server/repositories/tasks";
import { jsonError, requireUserId } from "@/server/api";

export async function GET() {
  try {
    const userId = await requireUserId();
    const tasks = await listTasks(userId);
    return Response.json(tasks, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to load tasks", 500, error);
  }
}

export async function POST(request: Request) {
  try {
    const userId = await requireUserId();
    const body = await request.json();
    const parsed = CreateTaskSchema.safeParse(body);
    if (!parsed.success) {
      return jsonError("Invalid input", 400, parsed.error.flatten());
    }
    const task = await createTask(userId, parsed.data);
    return Response.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return jsonError("Unauthorized", 401);
    }
    return jsonError("Failed to create task", 500, error);
  }
}
