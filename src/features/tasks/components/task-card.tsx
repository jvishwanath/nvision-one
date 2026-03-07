"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Calendar, ChevronDown } from "lucide-react";
import { DetailSheet } from "@/components/ui/detail-sheet";
import { cn } from "@/lib/utils";
import { renderMarkdown } from "@/lib/markdown";
import type { Task } from "../types";

interface TaskCardProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
    onToggleSubtask?: (taskId: string, subtaskId: string) => void;
}

const priorityVariant: Record<Task["priority"], "default" | "primary" | "success" | "warning" | "destructive"> = {
    low: "default",
    medium: "primary",
    high: "warning",
    urgent: "destructive",
};

export function TaskCard({ task, onToggle, onDelete, onEdit, onToggleSubtask }: TaskCardProps) {
    const [detailOpen, setDetailOpen] = useState(false);
    const [subtasksExpanded, setSubtasksExpanded] = useState(false);
    const isOverdue = !task.completed && !!task.dueDate && task.dueDate < new Date().toISOString().slice(0, 10);
    const subtasks = task.subtasks ?? [];
    const doneCount = subtasks.filter((s) => s.completed).length;

    return (
        <>
        <div
            className="rounded-xl cursor-pointer select-none"
            onClick={() => setDetailOpen(true)}
        >
            <Card className={`animate-fade-in ${isOverdue ? "border-l-2 border-l-rose-500" : ""}`}>
                <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
                    className={cn(
                        "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all duration-200",
                        task.completed
                            ? "border-primary bg-primary text-white"
                            : "border-muted-foreground/30 hover:border-primary"
                    )}
                >
                    {task.completed && <Check className="h-3 w-3" />}
                </button>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p
                        className={cn(
                            "text-sm font-medium leading-tight transition-all",
                            task.completed && "line-through text-muted-foreground"
                        )}
                    >
                        {task.title}
                    </p>
                    {task.description && (
                        <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {renderMarkdown(task.description)}
                        </div>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                        {task.dueDate && (
                            <span className={`flex items-center gap-1 text-[10px] ${isOverdue ? "text-rose-500 font-semibold" : "text-muted-foreground"}`}>
                                <Calendar className="h-3 w-3" />
                                {isOverdue ? "Overdue · " : ""}
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )}
                    </div>

                    {/* Subtask progress bar */}
                    {subtasks.length > 0 && (
                        <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSubtasksExpanded((p) => !p); }}
                            className="flex items-center gap-1.5 mt-2 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <div className="flex-1 h-1 rounded-full bg-muted min-w-[40px] max-w-[60px] overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-primary transition-all"
                                    style={{ width: `${subtasks.length > 0 ? (doneCount / subtasks.length) * 100 : 0}%` }}
                                />
                            </div>
                            <span>{doneCount}/{subtasks.length}</span>
                            <ChevronDown className={`h-3 w-3 transition-transform ${subtasksExpanded ? "rotate-180" : ""}`} />
                        </button>
                    )}

                    {/* Expanded subtasks (read-only) */}
                    {subtasksExpanded && (
                        <div className="mt-2 space-y-1 pl-0.5">
                            {subtasks.map((st) => (
                                <div key={st.id} className="flex items-center gap-2">
                                    <div
                                        className={cn(
                                            "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border",
                                            st.completed
                                                ? "border-primary bg-primary text-white"
                                                : "border-muted-foreground/30"
                                        )}
                                    >
                                        {st.completed && <Check className="h-2 w-2" />}
                                    </div>
                                    <span className={cn("text-[11px] flex-1", st.completed && "line-through text-muted-foreground")}>
                                        {st.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
            </Card>
        </div>

        <DetailSheet
            open={detailOpen}
            onClose={() => setDetailOpen(false)}
            title={task.title}
            onEdit={() => { setDetailOpen(false); onEdit(task); }}
            onDelete={() => { setDetailOpen(false); onDelete(task.id); }}
        >
            <div className="space-y-4">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => onToggle(task.id)}
                        className={cn(
                            "flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all",
                            task.completed
                                ? "border-primary bg-primary text-white"
                                : "border-muted-foreground/30 hover:border-primary"
                        )}
                    >
                        {task.completed && <Check className="h-3 w-3" />}
                    </button>
                    <span className={cn("text-base font-semibold", task.completed && "line-through text-muted-foreground")}>
                        {task.title}
                    </span>
                </div>

                {task.description && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-1">Description</p>
                        <div className="text-sm text-foreground">{renderMarkdown(task.description)}</div>
                    </div>
                )}

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

                {subtasks.length > 0 && (
                    <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2">Subtasks ({doneCount}/{subtasks.length})</p>
                        <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-3">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{ width: `${(doneCount / subtasks.length) * 100}%` }}
                            />
                        </div>
                        <div className="space-y-1.5">
                            {subtasks.map((st) => (
                                <div key={st.id} className="flex items-center gap-2">
                                    <button
                                        onClick={() => onToggleSubtask?.(task.id, st.id)}
                                        className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                            st.completed
                                                ? "border-primary bg-primary text-white"
                                                : "border-muted-foreground/30 hover:border-primary"
                                        )}
                                    >
                                        {st.completed && <Check className="h-2.5 w-2.5" />}
                                    </button>
                                    <span className={cn("text-sm", st.completed && "line-through text-muted-foreground")}>
                                        {st.title}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <p className="text-[10px] text-muted-foreground/60">
                    Created {new Date(task.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
            </div>
        </DetailSheet>
        </>
    );
}
