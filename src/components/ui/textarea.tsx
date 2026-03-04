import { cn } from "@/lib/utils";
import type { TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
    label?: string;
}

export function Textarea({ label, className, id, ...props }: TextareaProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                    {label}
                </label>
            )}
            <textarea
                id={id}
                className={cn(
                    "flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                    "placeholder:text-muted-foreground/60",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary",
                    "transition-all duration-200 resize-none",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
                {...props}
            />
        </div>
    );
}
