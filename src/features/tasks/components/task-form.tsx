"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Dialog } from "@/components/ui/dialog";
import type { CreateTaskInput, Task } from "../types";

interface TaskFormProps {
    open: boolean;
    onClose: () => void;
    onSubmit: (data: CreateTaskInput) => void;
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

    const handleSubmit = () => {
        if (!title.trim()) return;
        onSubmit({
            title: title.trim(),
            description: description.trim(),
            priority: priority as CreateTaskInput["priority"],
            dueDate: dueDate || null,
        });
        setTitle("");
        setDescription("");
        setPriority("medium");
        setDueDate("");
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
                <Button onClick={handleSubmit} className="w-full">
                    {initialData ? "Update Task" : "Create Task"}
                </Button>
            </div>
        </Dialog>
    );
}
