"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "inssup:theme";

/** Interruptor de modo oscuro (dark mode) para toda la app. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem(KEY, next ? "dark" : "light");
    } catch {
      /* noop */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={dark}
      title={dark ? "Modo claro" : "Modo oscuro"}
      className={cn(
        "grid size-9 place-items-center rounded-lg transition-colors",
        dark
          ? "bg-white/10 text-amber-300 hover:bg-white/15"
          : "text-slate-600 hover:bg-slate-100",
      )}
    >
      {dark ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  );
}
