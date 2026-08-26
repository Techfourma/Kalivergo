"use client";

import { useEffect } from "react";
import { useThemeStore, type Theme } from "@/stores/theme";

export default function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const theme = useThemeStore((s) => s.theme);
  const setTheme = useThemeStore((s) => s.setTheme);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("kalivergo-theme");
      if (stored === "light" || stored === "dark") {
        setTheme(stored as Theme);
      }
    } catch {
    }
  }, []);

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
