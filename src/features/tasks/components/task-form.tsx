"use client";

import { useEffect, useState } from "react";
import { Plus, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import type { CreateTaskInput, Task, Subtask } from "../types";

interface TaskFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskInput, subtasks: Subtask[]) => void;
    initialData?: Task;
}

const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
    { value: "urgent", label: "Urgent" },
];

export function TaskForm({ open, onClose, onSubmit, initialData }: TaskFormProps) {
    const [title, setTitle] = useState(initialData?.title ?? "");
    const [description, setDescription] = useState(initialData?.description ?? "");
    const [priority, setPriority] = useState<string>(initialData?.priority ?? "medium");
    const [dueDate, setDueDate] = useState(initialData?.dueDate ?? "");
    const [subtasks, setSubtasks] = useState<Subtask[]>(initialData?.subtasks ?? []);
    const [newSubtask, setNewSubtask] = useState("");

    useEffect(() => {
        if (open) {
            setTitle(initialData?.title ?? "");
            setDescription(initialData?.description ?? "");
            setPriority(initialData?.priority ?? "medium");
            setDueDate(initialData?.dueDate ?? "");
            setSubtasks(initialData?.subtasks ?? []);
            setNewSubtask("");
        }
    }, [open, initialData]);

    const addSubtask = () => {
        const text = newSubtask.trim();
        if (!text) return;
        setSubtasks((prev) => [...prev, { id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, title: text, completed: false }]);
        setNewSubtask("");
    };

    const toggleSubtask = (id: string) => {
        setSubtasks((prev) => prev.map((s) => s.id === id ? { ...s, completed: !s.completed } : s));
    };

    const removeSubtask = (id: string) => {
        setSubtasks((prev) => prev.filter((s) => s.id !== id));
    };

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            priority: priority as CreateTaskInput["priority"],
            dueDate: dueDate || null,
        }, subtasks);
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
        setSubtasks([]);
        setNewSubtask("");
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} title={initialData ? "Edit Task" : "New Task"}>
            <div className="space-y-4">
                <Input
                    id="task-title"
                    label="Title"
                    placeholder="What needs to be done?"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                />
                <Textarea
                    id="task-desc"
                    label="Description"
                    placeholder="Add details…"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <div className="grid grid-cols-2 gap-3">
                    <Select
                        id="task-priority"
                        label="Priority"
                        options={priorityOptions}
                        value={priority}
                        onChange={setPriority}
                    />
                    <Input
                        id="task-due"
                        label="Due Date"
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                    />
                </div>
                {/* Subtasks */}
                <div>
                    <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Subtasks</label>
                    {subtasks.length > 0 && (
                        <div className="space-y-1 mb-2">
                            {subtasks.map((st) => (
                                <div key={st.id} className="flex items-center gap-2 group">
                                    <button
                                        type="button"
                                        onClick={() => toggleSubtask(st.id)}
                                        className={cn(
                                            "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-all",
                                            st.completed
                                                ? "border-primary bg-primary text-white"
                                                : "border-muted-foreground/30 hover:border-primary"
                                        )}
                                    >
                                        {st.completed && <Check className="h-2.5 w-2.5" />}
                                    </button>
                                    <span className={cn("text-sm flex-1", st.completed && "line-through text-muted-foreground")}>
                                        {st.title}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={() => removeSubtask(st.id)}
                                        className="h-5 w-5 shrink-0 opacity-0 group-hover:opacity-100 flex items-center justify-center text-muted-foreground hover:text-destructive transition-all"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                    <div className="flex items-center gap-2">
                        <input
                            value={newSubtask}
                            onChange={(e) => setNewSubtask(e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
                            placeholder="Add a subtask…"
                            className="flex-1 text-sm bg-transparent border-b border-border/50 py-1 outline-none placeholder:text-muted-foreground/50 focus:border-primary transition-colors"
                        />
                        <button
                            type="button"
                            onClick={addSubtask}
                            className="h-6 w-6 flex items-center justify-center rounded text-muted-foreground hover:text-primary transition-colors"
                        >
                            <Plus className="h-3.5 w-3.5" />
                        </button>
                    </div>
                </div>

                <Button onClick={handleSubmit} className="w-full">
                    {initialData ? "Update Task" : "Create Task"}
                </Button>
            </div>
        </Dialog>
    );
}
