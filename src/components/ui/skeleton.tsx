"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

function Skeleton({ className }: SkeletonProps) {
    return (
        <div className={cn("animate-pulse rounded-lg bg-muted", className)} />
    );
}

export function CardSkeleton() {
    return (
        <div className="rounded-xl border border-border/50 bg-card p-4 space-y-3">
            <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-5 rounded-md" />
                <Skeleton className="h-4 w-3/5" />
            </div>
            <Skeleton className="h-3 w-4/5" />
            <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-14 rounded-full" />
                <Skeleton className="h-3 w-16" />
            </div>
        </div>
    );
}

export function ListSkeleton({ count = 4 }: { count?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
}

export { Skeleton };
