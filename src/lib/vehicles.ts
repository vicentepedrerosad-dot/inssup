import { TODAY } from "./utils";

/** Vehículo de flota (camioneta) — reflejo del registro en Supabase. */
export interface Vehicle {
  id: string;
  patente: string;
  marca: string;
  modelo: string;
  anio: number | null;
  tipo: string;
  lastRevision: string | null; // fecha ISO de la última revisión aprobada
  notes: string;
  active: boolean;
  createdBy: string;
}

/**
 * Calendario oficial chileno de revisión técnica para vehículos livianos
 * particulares / camionetas (clase B): el MES asignado depende del último
 * dígito de la patente. Marzo (3) y diciembre (12) no tienen dígito asignado.
 * Fuente: PRT / Ministerio de Transportes.
 */
export const DIGIT_MONTH: Record<string, number> = {
  "9": 1, // Enero
  "0": 2, // Febrero
  "1": 4, // Abril
  "2": 5, // Mayo
  "3": 6, // Junio
  "4": 7, // Julio
  "5": 8, // Agosto
  "6": 9, // Septiembre
  "7": 10, // Octubre
  "8": 11, // Noviembre
};

export const MONTH_NAMES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export type RevisionStatus = "al_dia" | "por_vencer" | "vencida" | "sin_registro";

export interface RevisionInfo {
  digit: string | null;
  assignedMonth: number | null; // 1-12
  assignedMonthName: string;
  /** Vencimiento del certificado (última revisión + 1 año), si hay registro. */
  expiry: Date | null;
  /** Próxima fecha límite recomendada según el calendario (fin del mes asignado). */
  nextDeadline: Date | null;
  daysLeft: number; // respecto a la fecha de referencia; negativo = vencido
  status: RevisionStatus;
}

const WARN_DAYS = 30;

function lastDayOfMonth(year: number, month1: number): Date {
  // month1 es 1-12; day 0 del mes siguiente = último día del mes actual
  return new Date(year, month1, 0);
}

/**
 * Calcula el estado de revisión técnica de una patente.
 * - Con última revisión: el certificado vale 12 meses desde esa fecha.
 * - Sin registro: se estima la próxima fecha límite según el mes asignado.
 */
export function computeRevision(
  patente: string,
  lastRevision: string | null,
  refDate: string = TODAY,
): RevisionInfo {
  const today = new Date(refDate);
  today.setHours(0, 0, 0, 0);

  const digitMatch = patente.replace(/[^0-9]/g, "").slice(-1);
  const digit = digitMatch || null;
  const assignedMonth = digit && digit in DIGIT_MONTH ? DIGIT_MONTH[digit] : null;
  const assignedMonthName = assignedMonth ? MONTH_NAMES[assignedMonth - 1] : "—";

  const dayMs = 86_400_000;

  if (lastRevision) {
    const expiry = new Date(lastRevision);
    expiry.setFullYear(expiry.getFullYear() + 1);
    expiry.setHours(0, 0, 0, 0);
    const daysLeft = Math.round((expiry.getTime() - today.getTime()) / dayMs);
    const status: RevisionStatus =
      daysLeft < 0 ? "vencida" : daysLeft <= WARN_DAYS ? "por_vencer" : "al_dia";
    return { digit, assignedMonth, assignedMonthName, expiry, nextDeadline: expiry, daysLeft, status };
  }

  // Sin registro: estimar según el calendario (fin del mes asignado).
  let nextDeadline: Date | null = null;
  let daysLeft = 0;
  if (assignedMonth) {
    let candidate = lastDayOfMonth(today.getFullYear(), assignedMonth);
    if (candidate.getTime() < today.getTime()) {
      candidate = lastDayOfMonth(today.getFullYear() + 1, assignedMonth);
    }
    nextDeadline = candidate;
    daysLeft = Math.round((candidate.getTime() - today.getTime()) / dayMs);
  }
  return { digit, assignedMonth, assignedMonthName, expiry: null, nextDeadline, daysLeft, status: "sin_registro" };
}

export const REVISION_META: Record<RevisionStatus, { label: string; badge: string; dot: string }> = {
  al_dia: { label: "Al día", badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20", dot: "bg-emerald-500" },
  por_vencer: { label: "Por vencer", badge: "bg-amber-50 text-amber-700 ring-amber-600/20", dot: "bg-amber-500" },
  vencida: { label: "Vencida", badge: "bg-red-50 text-red-700 ring-red-600/20", dot: "bg-red-500" },
  sin_registro: { label: "Sin registro", badge: "bg-slate-100 text-slate-600 ring-slate-500/20", dot: "bg-slate-400" },
};
