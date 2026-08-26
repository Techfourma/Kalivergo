"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/stores/theme";

/**
 * ThemeProvider keeps the `dark` class on <html> in sync with the zustand
 * theme store and persists the user's preference to localStorage.
 *
 * A critical inline script (injected in the root layout <head>) sets the
 * initial class before React hydrates, so there is no flash of the wrong
 * theme. This provider only re-syncs after hydration and on future toggles.
 */
export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  // On first mount, hydrate the store from localStorage so it matches the
  // class already applied by the critical inline script.
  useEffect(() => {
    try {
      const stored = localStorage.getItem("kalivergo-theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored as Theme);
      }
    } catch {
      // localStorage unavailable (e.g. private mode) — keep default "dark"
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Apply / remove the `dark` class and persist the preference whenever the
  // theme changes.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");

    try {
      localStorage.setItem("kalivergo-theme", theme);
    } catch {
      // ignore
    }
  }, [theme]);

  return <>{children}</>;
}
