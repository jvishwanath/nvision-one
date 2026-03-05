import { z } from "zod";

export const TaskPriority = z.enum(["low", "medium", "high", "urgent"]);
export type TaskPriority = z.infer<typeof TaskPriority>;

export const TaskSchema = z.object({
    id: z.string(),
    title: z.string().min(1, "Title is required"),
    description: z.string(),
    priority: TaskPriority,
    dueDate: z.string().nullable(),
    completed: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.omit({
    id: true,
    createdAt: true,
    updatedAt: true,
    completed: true,
});

export type CreateTaskInput = z.infer<typeof CreateTaskSchema>;
