import { db } from "@/lib/db";
import type { Task, CreateTaskInput } from "./types";
import { generateId } from "@/lib/utils";
import { taskHttpRepository } from "./repository.http";

async function requireTask(id: string): Promise<Task> {
    const task = await db.tasks.get(id);
    if (!task) {
        throw new Error(`Task with id ${id} not found`);
    }
    return task;
}

const taskLocalRepository = {
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

    async update(id: string, changes: Partial<Task>): Promise<Task> {
        await db.tasks.update(id, { ...changes, updatedAt: new Date().toISOString() });
        return requireTask(id);
    },

    async remove(id: string): Promise<void> {
        await db.tasks.delete(id);
    },

    async toggleComplete(id: string): Promise<Task> {
        const task = await requireTask(id);
        await db.tasks.update(id, {
            completed: !task.completed,
            updatedAt: new Date().toISOString(),
        });
        return requireTask(id);
    },

    async getByPriority(priority: Task["priority"]): Promise<Task[]> {
        return db.tasks.where("priority").equals(priority).toArray();
    },

    async count(): Promise<number> {
        return db.tasks.count();
    },

    async countCompleted(): Promise<number> {
        return db.tasks.filter((task) => task.completed).count();
    },
};

const useServerPersistence = process.env.NEXT_PUBLIC_PERSISTENCE !== "local";

export const taskRepository = useServerPersistence ? taskHttpRepository : taskLocalRepository;
