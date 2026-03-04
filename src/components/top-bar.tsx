"use client";

import { ThemeToggle } from "./theme-toggle";

interface TopBarProps {
    title: string;
}

export function TopBar({ title }: TopBarProps) {
    return (
        <header className="sticky top-0 z-40 glass border-b border-border/50">
            <div className="flex items-center justify-between h-14 px-4 max-w-lg mx-auto">
                <h1 className="text-lg font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    {title}
                </h1>
                <ThemeToggle />
            </div>
        </header>
    );
}
