"use client";

import { useState, useRef, useEffect } from "react";
import { UserCircle2, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { useAuthStore } from "@/features/auth/store";

interface TopBarProps {
    title: string;
}

export function TopBar({ title }: TopBarProps) {
    const { user, logout } = useAuthStore();
    const email = user?.email;
    const [menuOpen, setMenuOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!menuOpen) return;
        function handleClick(e: MouseEvent) {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setMenuOpen(false);
            }
        }
        document.addEventListener("pointerdown", handleClick);
        return () => document.removeEventListener("pointerdown", handleClick);
    }, [menuOpen]);

    return (
        <header className="sticky top-0 z-40 glass border-b border-border/50">
            <div className="flex items-center justify-between h-16 px-4 max-w-lg mx-auto">
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">
                    {title}
                </h1>
                <div className="flex items-center gap-2 relative">
                    {email ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setMenuOpen((open) => !open)}
                                className="h-8 w-8 rounded-lg border border-border/60 bg-background/70 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center"
                                aria-label="Account menu"
                            >
                                <UserCircle2 className="h-4 w-4" />
                            </button>

                            {menuOpen ? (
                                <div className="absolute right-0 mt-2 w-44 rounded-lg border bg-popover p-1 shadow-lg z-50">
                                    <p className="px-2 py-1 text-[11px] text-muted-foreground truncate" title={email}>
                                        {email}
                                    </p>
                                    <button
                                        type="button"
                                        onClick={async () => { await logout(); window.location.href = "/login"; }}
                                        className="w-full mt-1 px-2 py-1.5 rounded-md text-xs flex items-center gap-1.5 text-left hover:bg-accent"
                                    >
                                        <LogOut className="h-3.5 w-3.5" />
                                        Logout
                                    </button>
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    <Link
                        href="/settings"
                        className="h-8 w-8 rounded-lg border border-border/60 bg-background/70 text-muted-foreground hover:text-foreground hover:bg-accent transition-colors flex items-center justify-center"
                        aria-label="Settings"
                    >
                        <Settings className="h-4 w-4" />
                    </Link>
                    <ThemeToggle />
                </div>
            </div>
        </header>
    );
}
