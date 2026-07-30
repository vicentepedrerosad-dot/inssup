"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { visibleNav } from "./nav";
import { UserMenu } from "./UserMenu";
import { cn } from "@/lib/utils";
import { InssupLogo } from "./InssupLogo";

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { user, hasPermission } = useAuth();
  const items = visibleNav(user?.role ?? "tecnico", hasPermission);
  const sections = ["Operación", "Comercial", "Administración"] as const;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + "/");

  return (
    <div className="flex h-full flex-col bg-panel text-panel-fg">
      {/* Marca */}
      <div className="px-4 py-4">
        <InssupLogo theme="dark" />
        <span className="mt-2 inline-flex items-center gap-1 rounded-md bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-brand-300 ring-1 ring-inset ring-white/10">
          Control Operacional
        </span>
      </div>

      {/* Navegación */}
      <nav className="flex-1 overflow-y-auto px-3 py-2">
        {sections.map((section) => {
          const secItems = items.filter((i) => i.section === section);
          if (!secItems.length) return null;
          return (
            <div key={section} className="mb-4">
              <p className="mb-1.5 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {section}
              </p>
              <ul className="space-y-0.5">
                {secItems.map((item) => {
                  const active = isActive(item.href, item.exact);
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        onClick={onNavigate}
                        className={cn(
                          "group flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors",
                          active
                            ? "bg-brand-600/20 text-white ring-1 ring-inset ring-brand-400/30"
                            : "text-slate-300 hover:bg-white/5 hover:text-white",
                        )}
                      >
                        <Icon
                          className={cn(
                            "size-4.5 shrink-0",
                            active ? "text-brand-300" : "text-slate-400 group-hover:text-slate-200",
                          )}
                        />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </nav>

      {/* Estado del sistema */}
      <div className="mx-3 mb-2 rounded-lg bg-white/5 px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="relative flex size-2">
            <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-2 rounded-full bg-emerald-500" />
          </span>
          <p className="text-xs text-slate-300">
            Operación <span className="font-semibold text-emerald-400">activa</span> ·
            24/7
          </p>
        </div>
      </div>

      {/* Usuario / sesión */}
      <div className="border-t border-white/10 p-2">
        <UserMenu dark />
      </div>
    </div>
  );
}
