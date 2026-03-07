"use client";

import { Dialog } from "./dialog";
import { Button } from "./button";

interface ConfirmDialogProps {
    open: boolean;
    title?: string;
    message: string;
    confirmLabel?: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({
    open,
    title = "Are you sure?",
    message,
    confirmLabel = "Delete",
    onConfirm,
    onCancel,
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onClose={onCancel} title={title}>
            <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{message}</p>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={onCancel} className="flex-1">
                        Cancel
                    </Button>
                    <Button variant="destructive" onClick={onConfirm} className="flex-1">
                        {confirmLabel}
                    </Button>
                </div>
            </div>
        </Dialog>
    );
}
