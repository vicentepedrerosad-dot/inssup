"use client";

import Link from "next/link";
import type { Alert } from "@/lib/kpi";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Clock3,
  UserX,
  TrendingDown,
  ChevronRight,
} from "lucide-react";
import { EmptyState } from "@/components/ui/misc";
import { ShieldCheck } from "lucide-react";

const KIND_ICON = {
  atraso: AlertTriangle,
  sin_actualizacion: Clock3,
  cuadrilla: TrendingDown,
  presupuesto: UserX,
};

const SEV = {
  critica: { dot: "bg-red-500", text: "text-red-600", ring: "ring-red-500/20", bg: "bg-red-50" },
  alta: { dot: "bg-amber-500", text: "text-amber-600", ring: "ring-amber-500/20", bg: "bg-amber-50" },
  media: { dot: "bg-slate-400", text: "text-slate-500", ring: "ring-slate-400/20", bg: "bg-slate-50" },
};

export function AlertsPanel({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) {
    return (
      <EmptyState
        icon={<ShieldCheck className="size-6" />}
        title="Sin alertas activas"
        description="Todos los sitios están dentro de sus compromisos y actualizados."
      />
    );
  }

  return (
    <ul className="divide-y divide-slate-100">
      {alerts.map((a) => {
        const Icon = KIND_ICON[a.kind];
        const sev = SEV[a.severity];
        const inner = (
          <div className="flex items-center gap-3 px-3.5 py-2.5 transition-colors hover:bg-slate-50">
            <div
              className={cn(
                "grid size-8 shrink-0 place-items-center rounded-lg ring-1 ring-inset",
                sev.bg,
                sev.ring,
                sev.text,
              )}
            >
              <Icon className="size-4" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">
                {a.title}
              </p>
              <p className="truncate text-xs text-slate-500">{a.detail}</p>
            </div>
            {a.meta && (
              <span
                className={cn(
                  "tabular rounded-md px-1.5 py-0.5 text-xs font-bold",
                  sev.bg,
                  sev.text,
                )}
              >
                {a.meta}
              </span>
            )}
            <ChevronRight className="size-4 shrink-0 text-slate-300" />
          </div>
        );
        return (
          <li key={a.id}>
            {a.href ? <Link href={a.href}>{inner}</Link> : inner}
          </li>
        );
      })}
    </ul>
  );
}
