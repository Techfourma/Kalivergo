"use client";

import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme";

interface ThemeToggleProps {
  className?: string;
}

/**
 * Simple round toggle button that switches between light and dark mode.
 * Shows both the sun (matahari) and moon (bulan) icons; the icon that
 * matches the active mode is emphasized while the other is dimmed.
 */
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
        "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500",
        isDark
          ? "bg-dark-200 text-dark-800 hover:bg-dark-300"
          : "bg-gray-300 text-dark-800 hover:bg-gray-400",
        className
      )}
    >
      <Moon
        className={cn(
          "h-4 w-4 transition-opacity",
          isDark ? "opacity-100" : "opacity-30"
        )}
      />
      <Sun
        className={cn(
          "h-4 w-4 transition-opacity",
          isDark ? "opacity-30" : "opacity-100"
        )}
      />
    </button>
  );
}
