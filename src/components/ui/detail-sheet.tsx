"use client";

import { cn } from "@/lib/utils";
import { X, Pencil, Trash2 } from "lucide-react";
import { type ReactNode, useEffect, useCallback } from "react";

interface DetailSheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    onEdit?: () => void;
    onDelete?: () => void;
    actions?: ReactNode;
    children: ReactNode;
}

export function DetailSheet({ open, onClose, title, onEdit, onDelete, actions, children }: DetailSheetProps) {
    const handleKeyDown = useCallback(
        (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
        },
        [onClose]
    );

    useEffect(() => {
        if (open) {
            document.addEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", handleKeyDown);
            document.body.style.overflow = "";
        };
    }, [open, handleKeyDown]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center">
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
                onClick={onClose}
            />

            <div
                className={cn(
                    "relative w-full sm:max-w-lg bg-card border border-border/50 shadow-2xl",
                    "rounded-t-2xl sm:rounded-2xl",
                    "max-h-[90dvh] flex flex-col",
                    "animate-slide-up"
                )}
            >
                <div className="sticky top-0 flex items-center justify-between p-3 border-b border-border/50 bg-card/95 backdrop-blur-sm rounded-t-2xl z-10">
                    <h2 className="text-sm font-semibold truncate flex-1 mr-2">{title}</h2>
                    <div className="flex items-center gap-1">
                        {actions}
                        {onEdit && (
                            <button
                                onClick={onEdit}
                                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-primary/10 text-primary transition-colors"
                                aria-label="Edit"
                            >
                                <Pencil className="h-3.5 w-3.5" />
                            </button>
                        )}
                        {onDelete && (
                            <button
                                onClick={onDelete}
                                className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-destructive/10 text-destructive transition-colors"
                                aria-label="Delete"
                            >
                                <Trash2 className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-secondary text-muted-foreground transition-colors"
                            aria-label="Close"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4">{children}</div>
            </div>
        </div>
    );
}
