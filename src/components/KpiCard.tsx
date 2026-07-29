import { cn } from "@/lib/utils";
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

export function KpiCard({
  label,
  value,
  icon,
  hint,
  delta,
  tone = "slate",
  accent,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  delta?: { value: string; positive?: boolean };
  tone?: "slate" | "brand" | "emerald" | "amber" | "red" | "blue";
  accent?: boolean;
  className?: string;
}) {
  const toneMap: Record<string, { icon: string; bar: string }> = {
    slate: { icon: "bg-slate-100 text-slate-600", bar: "bg-slate-300" },
    brand: { icon: "bg-brand-50 text-brand-700", bar: "bg-brand-500" },
    emerald: { icon: "bg-emerald-50 text-emerald-600", bar: "bg-emerald-500" },
    amber: { icon: "bg-amber-50 text-amber-600", bar: "bg-amber-500" },
    red: { icon: "bg-red-50 text-red-600", bar: "bg-red-500" },
    blue: { icon: "bg-blue-50 text-blue-600", bar: "bg-blue-500" },
  };
  const t = toneMap[tone];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md",
        className,
      )}
    >
      {accent && (
        <span className={cn("absolute inset-y-0 left-0 w-1", t.bar)} />
      )}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && (
          <div className={cn("grid size-7 shrink-0 place-items-center rounded-lg", t.icon)}>
            {icon}
          </div>
        )}
      </div>
      <div className="mt-1.5 flex items-end gap-2">
        <span className="tabular text-2xl font-bold leading-none tracking-tight text-slate-900">
          {value}
        </span>
        {delta && (
          <span
            className={cn(
              "mb-0.5 inline-flex items-center gap-0.5 text-xs font-semibold",
              delta.positive ? "text-emerald-600" : "text-red-600",
            )}
          >
            {delta.positive ? (
              <ArrowUpRight className="size-3.5" />
            ) : (
              <ArrowDownRight className="size-3.5" />
            )}
            {delta.value}
          </span>
        )}
      </div>
      {hint && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}
