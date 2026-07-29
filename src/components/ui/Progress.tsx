import { cn } from "@/lib/utils";
import { clamp } from "@/lib/utils";

export function Progress({
  value,
  className,
  tone = "auto",
  showLabel = false,
  size = "md",
}: {
  value: number;
  className?: string;
  tone?: "auto" | "brand" | "emerald" | "amber" | "red";
  showLabel?: boolean;
  size?: "sm" | "md";
}) {
  const v = clamp(value, 0, 100);
  const auto =
    v >= 100
      ? "bg-emerald-500"
      : v >= 60
        ? "bg-brand-500"
        : v >= 30
          ? "bg-amber-500"
          : "bg-slate-400";
  const tones: Record<string, string> = {
    brand: "bg-brand-500",
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    red: "bg-red-500",
  };
  const fill = tone === "auto" ? auto : tones[tone];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div
        className={cn(
          "relative w-full overflow-hidden rounded-full bg-slate-100",
          size === "sm" ? "h-1.5" : "h-2",
        )}
      >
        <div
          className={cn("h-full rounded-full transition-all", fill)}
          style={{ width: `${v}%` }}
        />
      </div>
      {showLabel && (
        <span className="tabular w-9 shrink-0 text-right text-xs font-medium text-slate-600">
          {v}%
        </span>
      )}
    </div>
  );
}

/** Anillo de progreso circular (para KPIs de avance). */
export function ProgressRing({
  value,
  size = 56,
  stroke = 6,
  className,
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  className?: string;
  label?: string;
}) {
  const v = clamp(value, 0, 100);
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c - (v / 100) * c;
  const color = v >= 100 ? "#16a34a" : v >= 60 ? "#0e7490" : v >= 30 ? "#d97706" : "#94a3b8";
  return (
    <div className={cn("relative grid place-items-center", className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e2e8f0" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={c}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all"
        />
      </svg>
      <span className="tabular absolute text-xs font-semibold text-slate-700">
        {label ?? `${v}%`}
      </span>
    </div>
  );
}
