import type { ActivityLog } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";
import {
  CircleDot,
  TrendingUp,
  Clock,
  Camera,
  Ban,
  StickyNote,
  Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_META: Record<
  ActivityLog["kind"],
  { icon: typeof CircleDot; className: string }
> = {
  estado: { icon: CircleDot, className: "bg-blue-100 text-blue-600" },
  avance: { icon: TrendingUp, className: "bg-emerald-100 text-emerald-600" },
  horas: { icon: Clock, className: "bg-amber-100 text-amber-600" },
  evidencia: { icon: Camera, className: "bg-violet-100 text-violet-600" },
  bloqueo: { icon: Ban, className: "bg-red-100 text-red-600" },
  nota: { icon: StickyNote, className: "bg-slate-100 text-slate-500" },
  creacion: { icon: Plus, className: "bg-brand-100 text-brand-600" },
};

export function ActivityTimeline({ items }: { items: ActivityLog[] }) {
  if (!items.length) {
    return (
      <p className="px-1 py-4 text-center text-sm text-slate-400">
        Sin actividad registrada.
      </p>
    );
  }
  return (
    <ol className="relative space-y-4 pl-1">
      {items.map((it, i) => {
        const meta = KIND_META[it.kind];
        const Icon = meta.icon;
        return (
          <li key={it.id} className="relative flex gap-3">
            {i < items.length - 1 && (
              <span className="absolute left-[13px] top-7 h-[calc(100%-4px)] w-px bg-slate-200" />
            )}
            <span
              className={cn(
                "z-10 grid size-7 shrink-0 place-items-center rounded-full",
                meta.className,
              )}
            >
              <Icon className="size-3.5" />
            </span>
            <div className="min-w-0 flex-1 pb-0.5">
              <p className="text-sm text-slate-700">{it.message}</p>
              <p className="mt-0.5 text-xs text-slate-400">
                {it.author} · {formatDateTime(it.at)}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
