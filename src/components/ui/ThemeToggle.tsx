"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme";

interface ThemeToggleProps {
  className?: string;
}

export default function ThemeToggle({ className }: ThemeToggleProps) {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      aria-label={isDark ? "Beralih ke Light Mode" : "Beralih ke Dark Mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
      onClick={toggleTheme}
      className={cn(
        "theme-toggle relative inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl border shadow-sm backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2",
        isDark
          ? "border-dark-700 bg-dark-900/95 text-amber-300 shadow-black/20 hover:bg-dark-800"
          : "border-gray-200 bg-white/90 text-amber-500 hover:bg-gray-50",
        className
      )}
    >
      <span
        key={isDark ? "dark" : "light"}
        aria-hidden="true"
        className={cn(
          "theme-toggle__handle",
          isDark && "theme-toggle__handle--dark"
        )}
      />
      <span className="theme-toggle__icons pointer-events-none" aria-hidden="true">
        <Moon
          className={cn(
            "theme-toggle__icon",
            isDark && "theme-toggle__icon--active"
          )}
        />
        <Sun
          className={cn(
            "theme-toggle__icon",
            !isDark && "theme-toggle__icon--active"
          )}
        />
      </span>
    </button>
  );
}
