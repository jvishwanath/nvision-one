"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

export function ThemeToggle() {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <button className="h-9 w-9 rounded-lg bg-secondary flex items-center justify-center" aria-label="Toggle theme">
                <Sun className="h-4 w-4" />
            </button>
        );
    }

    return (
        <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="h-9 w-9 rounded-lg bg-secondary hover:bg-accent flex items-center justify-center transition-colors duration-200"
            aria-label="Toggle theme"
        >
            {theme === "dark" ? (
                <Sun className="h-4 w-4 text-yellow-400" />
            ) : (
                <Moon className="h-4 w-4 text-primary" />
            )}
        </button>
    );
}
