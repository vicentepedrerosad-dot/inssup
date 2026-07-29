import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Combina clases de Tailwind resolviendo conflictos. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formatea CLP: $12.345.678 */
export function formatCLP(value: number, opts?: { compact?: boolean }): string {
  if (opts?.compact) {
    if (Math.abs(value) >= 1_000_000_000)
      return `$${(value / 1_000_000_000).toFixed(1).replace(".", ",")}MM`;
    if (Math.abs(value) >= 1_000_000)
      return `$${(value / 1_000_000).toFixed(1).replace(".", ",")}M`;
    if (Math.abs(value) >= 1_000)
      return `$${Math.round(value / 1_000)}K`;
  }
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(value);
}

/** Número con separador de miles chileno. */
export function formatNumber(value: number, decimals = 0): string {
  return new Intl.NumberFormat("es-CL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatPct(value: number, decimals = 0): string {
  return `${formatNumber(value, decimals)}%`;
}

/** Fecha corta: 27 jul 2026 */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CL", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("es-CL", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Días entre hoy (o base) y una fecha. Positivo = futuro. */
export function daysUntil(iso: string | null | undefined, base = TODAY): number {
  if (!iso) return 0;
  const d = new Date(iso).getTime();
  const b = new Date(base).getTime();
  return Math.round((d - b) / 86_400_000);
}

/** "hace 3 días" / "en 2 días" relativo a hoy. */
export function relativeDays(iso: string | null | undefined): string {
  if (!iso) return "—";
  const diff = daysUntil(iso);
  if (diff === 0) return "hoy";
  if (diff === 1) return "mañana";
  if (diff === -1) return "ayer";
  if (diff < 0) return `hace ${Math.abs(diff)} días`;
  return `en ${diff} días`;
}

/** Fecha ancla de la demo (coincide con currentDate del entorno). */
export const TODAY = "2026-07-27";

/**
 * "Ahora" anclado a la fecha de la demo: las ediciones del usuario quedan
 * fechadas en el día ancla para que los cálculos de frescura sean coherentes.
 */
export function isoNow(): string {
  const now = new Date();
  const d = new Date(TODAY);
  d.setHours(now.getHours(), now.getMinutes(), now.getSeconds(), 0);
  return d.toISOString();
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Genera un id corto legible. */
export function shortId(prefix = "ID"): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}
