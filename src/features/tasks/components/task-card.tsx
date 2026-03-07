"use client";

import { useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Calendar, Pencil, Ellipsis } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "../types";

interface TaskCardProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
    onEdit: (task: Task) => void;
}

const priorityVariant: Record<Task["priority"], "default" | "primary" | "success" | "warning" | "destructive"> = {
    low: "default",
    medium: "primary",
    high: "warning",
    urgent: "destructive",
};

export function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
    const [actionsOpen, setActionsOpen] = useState(false);
    const pointerStartXRef = useRef<number | null>(null);

    const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (!event.isPrimary) return;
        pointerStartXRef.current = event.clientX;
    };

    const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
        const startX = pointerStartXRef.current;
        pointerStartXRef.current = null;
        if (startX === null) return;
        const deltaX = event.clientX - startX;
        if (deltaX < -32) {
            setActionsOpen(true);
        } else if (deltaX > 20) {
            setActionsOpen(false);
        }
    };

    return (
        <div
            className="relative overflow-hidden rounded-xl"
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={() => {
                pointerStartXRef.current = null;
            }}
        >
            <div className="absolute inset-y-0 right-0 w-24 flex items-center justify-center gap-1 bg-muted/70">
                <button
                    onClick={() => onEdit(task)}
                    className="h-8 w-8 rounded-lg bg-primary text-primary-foreground active:scale-95 transition-all flex items-center justify-center"
                    aria-label={`Edit ${task.title}`}
                >
                    <Pencil className="h-3.5 w-3.5" />
                </button>
                <button
                    onClick={() => onDelete(task.id)}
                    className="h-8 w-8 rounded-lg bg-destructive text-destructive-foreground active:scale-95 transition-all flex items-center justify-center"
                    aria-label={`Delete ${task.title}`}
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>

            <Card className={`animate-fade-in transition-transform duration-200 ${actionsOpen ? "-translate-x-24" : "translate-x-0"}`}>
                <div className="flex items-start gap-3">
                {/* Checkbox */}
                <button
                    onClick={() => onToggle(task.id)}
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
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                        <Badge variant={priorityVariant[task.priority]}>{task.priority}</Badge>
                        {task.dueDate && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                <Calendar className="h-3 w-3" />
                                {new Date(task.dueDate).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })}
                            </span>
                        )}
                    </div>
                </div>

                <div className="shrink-0 flex items-center gap-1">
                    <button
                        type="button"
                        onClick={() => setActionsOpen((prev) => !prev)}
                        className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                        aria-label={`${actionsOpen ? "Hide" : "Show"} actions for ${task.title}`}
                    >
                        <Ellipsis className="h-3.5 w-3.5" />
                    </button>
                </div>
            </div>
            </Card>
        </div>
    );
}
