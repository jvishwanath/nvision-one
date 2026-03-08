"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, ArrowLeft, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import { taskRepository } from "@/features/tasks/repository";
import { decryptTaskFields } from "@/lib/crypto/entity-crypto";
import { useTaskStore } from "@/features/tasks/store";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import type { Task } from "@/features/tasks/types";

const priorityVariant: Record<Task["priority"], "default" | "primary" | "success" | "warning" | "destructive"> = {
    low: "default",
    medium: "primary",
    high: "warning",
    urgent: "destructive",
};

export default function TaskDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const { toggleTask, deleteTask, toggleSubtask } = useTaskStore();
    const [task, setTask] = useState<Task | null>(null);
    const [loading, setLoading] = useState(true);
    const [confirmDelete, setConfirmDelete] = useState(false);

    useEffect(() => {
        async function load() {
            try {
                const raw = await taskRepository.getById(params.id);
                if (!raw) { setTask(null); return; }
                const decrypted = await decryptTaskFields(raw) as Task;
                setTask(decrypted);
            } catch {
                setTask(null);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, [params.id]);

    const handleToggle = async () => {
        if (!task) return;
        await toggleTask(task.id);
        setTask((prev) => prev ? { ...prev, completed: !prev.completed } : prev);
    };

    const handleToggleSubtask = async (subtaskId: string) => {
        if (!task) return;
        await toggleSubtask(task.id, subtaskId);
        setTask((prev) => {
            if (!prev) return prev;
            const subtasks = (prev.subtasks ?? []).map((s) =>
                s.id === subtaskId ? { ...s, completed: !s.completed } : s
            );
            return { ...prev, subtasks };
        });
    };

    const handleDelete = async () => {
        if (!task) return;
        await deleteTask(task.id);
        router.replace("/tasks");
    };

    if (loading) {
        return (
            <div className="p-4 pt-14 space-y-4">
                <div className="h-6 w-32 bg-muted animate-pulse rounded-lg" />
                <div className="h-40 bg-muted animate-pulse rounded-2xl" />
            </div>
        );
    }

    if (!task) {
        return (
            <div className="p-4 pt-14 text-center">
                <p className="text-muted-foreground">Task not found</p>
                <button onClick={() => router.replace("/tasks")} className="mt-4 text-sm text-primary underline">
                    Back to tasks
                </button>
            </div>
        );
    }

    const isOverdue = !task.completed && !!task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
    const subtasks = task.subtasks ?? [];
    const doneCount = subtasks.filter((s) => s.completed).length;

    return (
        <div className="p-4 pb-24 space-y-4">
            <div className="flex items-center gap-3">
                <button
                    onClick={() => router.back()}
                    className="h-9 w-9 rounded-xl bg-secondary flex items-center justify-center hover:bg-secondary/80 transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <h1 className="text-lg font-semibold flex-1">Task Detail</h1>
                <button
                    onClick={() => setConfirmDelete(true)}
                    className="h-9 w-9 rounded-xl bg-destructive/10 flex items-center justify-center hover:bg-destructive/20 transition-colors"
                >
                    <Trash2 className="h-4 w-4 text-destructive" />
                </button>
            </div>

            <Card className="border-0 shadow-md">
                <div className="space-y-4">
                    <div className="flex items-start gap-3">
                        <button
                            onClick={handleToggle}
                            className={cn(
                                "mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                                task.completed
                                    ? "border-primary bg-primary text-white"
                                    : "border-muted-foreground/30 hover:border-primary"
                            )}
                        >
                            {task.completed && <Check className="h-3.5 w-3.5" />}
                        </button>
                        <h2
                            className={cn(
                                "text-2xl font-bold leading-tight",
                                task.completed && "line-through text-muted-foreground"
                            )}
                        >
                            {task.title}
                        </h2>
                    </div>

                    <div className="flex items-center gap-3">
                        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                        {task.dueDate && (
                            <span className={`flex items-center gap-1 text-xs ${isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
                                <Calendar className="h-3.5 w-3.5" />
                                {isOverdue ? "Overdue · " : ""}
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                    weekday: "short",
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )}
                    </div>

                    {task.description && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                            <div className="text-sm text-foreground">{renderMarkdown(task.description)}</div>
                        </div>
                    )}

                    {subtasks.length > 0 && (
                        <div>
                            <p className="text-xs font-medium text-muted-foreground mb-2">
                                Subtasks ({doneCount}/{subtasks.length})
                            </p>
                            <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
                                />
                            </div>
                            <div className="space-y-2">
                                {subtasks.map((st) => (
                                    <button
                                        key={st.id}
                                        onClick={() => handleToggleSubtask(st.id)}
                                        className="flex items-center gap-2 w-full text-left"
                                    >
                                        <div
                                            className={cn(
                                                "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                                st.completed
                                                    ? "border-primary bg-primary text-white"
                                                    : "border-muted-foreground/30 hover:border-primary"
                                            )}
                                        >
                                            {st.completed && <Check className="h-2.5 w-2.5" />}
                                        </div>
                                        <span className={cn("text-sm", st.completed && "line-through text-muted-foreground")}>
                                            {st.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <p className="text-[10px] text-muted-foreground/60">
                        Created {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                </div>
            </Card>

            <ConfirmDialog
                open={confirmDelete}
                message="This task will be permanently deleted."
                onConfirm={handleDelete}
                onCancel={() => setConfirmDelete(false)}
            />
        </div>
    );
}
