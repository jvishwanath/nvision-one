"use client";

import { useEffect, useState, useMemo } from "react";
import { Plus } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTaskStore } from "../store";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import type { Task, CreateTaskInput } from "../types";

export function TaskList() {
    const searchParams = useSearchParams();
    const { tasks, loading, filter, priorityFilter, loadTasks, addTask, updateTask, toggleTask, deleteTask, setFilter } =
        useTaskStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setEditingTask(null);
            setFormOpen(true);
        }
    }, [searchParams]);

    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (filter === "active") result = result.filter((t) => !t.completed);
        if (filter === "completed") result = result.filter((t) => t.completed);
        if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter);
        return result;
    }, [tasks, filter, priorityFilter]);

    const filters = ["all", "active", "completed"] as const;

    const handleSubmit = async (data: CreateTaskInput) => {
        if (editingTask) {
            await updateTask(editingTask.id, data);
            setEditingTask(null);
            return;
        }
        await addTask(data);
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center gap-2">
                {filters.map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${filter === f
                                ? "gradient-primary text-white shadow-md"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                    >
                        {f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                ))}
            </div>

            {/* Task Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-12">
                    <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
            ) : filteredTasks.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-muted-foreground text-sm">No tasks yet</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Tap + to create one</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={toggleTask}
                            onDelete={deleteTask}
                            onEdit={(selectedTask) => {
                                setEditingTask(selectedTask);
                                setFormOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {/* FAB */}
            <button
                onClick={() => {
                    setEditingTask(null);
                    setFormOpen(true);
                }}
                className="fixed bottom-20 right-4 h-14 w-14 gradient-primary rounded-2xl shadow-xl shadow-primary/30 flex items-center justify-center text-white hover:shadow-primary/50 active:scale-90 transition-all duration-200 z-40"
            >
                <Plus className="h-6 w-6" />
            </button>

            <TaskForm
                open={formOpen}
                onClose={() => {
                    setFormOpen(false);
                    setEditingTask(null);
                }}
                onSubmit={handleSubmit}
                initialData={editingTask ?? undefined}
            />
        </div>
    );
}
