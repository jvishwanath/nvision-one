"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Task } from "../types";

interface TaskCardProps {
    task: Task;
    onToggle: (id: string) => void;
    onDelete: (id: string) => void;
}

const priorityVariant: Record<Task["priority"], "default" | "primary" | "success" | "warning" | "destructive"> = {
    low: "default",
    medium: "primary",
    high: "warning",
    urgent: "destructive",
};

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
    return (
        <Card className="animate-fade-in">
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

                {/* Delete */}
                <button
                    onClick={() => onDelete(task.id)}
                    className="shrink-0 h-8 w-8 flex items-center justify-center rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </Card>
    );
}
