import { useEffect, useState } from "react";

export function useTheme() {
  const [theme, setTheme] = useState("dark");

  // Load theme from localStorage on client-side mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        setTheme(savedTheme);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    let applied = theme;

    if (theme === "system") {
      applied = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(applied);

    localStorage.setItem("theme", theme);
  }, [theme]);

  return { theme, setTheme };
}
