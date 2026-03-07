"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface PullIndicatorProps {
    pulling: boolean;
    refreshing: boolean;
    pullDistance: number;
}

export function PullIndicator({ pulling, refreshing, pullDistance }: PullIndicatorProps) {
    if (!pulling && !refreshing) return null;

    return (
        <div
            className="flex items-center justify-center overflow-hidden transition-all duration-200"
            style={{ height: pullDistance > 0 ? pullDistance : refreshing ? 40 : 0 }}
        >
            <Loader2
                className={cn(
                    "h-5 w-5 text-primary transition-opacity",
                    refreshing ? "animate-spin opacity-100" : "opacity-60"
                )}
                style={{
                    transform: refreshing ? undefined : `rotate(${pullDistance * 3}deg)`,
                }}
            />
        </div>
    );
}
