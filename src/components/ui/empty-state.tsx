"use client";

import type { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    subtitle?: string;
    action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, subtitle, action }: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Icon className="h-8 w-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            {subtitle && (
                <p className="text-xs text-muted-foreground/60 mt-1 text-center max-w-[200px]">{subtitle}</p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
