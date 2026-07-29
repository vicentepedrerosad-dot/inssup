import type { AuditChange } from "./types";

/** Definición de un campo auditable con etiqueta y formateador opcional. */
export interface FieldSpec {
  key: string;
  label: string;
  format?: (v: unknown) => string;
}

/**
 * Calcula la lista de cambios (antes → después) entre dos objetos, sólo para
 * los campos definidos en `specs` y cuyo valor efectivamente cambió.
 */
export function diffChanges(
  before: Record<string, unknown>,
  after: Record<string, unknown>,
  specs: FieldSpec[],
): AuditChange[] {
  const changes: AuditChange[] = [];
  for (const spec of specs) {
    if (!(spec.key in after)) continue;
    const b = before[spec.key];
    const a = after[spec.key];
    if (JSON.stringify(b) === JSON.stringify(a)) continue;
    const fmt = spec.format ?? ((v) => (v == null || v === "" ? "—" : String(v)));
    changes.push({
      field: spec.label,
      before: fmt(b),
      after: fmt(a),
    });
  }
  return changes;
}

/** Resumen legible a partir de una lista de cambios. */
export function summarizeChanges(changes: AuditChange[]): string {
  if (!changes.length) return "Sin cambios";
  return changes
    .map((c) => `${c.field}: ${c.before} → ${c.after}`)
    .join(" · ");
}
