import { cn } from "@/lib/utils";

type BadgeVariant = "default" | "primary" | "success" | "warning" | "destructive" | "outline";

interface BadgeProps {
    children: React.ReactNode;
    variant?: BadgeVariant;
    className?: string;
}

const variantStyles: Record<BadgeVariant, string> = {
    default: "bg-secondary text-secondary-foreground",
    primary: "bg-primary/15 text-primary border-primary/20",
    success: "bg-green-500/15 text-green-500 border-green-500/20",
    warning: "bg-amber-500/15 text-amber-500 border-amber-500/20",
    destructive: "bg-destructive/15 text-destructive border-destructive/20",
    outline: "border border-border text-muted-foreground",
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
    return (
        <span
            className={cn(
                "inline-flex items-center rounded-md border border-transparent px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider transition-colors",
                variantStyles[variant],
                className
            )}
        >
            {children}
        </span>
    );
}
