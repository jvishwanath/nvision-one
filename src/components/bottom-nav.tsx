"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LayoutDashboard,
    CheckSquare,
    StickyNote,
    TrendingUp,
    Plane,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = [
    { href: "/", label: "Home", icon: LayoutDashboard },
    { href: "/tasks", label: "Tasks", icon: CheckSquare },
    { href: "/notes", label: "Notes", icon: StickyNote },
    { href: "/finance", label: "Finance", icon: TrendingUp },
    { href: "/travel", label: "Travel", icon: Plane },
] as const;

export function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50 safe-area-bottom">
            <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
                {tabs.map((tab) => {
                    const isActive = pathname === tab.href;
                    const Icon = tab.icon;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className={cn(
                                "flex flex-col items-center justify-center gap-0.5 w-16 h-14 rounded-xl transition-all duration-200",
                                isActive
                                    ? "text-primary scale-105"
                                    : "text-muted-foreground hover:text-foreground"
                            )}
                        >
                            <div
                                className={cn(
                                    "flex items-center justify-center w-10 h-7 rounded-lg transition-all duration-200",
                                    isActive && "gradient-primary shadow-lg shadow-primary/25"
                                )}
                            >
                                <Icon
                                    className={cn(
                                        "h-4.5 w-4.5 transition-all",
                                        isActive && "text-white"
                                    )}
                                />
                            </div>
                            <span
                                className={cn(
                                    "text-[10px] font-medium transition-all",
                                    isActive && "text-primary font-semibold"
                                )}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
