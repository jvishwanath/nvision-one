import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
    label?: string;
}

export function Input({ label, className, id, ...props }: InputProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                    {label}
                </label>
            )}
            <input
                id={id}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                {...props}
            />
        </div>
    );
}
