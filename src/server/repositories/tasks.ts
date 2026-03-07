import { and, count, desc, eq } from "drizzle-orm";
import { db } from "@/server/db";
import { tasks } from "@/server/db/schema";
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

type TaskRow = typeof tasks.$inferSelect;

function toClientTask(row: TaskRow): Task {
  const { userId: _userId, subtasks: rawSubtasks, ...task } = row;
  return {
    ...task,
    priority: TaskPriority.parse(task.priority),
    subtasks: parseSubtasks(rawSubtasks),
  };
}

export async function listTasks(userId: string): Promise<Task[]> {
  const rows = await db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
  return rows.map(toClientTask);
}

export async function getTaskById(userId: string, id: string): Promise<Task | null> {
  const [task] = await db
    .select()
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.id, id)))
    .limit(1);
  return task ? toClientTask(task) : null;
}

export async function createTask(userId: string, input: CreateTaskInput): Promise<Task> {
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
  await db.delete(tasks).where(and(eq(tasks.userId, userId), eq(tasks.id, id)));
}

export async function toggleTask(userId: string, id: string) {
  const task = await getTaskById(userId, id);
  if (!task) return null;
  return updateTask(userId, id, { completed: !task.completed });
}

export async function countTasks(userId: string): Promise<number> {
  const [row] = await db.select({ value: count() }).from(tasks).where(eq(tasks.userId, userId));
  return row?.value ?? 0;
}

export async function countCompletedTasks(userId: string): Promise<number> {
  const [row] = await db
    .select({ value: count() })
    .from(tasks)
    .where(and(eq(tasks.userId, userId), eq(tasks.completed, true)));
  return row?.value ?? 0;
}
