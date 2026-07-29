import type { Site, Project, Crew, Client, SiteStatus } from "./types";
import { daysUntil, TODAY } from "./utils";

/* ------------------------------ Agregados de sitios ----------------------- */

export interface SiteStats {
  total: number;
  terminado: number;
  ejecucion: number;
  atrasado: number;
  programado: number;
  pendiente: number;
  avgProgress: number;
  totalHours: number;
  expectedRevenue: number;
  billedRevenue: number;
  estimatedCost: number;
  estimatedMargin: number;
  pendingBilling: number;
}

export function computeSiteStats(sites: Site[]): SiteStats {
  const s: SiteStats = {
    total: sites.length,
    terminado: 0,
    ejecucion: 0,
    atrasado: 0,
    programado: 0,
    pendiente: 0,
    avgProgress: 0,
    totalHours: 0,
    expectedRevenue: 0,
    billedRevenue: 0,
    estimatedCost: 0,
    estimatedMargin: 0,
    pendingBilling: 0,
  };
  if (sites.length === 0) return s;
  let progressSum = 0;
  for (const site of sites) {
    s[site.status] += 1;
    progressSum += site.progress;
    s.totalHours += site.hoursWorked;
    s.expectedRevenue += site.budget;
    s.estimatedCost += site.cost;
    if (site.billed) s.billedRevenue += site.budget;
    if (site.status === "terminado" && !site.billed) s.pendingBilling += site.budget;
  }
  s.avgProgress = Math.round(progressSum / sites.length);
  s.estimatedMargin = s.expectedRevenue - s.estimatedCost;
  return s;
}

/** ¿El sitio está atrasado según SLA? (compromiso vencido y no terminado) */
export function isOverdue(site: Site): boolean {
  if (site.status === "terminado") return false;
  return daysUntil(site.slaDate) < 0;
}

/** Días de atraso respecto al SLA (0 si no está atrasado). */
export function overdueDays(site: Site): number {
  if (site.status === "terminado") return 0;
  const d = daysUntil(site.slaDate);
  return d < 0 ? Math.abs(d) : 0;
}

/** Horas desde la última actualización. */
export function hoursSinceUpdate(site: Site): number {
  const diff = Date.now() - new Date(site.lastUpdate).getTime();
  return Math.round(diff / 3_600_000);
}

/** Días desde la última actualización (respecto a la fecha ancla de la demo). */
export function daysSinceUpdate(site: Site): number {
  const base = new Date(TODAY).getTime();
  const diff = base - new Date(site.lastUpdate).getTime();
  return Math.max(0, Math.round(diff / 86_400_000));
}

/* --------------------------------- Alertas -------------------------------- */

export type AlertKind = "atraso" | "sin_actualizacion" | "cuadrilla" | "presupuesto";

export interface Alert {
  id: string;
  kind: AlertKind;
  severity: "critica" | "alta" | "media";
  title: string;
  detail: string;
  href?: string;
  meta?: string;
}

const STALE_DAYS = 5;

export function computeAlerts(
  sites: Site[],
  projects: Project[],
  crews: Crew[],
): Alert[] {
  const alerts: Alert[] = [];

  // 1) Atrasos críticos
  for (const site of sites) {
    if (isOverdue(site)) {
      const d = overdueDays(site);
      alerts.push({
        id: `al-late-${site.id}`,
        kind: "atraso",
        severity: d > 10 ? "critica" : "alta",
        title: `${site.id} · ${site.name}`,
        detail: `Compromiso vencido hace ${d} día${d === 1 ? "" : "s"} · ${site.progress}% avance`,
        href: `/sitios/${site.id}`,
        meta: `${d}d`,
      });
    }
  }

  // 2) Sitios sin actualización reciente (activos)
  for (const site of sites) {
    if (site.status === "terminado" || site.status === "pendiente") continue;
    const d = daysSinceUpdate(site);
    if (d >= STALE_DAYS && !isOverdue(site)) {
      alerts.push({
        id: `al-stale-${site.id}`,
        kind: "sin_actualizacion",
        severity: d > 10 ? "alta" : "media",
        title: `${site.id} · ${site.name}`,
        detail: `Sin actualización hace ${d} días`,
        href: `/sitios/${site.id}`,
        meta: `${d}d`,
      });
    }
  }

  // 3) Cuadrillas bajo rendimiento
  const crewPerf = computeCrewPerformance(sites, crews);
  for (const cp of crewPerf) {
    if (cp.assigned >= 2 && cp.productivity < 55) {
      alerts.push({
        id: `al-crew-${cp.crew.id}`,
        kind: "cuadrilla",
        severity: cp.productivity < 40 ? "alta" : "media",
        title: cp.crew.name,
        detail: `Productividad ${cp.productivity}% · ${cp.onTimeRate}% cumplimiento de fechas`,
        href: `/cuadrillas`,
        meta: `${cp.productivity}%`,
      });
    }
  }

  // 4) Proyectos sobre presupuesto (costo real proyectado > presupuesto)
  for (const p of projects) {
    if (p.estimatedCost > p.budget) {
      const over = ((p.estimatedCost / p.budget - 1) * 100).toFixed(0);
      alerts.push({
        id: `al-budget-${p.id}`,
        kind: "presupuesto",
        severity: Number(over) > 8 ? "alta" : "media",
        title: p.name,
        detail: `Costo estimado ${over}% sobre presupuesto`,
        href: `/proyectos/${p.id}`,
        meta: `+${over}%`,
      });
    }
  }

  const sevOrder = { critica: 0, alta: 1, media: 2 };
  return alerts.sort((a, b) => sevOrder[a.severity] - sevOrder[b.severity]);
}

/* --------------------------- Productividad cuadrillas --------------------- */

export interface CrewPerformance {
  crew: Crew;
  assigned: number;
  completed: number;
  inProgress: number;
  hours: number;
  avgProgress: number;
  onTimeRate: number; // % de sitios entregados/en curso dentro de SLA
  productivity: number; // índice compuesto 0-100
  revenue: number;
}

export function computeCrewPerformance(sites: Site[], crews: Crew[]): CrewPerformance[] {
  return crews
    .map((crew) => {
      const cs = sites.filter((s) => s.crewId === crew.id);
      const completed = cs.filter((s) => s.status === "terminado").length;
      const inProgress = cs.filter((s) => s.status === "ejecucion").length;
      const hours = cs.reduce((a, s) => a + s.hoursWorked, 0);
      const avgProgress = cs.length
        ? Math.round(cs.reduce((a, s) => a + s.progress, 0) / cs.length)
        : 0;
      const relevant = cs.filter((s) => s.status !== "pendiente" && s.status !== "programado");
      const onTime = relevant.filter((s) => !isOverdue(s)).length;
      const onTimeRate = relevant.length
        ? Math.round((onTime / relevant.length) * 100)
        : 100;
      const revenue = cs.reduce((a, s) => a + (s.billed ? s.budget : 0), 0);
      // índice compuesto: avance (40%), cumplimiento (40%), completados (20%)
      const completionScore = cs.length ? (completed / cs.length) * 100 : 0;
      const productivity = Math.round(
        avgProgress * 0.4 + onTimeRate * 0.4 + completionScore * 0.2,
      );
      return {
        crew,
        assigned: cs.length,
        completed,
        inProgress,
        hours,
        avgProgress,
        onTimeRate,
        productivity,
        revenue,
      };
    })
    .sort((a, b) => b.productivity - a.productivity);
}

/* ------------------------------ Agregados varios -------------------------- */

export interface ClientRollup {
  client: Client;
  sites: number;
  projects: number;
  completed: number;
  overdue: number;
  avgProgress: number;
  revenue: number;
  billed: number;
  onTimeRate: number;
}

export function computeClientRollups(
  sites: Site[],
  projects: Project[],
  clients: Client[],
): ClientRollup[] {
  return clients
    .map((client) => {
      const cs = sites.filter((s) => s.clientId === client.id);
      const cp = projects.filter((p) => p.clientId === client.id);
      const completed = cs.filter((s) => s.status === "terminado").length;
      const overdue = cs.filter(isOverdue).length;
      const avgProgress = cs.length
        ? Math.round(cs.reduce((a, s) => a + s.progress, 0) / cs.length)
        : 0;
      const revenue = cs.reduce((a, s) => a + s.budget, 0);
      const billed = cs.reduce((a, s) => a + (s.billed ? s.budget : 0), 0);
      const relevant = cs.filter((s) => s.status !== "pendiente" && s.status !== "programado");
      const onTimeRate = relevant.length
        ? Math.round((relevant.filter((s) => !isOverdue(s)).length / relevant.length) * 100)
        : 100;
      return {
        client,
        sites: cs.length,
        projects: cp.length,
        completed,
        overdue,
        avgProgress,
        revenue,
        billed,
        onTimeRate,
      };
    })
    .sort((a, b) => b.revenue - a.revenue);
}

/** Avance de un proyecto = promedio del avance de sus sitios. */
export function projectProgress(project: Project, sites: Site[]): number {
  const cs = sites.filter((s) => s.projectId === project.id);
  if (!cs.length) return 0;
  return Math.round(cs.reduce((a, s) => a + s.progress, 0) / cs.length);
}

export function sitesOfProject(project: Project, sites: Site[]): Site[] {
  return sites.filter((s) => s.projectId === project.id);
}

/* ----------------------- Series para gráficos ----------------------------- */

/** Horas trabajadas por semana (últimas N semanas). */
export function hoursPerWeek(sites: Site[], weeks = 8): { week: string; horas: number }[] {
  const base = new Date(TODAY);
  const buckets: { week: string; horas: number }[] = [];
  for (let i = weeks - 1; i >= 0; i--) {
    const end = new Date(base);
    end.setDate(end.getDate() - i * 7);
    const label = `S${getWeekNumber(end)}`;
    buckets.push({ week: label, horas: 0 });
  }
  // distribuir horas por fecha de última actividad de forma aproximada
  for (const site of sites) {
    const ref = site.actualEnd ?? site.actualStart ?? site.lastUpdate;
    const weeksAgo = Math.floor(
      (base.getTime() - new Date(ref).getTime()) / (7 * 86_400_000),
    );
    const idx = weeks - 1 - weeksAgo;
    if (idx >= 0 && idx < weeks) buckets[idx].horas += site.hoursWorked;
  }
  return buckets;
}

function getWeekNumber(d: Date): number {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
  return Math.ceil(((date.getTime() - yearStart.getTime()) / 86_400_000 + 1) / 7);
}

/** Retrasos por región. */
export function overdueByRegion(sites: Site[]): { region: string; atrasados: number }[] {
  const map = new Map<string, number>();
  for (const s of sites) {
    if (isOverdue(s)) map.set(s.region, (map.get(s.region) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .map(([region, atrasados]) => ({ region, atrasados }))
    .sort((a, b) => b.atrasados - a.atrasados);
}

/** Tiempo promedio (días) por tipo de trabajo, sobre sitios terminados. */
export function avgDurationByType(sites: Site[]): { tipo: string; dias: number }[] {
  const acc = new Map<string, { sum: number; n: number }>();
  for (const s of sites) {
    if (s.status === "terminado" && s.actualStart && s.actualEnd) {
      const dias = Math.max(
        1,
        Math.round(
          (new Date(s.actualEnd).getTime() - new Date(s.actualStart).getTime()) /
            86_400_000,
        ),
      );
      const cur = acc.get(s.workType) ?? { sum: 0, n: 0 };
      cur.sum += dias;
      cur.n += 1;
      acc.set(s.workType, cur);
    }
  }
  return Array.from(acc.entries()).map(([tipo, v]) => ({
    tipo,
    dias: Math.round(v.sum / v.n),
  }));
}

export const STATUS_KEYS: SiteStatus[] = [
  "terminado",
  "ejecucion",
  "atrasado",
  "programado",
  "pendiente",
];
