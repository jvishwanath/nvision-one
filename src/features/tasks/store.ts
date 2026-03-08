import { create } from "zustand";
import type { Task, CreateTaskInput } from "./types";
import { taskRepository } from "./repository";
import { logger } from "@/lib/logger";
import {
    encryptTaskFields,
    decryptTaskFields,
    decryptArray,
} from "@/lib/crypto/entity-crypto";

type TaskSortMode = "created" | "dueDate" | "priority";

interface TaskState {
    tasks: Task[];
    loading: boolean;
    filter: "all" | "active" | "completed" | "today";
    priorityFilter: Task["priority"] | "all";
    sortMode: TaskSortMode;
    loadTasks: () => Promise<void>;
    addTask: (input: CreateTaskInput) => Promise<void>;
    updateTask: (id: string, changes: Partial<Task>) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;
    toggleTask: (id: string) => Promise<void>;
    addSubtask: (taskId: string, title: string) => Promise<void>;
    toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    removeSubtask: (taskId: string, subtaskId: string) => Promise<void>;
    setFilter: (filter: "all" | "active" | "completed" | "today") => void;
    setPriorityFilter: (priority: Task["priority"] | "all") => void;
    setSortMode: (mode: TaskSortMode) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [],
    loading: false,
    filter: "all",
    priorityFilter: "all",
    sortMode: "created" as TaskSortMode,

    loadTasks: async () => {
        set({ loading: true });
        try {
            const raw = await taskRepository.getAll();
            const tasks = await decryptArray(raw, decryptTaskFields);
            set({ tasks, loading: false });
        } catch (err) {
            logger.error("Failed to load tasks", err);
            set({ loading: false });
        }
    },

    addTask: async (input) => {
        try {
            const encrypted = await encryptTaskFields({ ...input, description: input.description ?? "" });
            const task = await taskRepository.create({ ...input, title: encrypted.title, description: encrypted.description });
            const decrypted = await decryptTaskFields(task);
            set((state) => ({ tasks: [decrypted, ...state.tasks] }));
        } catch (err) {
            logger.error("Failed to add task", err);
            throw err;
        }
    },

    updateTask: async (id, changes) => {
        try {
            const toEncrypt = { title: "", description: "", ...changes };
            const encrypted = await encryptTaskFields(toEncrypt);
            const finalChanges: Partial<Task> = { ...changes };
            if (changes.title !== undefined) finalChanges.title = encrypted.title;
            if (changes.description !== undefined) finalChanges.description = encrypted.description;
            const updated = await taskRepository.update(id, finalChanges);
            const decrypted = await decryptTaskFields(updated);
            set((state) => ({
                tasks: state.tasks.map((task) => (task.id === id ? decrypted : task)),
            }));
        } catch (err) {
            logger.error("Failed to update task", err);
        }
    },

    deleteTask: async (id) => {
        try {
            await taskRepository.remove(id);
            set((state) => ({ tasks: state.tasks.filter((task) => task.id !== id) }));
        } catch (err) {
            logger.error("Failed to delete task", err);
        }
    },

    toggleTask: async (id) => {
        try {
            const updated = await taskRepository.toggleComplete(id);
            set((state) => ({
                tasks: state.tasks.map((task) => (task.id === id ? updated : task)),
            }));
        } catch (err) {
            logger.error("Failed to toggle task", err);
        }
    },

    addSubtask: async (taskId, title) => {
        try {
            const task = get().tasks.find((t) => t.id === taskId);
            if (!task) return;
            const subtask = { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title, completed: false };
            const subtasks = [...(task.subtasks ?? []), subtask];
            await taskRepository.update(taskId, { subtasks });
            set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t) }));
        } catch (err) {
            logger.error("Failed to add subtask", err);
        }
    },

    toggleSubtask: async (taskId, subtaskId) => {
        try {
            const task = get().tasks.find((t) => t.id === taskId);
            if (!task) return;
            const subtasks = (task.subtasks ?? []).map((s) => s.id === subtaskId ? { ...s, completed: !s.completed } : s);
            await taskRepository.update(taskId, { subtasks });
            set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t) }));
        } catch (err) {
            logger.error("Failed to toggle subtask", err);
        }
    },

    removeSubtask: async (taskId, subtaskId) => {
        try {
            const task = get().tasks.find((t) => t.id === taskId);
            if (!task) return;
            const subtasks = (task.subtasks ?? []).filter((s) => s.id !== subtaskId);
            await taskRepository.update(taskId, { subtasks });
            set((s) => ({ tasks: s.tasks.map((t) => t.id === taskId ? { ...t, subtasks } : t) }));
        } catch (err) {
            logger.error("Failed to remove subtask", err);
        }
    },

    setFilter: (filter) => set({ filter }),
    setPriorityFilter: (priorityFilter) => set({ priorityFilter }),
    setSortMode: (sortMode) => set({ sortMode }),
}));
