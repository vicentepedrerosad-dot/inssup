"use client";

import { useState, useRef, useEffect } from "react";
import { useStore } from "@/lib/store";
import { ROLE } from "@/lib/status";
import { Avatar } from "@/components/ui/misc";
import { Check, ChevronsUpDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export function RoleSwitcher({ dark = true }: { dark?: boolean }) {
  const { users, currentUser, setCurrentUser } = useStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
          dark ? "hover:bg-white/10" : "hover:bg-slate-100",
        )}
      >
        <Avatar name={currentUser.name} size={34} />
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "truncate text-sm font-medium",
              dark ? "text-white" : "text-slate-800",
            )}
          >
            {currentUser.name}
          </p>
          <p
            className={cn(
              "truncate text-xs",
              dark ? "text-slate-400" : "text-slate-500",
            )}
          >
            {ROLE[currentUser.role].label}
          </p>
        </div>
        <ChevronsUpDown
          className={cn("size-4 shrink-0", dark ? "text-slate-400" : "text-slate-400")}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-64 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-up">
          <div className="flex items-center gap-1.5 border-b border-slate-100 px-3 py-2 text-xs font-semibold text-slate-500">
            <ShieldCheck className="size-3.5" />
            Cambiar rol / usuario (demo)
          </div>
          <div className="max-h-80 overflow-y-auto py-1">
            {users.map((u) => {
              const active = u.id === currentUser.id;
              return (
                <button
                  key={u.id}
                  onClick={() => {
                    setCurrentUser(u.id);
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 px-2.5 py-2 text-left hover:bg-slate-50"
                >
                  <Avatar name={u.name} size={30} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {u.name}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {ROLE[u.role].label} · {u.title}
                    </p>
                  </div>
                  {active && <Check className="size-4 shrink-0 text-brand-600" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
