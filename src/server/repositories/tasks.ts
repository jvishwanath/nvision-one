import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { getSchema } from "@/server/db/schema-shared";
import type { CreateTaskInput, Task, Subtask } from "@/features/tasks/types";
import { TaskPriority } from "@/features/tasks/schemas";

function parseSubtasks(raw: string | null | undefined): Subtask[] {
  if (!raw) return [];
  try {
    return JSON.parse(raw) as Subtask[];
  } catch {
    return [];
  }
}

type TaskRow = ReturnType<typeof getSchema>["tasks"]["$inferSelect"];

function toClientTask(row: TaskRow): Task {
  const { userId: _userId, subtasks: rawSubtasks, ...task } = row;
  return {
    ...task,
    priority: TaskPriority.parse(task.priority),
    subtasks: parseSubtasks(rawSubtasks),
  };
}

export async function listTasks(userId: string): Promise<Task[]> {
  const { tasks } = getSchema();
  const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  return rows.map(toClientTask);
}

export async function getTaskById(userId: string, id: string): Promise<Task | null> {
  const { tasks } = getSchema();
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
    .limit(1);
  return task ? toClientTask(task) : null;
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
  const { tasks } = getSchema();
  const now = new Date().toISOString();
  const created: TaskRow = {
    id: crypto.randomUUID(),
    userId,
    title: input.title,
    description: input.description,
    priority: input.priority,
    dueDate: input.dueDate,
    completed: false,
    subtasks: JSON.stringify(input.subtasks ?? []),
    createdAt: now,
    updatedAt: now,
  };
  await db.insert(tasks).values(created);
  return toClientTask(created);
}

export async function updateTask(userId: string, id: string, changes: Partial<Task>) {
  const { tasks } = getSchema();
  const { subtasks, ...rest } = changes;
  const dbChanges: Record<string, unknown> = { ...rest, updatedAt: new Date().toISOString() };
  if (subtasks !== undefined) {
    dbChanges.subtasks = JSON.stringify(subtasks);
  }
  await db
    .update(tasks)
    .set(dbChanges)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)));

  return getTaskById(userId, id);
}

export async function deleteTask(userId: string, id: string) {
  const { tasks } = getSchema();
  await db.delete(tasks).where(and(eq(tasks.userId, userId), eq(tasks.id, id)));
}

export async function toggleTask(userId: string, id: string) {
  const task = await getTaskById(userId, id);
  if (!task) return null;
  return updateTask(userId, id, { completed: !task.completed });
}

export async function countTasks(userId: string): Promise<number> {
  const { tasks } = getSchema();
  const [row] = await db.select({ value: count() }).from(tasks).where(eq(tasks.userId, userId));
  return row?.value ?? 0;
}

export async function countCompletedTasks(userId: string): Promise<number> {
  const { tasks } = getSchema();
  const [row] = await db
    .select({ value: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.completed, true)));
  return row?.value ?? 0;
}

export async function listSharedTasks(userId: string): Promise<Array<Task & { _shared: true; _permission: string; _ownerEmail: string }>> {
  const { shares, tasks, users } = getSchema();
  const rows = await db
    .select({
      id: tasks.id,
      userId: tasks.userId,
      title: tasks.title,
      description: tasks.description,
      priority: tasks.priority,
      dueDate: tasks.dueDate,
      completed: tasks.completed,
      subtasks: tasks.subtasks,
      createdAt: tasks.createdAt,
      updatedAt: tasks.updatedAt,
      permission: shares.permission,
      ownerEmail: users.email,
    })
    .from(shares)
    .innerJoin(tasks, eq(shares.itemId, tasks.id))
    .innerJoin(users, eq(shares.ownerId, users.id))
    .where(and(eq(shares.sharedWith, userId), eq(shares.itemType, "task")));

  return rows.map((r: typeof rows[number]) => ({
    ...toClientTask(r as TaskRow),
    _shared: true as const,
    _permission: r.permission,
    _ownerEmail: r.ownerEmail,
  }));
}
