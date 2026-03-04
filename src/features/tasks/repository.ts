import { db } from "@/lib/db";
import type { Task, CreateTaskInput } from "./types";
import { generateId } from "@/lib/utils";

export const taskRepository = {
    async getAll(): Promise<Task[]> {
        return db.tasks.orderBy("createdAt").reverse().toArray();
    },

    async getById(id: string): Promise<Task | undefined> {
        return db.tasks.get(id);
    },

    async create(input: CreateTaskInput): Promise<Task> {
        const now = new Date().toISOString();
        const task: Task = {
            ...input,
            id: generateId(),
            completed: false,
            createdAt: now,
            updatedAt: now,
        };
        await db.tasks.add(task);
        return task;
    },

    async update(id: string, changes: Partial<Task>): Promise<void> {
        await db.tasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
    },

    async remove(id: string): Promise<void> {
        await db.tasks.delete(id);
    },

    async toggleComplete(id: string): Promise<void> {
        const task = await db.tasks.get(id);
        if (task) {
            await db.tasks.update(id, {
                completed: !task.completed,
                updatedAt: new Date().toISOString(),
            });
        }
    },

    async getByPriority(priority: Task["priority"]): Promise<Task[]> {
        return db.tasks.where("priority").equals(priority).toArray();
    },

    async count(): Promise<number> {
        return db.tasks.count();
    },

    async countCompleted(): Promise<number> {
        return db.tasks.where("completed").equals(1).count();
    },
};
