import { cn } from "@/lib/utils";

interface SelectOption {
    value: string;
    label: string;
}

interface SelectProps {
    label?: string;
    options: SelectOption[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
    id?: string;
}

export function Select({ label, options, value, onChange, className, id }: SelectProps) {
    return (
        <div className="space-y-1.5">
            {label && (
                <label htmlFor={id} className="text-xs font-medium text-muted-foreground">
                    {label}
                </label>
            )}
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={cn(
                    "flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm appearance-none",
                    "focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-primary",
                    "transition-all duration-200",
                    "disabled:opacity-50 disabled:cursor-not-allowed",
                    className
                )}
            >
                {options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                        {opt.label}
                    </option>
                ))}
            </select>
        </div>
    );
}
