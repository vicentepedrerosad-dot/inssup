"use client";

import { useEffect, useState } from "react";
import { Contrast } from "lucide-react";
import { cn } from "@/lib/utils";

const KEY = "inssup:bw";

/** Interruptor de modo blanco y negro (escala de grises en toda la app). */
export function ThemeToggle() {
  const [bw, setBw] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setBw(document.documentElement.classList.contains("theme-bw"));
  }, []);

  const toggle = () => {
    const next = !bw;
    setBw(next);
    document.documentElement.classList.toggle("theme-bw", next);
    try {
      localStorage.setItem(KEY, next ? "1" : "0");
    } catch {
      /* noop */
    }
  };

  return (
    <button
      onClick={toggle}
      aria-pressed={bw}
      title={bw ? "Volver a color" : "Modo blanco y negro"}
      className={cn(
        "grid size-9 place-items-center rounded-lg transition-colors",
        bw ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100",
      )}
    >
      <Contrast className="size-4.5" />
    </button>
  );
}
