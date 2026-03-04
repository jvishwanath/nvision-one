import { create } from "zustand";
import type { Task, CreateTaskInput } from "./types";
import { taskRepository } from "./repository";
import { logger } from "@/lib/logger";

interface TaskState {
    tasks: Task[];
    loading: boolean;
    filter: "all" | "active" | "completed";
    priorityFilter: Task["priority"] | "all";
    loadTasks: () => Promise<void>;
    addTask: (input: CreateTaskInput) => Promise<void>;
    updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    setFilter: (filter: "all" | "active" | "completed") => void;
    setPriorityFilter: (priority: Task["priority"] | "all") => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    loading: false,
    filter: "all",
    priorityFilter: "all",

    loadTasks: async () => {
        set({ loading: true });
        try {
            const tasks = await taskRepository.getAll();
            set({ tasks, loading: false });
        } catch (err) {
            logger.error("Failed to load tasks", err);
            set({ loading: false });
        }
    },

    addTask: async (input) => {
        try {
            await taskRepository.create(input);
            await get().loadTasks();
        } catch (err) {
            logger.error("Failed to add task", err);
        }
    },

    updateTask: async (id, changes) => {
        try {
            await taskRepository.update(id, changes);
            await get().loadTasks();
        } catch (err) {
            logger.error("Failed to update task", err);
        }
    },

    deleteTask: async (id) => {
        try {
            await taskRepository.remove(id);
            await get().loadTasks();
        } catch (err) {
            logger.error("Failed to delete task", err);
        }
    },

    toggleTask: async (id) => {
        try {
            await taskRepository.toggleComplete(id);
            await get().loadTasks();
        } catch (err) {
            logger.error("Failed to toggle task", err);
        }
    },

    setFilter: (filter) => set({ filter }),
    setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
}));
