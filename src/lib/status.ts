import type {
  SiteStatus,
  ProjectStatus,
  Priority,
  WorkType,
  UserRole,
} from "./types";

interface Meta {
  label: string;
  hex: string; // para mapa / gráficos
  /** clases de badge (fondo suave + texto + borde) */
  badge: string;
  /** clase de punto sólido */
  dot: string;
}

export const SITE_STATUS: Record<SiteStatus, Meta> = {
  terminado: {
    label: "Terminado",
    hex: "#16a34a",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  ejecucion: {
    label: "En ejecución",
    hex: "#d97706",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  atrasado: {
    label: "Atrasado",
    hex: "#dc2626",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  pendiente: {
    label: "Pendiente",
    hex: "#64748b",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  programado: {
    label: "Programado",
    hex: "#2563eb",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
};

export const PROJECT_STATUS: Record<ProjectStatus, Meta> = {
  planificacion: {
    label: "Planificación",
    hex: "#2563eb",
    badge: "bg-blue-50 text-blue-700 ring-blue-600/20",
    dot: "bg-blue-500",
  },
  en_curso: {
    label: "En curso",
    hex: "#d97706",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  en_riesgo: {
    label: "En riesgo",
    hex: "#dc2626",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
  completado: {
    label: "Completado",
    hex: "#16a34a",
    badge: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
    dot: "bg-emerald-500",
  },
  pausado: {
    label: "Pausado",
    hex: "#64748b",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
};

export const PRIORITY: Record<Priority, Meta> = {
  baja: {
    label: "Baja",
    hex: "#64748b",
    badge: "bg-slate-100 text-slate-600 ring-slate-500/20",
    dot: "bg-slate-400",
  },
  media: {
    label: "Media",
    hex: "#2563eb",
    badge: "bg-sky-50 text-sky-700 ring-sky-600/20",
    dot: "bg-sky-500",
  },
  alta: {
    label: "Alta",
    hex: "#d97706",
    badge: "bg-amber-50 text-amber-700 ring-amber-600/20",
    dot: "bg-amber-500",
  },
  critica: {
    label: "Crítica",
    hex: "#dc2626",
    badge: "bg-red-50 text-red-700 ring-red-600/20",
    dot: "bg-red-500",
  },
};

export const WORK_TYPE: Record<WorkType, { label: string; short: string }> = {
  instalacion: { label: "Instalación", short: "Instalación" },
  puesta_en_marcha: { label: "Puesta en marcha", short: "PEM" },
  site_survey: { label: "Site Survey", short: "Survey" },
  mmoo: { label: "Enlace MMOO", short: "MMOO" },
  mantenimiento_preventivo: {
    label: "Mantenimiento preventivo",
    short: "Mant. Prev.",
  },
  mantenimiento_correctivo: {
    label: "Mantenimiento correctivo",
    short: "Mant. Corr.",
  },
  emergencia_24_7: { label: "Emergencia 24/7", short: "Emergencia" },
  readecuacion: { label: "Readecuación", short: "Readec." },
};

export const ROLE: Record<UserRole, { label: string; scope: string }> = {
  administrador: { label: "Administrador", scope: "Acceso total al sistema" },
  gerente: { label: "Gerente", scope: "Visión ejecutiva y financiera" },
  supervisor: { label: "Supervisor", scope: "Proyectos y sitios a cargo" },
  jefe_cuadrilla: { label: "Jefe de cuadrilla", scope: "Sitios de su cuadrilla" },
  tecnico: { label: "Técnico", scope: "Registro en terreno" },
  cliente: { label: "Cliente externo", scope: "Solo sus proyectos" },
};

export const SITE_STATUS_ORDER: SiteStatus[] = [
  "terminado",
  "ejecucion",
  "atrasado",
  "programado",
  "pendiente",
];

export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "planificacion",
  "en_curso",
  "en_riesgo",
  "completado",
  "pausado",
];
