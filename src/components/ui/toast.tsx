"use client";

import { useEffect, useState, useCallback } from "react";
import { create } from "zustand";
import { X, CheckCircle2, AlertTriangle, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface ToastItem {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastState {
    toasts: ToastItem[];
    add: (message: string, type?: ToastType) => void;
    remove: (id: string) => void;
}

export const useToastStore = create<ToastState>((set) => ({
    toasts: [],
    add: (message, type = "success") => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
        setTimeout(() => {
            set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
        }, 3000);
    },
    remove: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));

export function toast(message: string, type?: ToastType) {
    useToastStore.getState().add(message, type);
}

const ICON_MAP: Record<ToastType, typeof CheckCircle2> = {
    success: CheckCircle2,
    error: XCircle,
    warning: AlertTriangle,
    info: Info,
};

const COLOR_MAP: Record<ToastType, string> = {
    success: "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    error: "border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400",
    warning: "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
    info: "border-blue-500/40 bg-blue-500/10 text-blue-600 dark:text-blue-400",
};

export function ToastContainer() {
    const toasts = useToastStore((s) => s.toasts);
    const remove = useToastStore((s) => s.remove);

    if (toasts.length === 0) return null;

    return (
        <div className="fixed top-16 left-1/2 -translate-x-1/2 z-[100] flex flex-col gap-2 w-[calc(100%-2rem)] max-w-lg pointer-events-none">
            {toasts.map((t) => {
                const Icon = ICON_MAP[t.type];
                return (
                    <div
                        key={t.id}
                        className={cn(
                            "pointer-events-auto flex items-center gap-2 rounded-xl border px-3 py-2.5 shadow-lg backdrop-blur animate-slide-up",
                            COLOR_MAP[t.type]
                        )}
                    >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="text-xs font-medium flex-1">{t.message}</span>
                        <button
                            onClick={() => remove(t.id)}
                            className="shrink-0 h-5 w-5 rounded-md flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                        >
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
