"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { NAV_ITEMS } from "./nav";
import { Menu, X, CalendarDays } from "lucide-react";
import { InssupLogo } from "./InssupLogo";
import { formatDate, TODAY } from "@/lib/utils";
import { useAuth } from "@/lib/auth";
import { ROLE } from "@/lib/status";
import { Avatar } from "@/components/ui/misc";

function currentTitle(pathname: string): string {
  if (pathname === "/") return "Dashboard Ejecutivo";
  const match = NAV_ITEMS.find(
    (i) => i.href !== "/" && (pathname === i.href || pathname.startsWith(i.href + "/")),
  );
  return match?.label ?? "INSSUP";
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const title = currentTitle(pathname);

  return (
    <div className="flex h-dvh overflow-hidden bg-slate-100">
      {/* Sidebar desktop */}
      <aside className="hidden w-64 shrink-0 lg:block">
        <Sidebar />
      </aside>

      {/* Sidebar mobile (drawer) */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-slate-900/50"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] shadow-2xl animate-[fade-up_.2s_ease]">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute right-3 top-3 z-10 grid size-8 place-items-center rounded-lg text-slate-400 hover:bg-white/10"
              aria-label="Cerrar menú"
            >
              <X className="size-5" />
            </button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </div>
        </div>
      )}

      {/* Contenido */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white/90 px-3 backdrop-blur sm:px-5">
          <button
            onClick={() => setMobileOpen(true)}
            className="grid size-9 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="size-5" />
          </button>

          <div className="flex items-center lg:hidden">
            <InssupLogo theme="light" size="sm" showTagline={false} />
          </div>

          <div className="min-w-0 flex-1">
            <h1 className="truncate text-sm font-semibold text-slate-900 sm:text-base">
              {title}
            </h1>
          </div>

          <div className="hidden items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 sm:flex">
            <CalendarDays className="size-3.5 text-slate-400" />
            {formatDate(TODAY)}
          </div>

          <div className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-1 sm:pl-2">
            <div className="hidden text-right sm:block">
              <p className="text-xs font-medium leading-tight text-slate-800">
                {user?.name}
              </p>
              <p className="text-[11px] leading-tight text-slate-500">
                {user ? ROLE[user.role].label : ""}
              </p>
            </div>
            <Avatar name={user?.name ?? "?"} size={32} />
          </div>
        </header>

        {/* Main scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1600px] p-3 sm:p-5 lg:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
