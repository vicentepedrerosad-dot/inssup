"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE } from "@/lib/status";
import { Avatar } from "@/components/ui/misc";
import { ChangePasswordModal } from "@/components/auth/ChangePasswordModal";
import { ChevronsUpDown, KeyRound, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function UserMenu({ dark = true }: { dark?: boolean }) {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  if (!user) return null;

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition-colors",
          dark ? "hover:bg-white/10" : "hover:bg-slate-100",
        )}
      >
        <Avatar name={user.name} size={34} />
        <div className="min-w-0 flex-1">
          <p className={cn("truncate text-sm font-medium", dark ? "text-white" : "text-slate-800")}>
            {user.name}
          </p>
          <p className={cn("truncate text-xs", dark ? "text-slate-400" : "text-slate-500")}>
            {ROLE[user.role].label}
          </p>
        </div>
        <ChevronsUpDown className="size-4 shrink-0 text-slate-400" />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 z-50 mb-2 w-full min-w-56 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl animate-fade-up">
          <div className="border-b border-slate-100 px-3 py-2.5">
            <p className="truncate text-sm font-semibold text-slate-800">{user.name}</p>
            <p className="truncate text-xs text-slate-500">@{user.username} · {ROLE[user.role].label}</p>
          </div>
          <div className="py-1">
            <button
              onClick={() => { setPwOpen(true); setOpen(false); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
            >
              <KeyRound className="size-4 text-slate-400" /> Cambiar contraseña
            </button>
            <button
              onClick={() => { setOpen(false); logout(); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
            >
              <LogOut className="size-4" /> Cerrar sesión
            </button>
          </div>
        </div>
      )}

      <ChangePasswordModal open={pwOpen} onClose={() => setPwOpen(false)} />
    </div>
  );
}
