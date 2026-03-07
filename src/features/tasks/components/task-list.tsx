"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import { Plus, ArrowUpDown, Calendar, Flag } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTaskStore } from "../store";
import { TaskCard } from "./task-card";
import { TaskForm } from "./task-form";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { usePullToRefresh } from "@/hooks/use-pull-to-refresh";
import { PullIndicator } from "@/components/ui/pull-indicator";
import { EmptyState } from "@/components/ui/empty-state";
import { ListSkeleton } from "@/components/ui/skeleton";
import { CheckSquare } from "lucide-react";
import type { Task, CreateTaskInput } from "../types";

export function TaskList() {
    const searchParams = useSearchParams();
    const { tasks, loading, filter, priorityFilter, sortMode, loadTasks, addTask, updateTask, toggleTask, deleteTask, addSubtask, toggleSubtask, removeSubtask, setFilter, setSortMode } =
        useTaskStore();
    const [formOpen, setFormOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<Task | null>(null);
    const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);

    const handlePullRefresh = useCallback(async () => { await loadTasks(); }, [loadTasks]);
    const { pulling, refreshing, pullDistance } = usePullToRefresh({ onRefresh: handlePullRefresh });

    useEffect(() => {
        loadTasks();
    }, [loadTasks]);

    useEffect(() => {
        if (searchParams.get("create") === "true") {
            setEditingTask(null);
            setFormOpen(true);
        }
    }, [searchParams]);

    const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

    const filteredTasks = useMemo(() => {
        let result = tasks;
        if (filter === "active") result = result.filter((t) => !t.completed);
        else if (filter === "completed") result = result.filter((t) => t.completed);
        else if (filter === "today") result = result.filter((t) => !t.completed && t.dueDate === todayStr);
        if (priorityFilter !== "all") result = result.filter((t) => t.priority === priorityFilter);

        const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        const sorted = [...result];
        if (sortMode === "dueDate") {
            sorted.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);
            });
        } else if (sortMode === "priority") {
            sorted.sort((a, b) => (priorityOrder[a.priority] ?? 9) - (priorityOrder[b.priority] ?? 9));
        }
        return sorted;
    }, [tasks, filter, priorityFilter, sortMode, todayStr]);

    const filters = ["all", "active", "today", "completed"] as const;
    const sortOptions = [
        { mode: "created" as const, icon: ArrowUpDown, label: "Created" },
        { mode: "dueDate" as const, icon: Calendar, label: "Due date" },
        { mode: "priority" as const, icon: Flag, label: "Priority" },
    ];

    const handleSubmit = async (data: CreateTaskInput, subtasks: import("../types").Subtask[]) => {
        if (editingTask) {
            await updateTask(editingTask.id, { ...data, subtasks });
            setEditingTask(null);
            toast("Task updated");
            return;
        }
        await addTask({ ...data, subtasks });
        toast("Task created");
    };

    const handleConfirmDelete = async () => {
        if (!deletingTaskId) return;
        await deleteTask(deletingTaskId);
        setDeletingTaskId(null);
        toast("Task deleted");
    };

    return (
        <div className="space-y-4">
            <PullIndicator pulling={pulling} refreshing={refreshing} pullDistance={pullDistance} />

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

            {/* Sort */}
            <div className="flex items-center gap-1">
                <span className="text-[10px] text-muted-foreground mr-1">Sort:</span>
                {sortOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                        <button
                            key={opt.mode}
                            onClick={() => setSortMode(opt.mode)}
                            className={`flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all ${sortMode === opt.mode
                                    ? "bg-accent text-foreground"
                                    : "text-muted-foreground hover:text-foreground"
                                }`}
                        >
                            <Icon className="h-3 w-3" />
                            {opt.label}
                        </button>
                    );
                })}
            </div>

            {/* Task Cards */}
            {loading ? (
                <ListSkeleton count={4} />
            ) : filteredTasks.length === 0 ? (
                <EmptyState icon={CheckSquare} title="No tasks yet" subtitle="Tap + to create your first task" />
            ) : (
                <div className="space-y-2">
                    {filteredTasks.map((task) => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            onToggle={(id) => { toggleTask(id); toast("Task toggled"); }}
                            onDelete={(id) => setDeletingTaskId(id)}
                            onEdit={(selectedTask) => {
                                setEditingTask(selectedTask);
                                setFormOpen(true);
                            }}
                            onToggleSubtask={toggleSubtask}
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

            <ConfirmDialog
                open={deletingTaskId !== null}
                message="This task will be permanently deleted."
                onConfirm={handleConfirmDelete}
                onCancel={() => setDeletingTaskId(null)}
            />
        </div>
    );
}
