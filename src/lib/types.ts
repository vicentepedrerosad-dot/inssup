/* ---------------------------------------------------------------------------
   INSSUP — Modelo de dominio
--------------------------------------------------------------------------- */

export type SiteStatus =
  | "terminado"
  | "ejecucion"
  | "atrasado"
  | "pendiente"
  | "programado";

export type ProjectStatus =
  | "planificacion"
  | "en_curso"
  | "en_riesgo"
  | "completado"
  | "pausado";

export type Priority = "baja" | "media" | "alta" | "critica";

export type WorkType =
  | "instalacion"
  | "puesta_en_marcha"
  | "site_survey"
  | "mmoo"
  | "mantenimiento_preventivo"
  | "mantenimiento_correctivo"
  | "emergencia_24_7"
  | "readecuacion";

export type UserRole =
  | "administrador"
  | "gerente"
  | "supervisor"
  | "jefe_cuadrilla"
  | "tecnico"
  | "cliente";

export interface Client {
  id: string;
  name: string;
  shortName: string;
  color: string; // color de marca del cliente (para gráficos)
  contactName: string;
  contactRole: string;
  contactEmail: string;
  contactPhone: string;
  segment: "operador_movil" | "torrero" | "corporativo";
}

export interface Crew {
  id: string;
  name: string;
  base: string; // ciudad base
  region: string;
  lead: string; // jefe de cuadrilla
  members: string[]; // técnicos
  specialties: WorkType[];
  active: boolean;
}

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
}

export interface Evidence {
  id: string;
  label: string;
  type: "foto" | "documento";
  hue: number; // para placeholder visual determinístico
  uploadedAt: string;
  uploadedBy: string;
}

export interface ActivityLog {
  id: string;
  at: string;
  author: string;
  role: UserRole;
  message: string;
  kind: "estado" | "avance" | "horas" | "evidencia" | "bloqueo" | "nota" | "creacion";
}

export interface Site {
  id: string; // código de sitio (ej: STGO-0421)
  name: string;
  clientId: string;
  projectId: string;
  region: string;
  comuna: string;
  lat: number;
  lng: number;
  workType: WorkType;
  status: SiteStatus;
  priority: Priority;
  scheduledDate: string; // programada
  slaDate: string; // fecha compromiso
  actualStart: string | null;
  actualEnd: string | null;
  progress: number; // 0-100
  crewId: string | null;
  supervisor: string;
  hoursWorked: number;
  budget: number; // ingreso del sitio
  cost: number; // costo estimado
  billed: boolean; // facturado
  checklist: ChecklistItem[];
  evidence: Evidence[];
  observations: string;
  blocker: string | null;
  lastUpdate: string; // última actualización
  activity: ActivityLog[];
}

export interface Project {
  id: string;
  code: string;
  name: string;
  clientId: string;
  status: ProjectStatus;
  startDate: string;
  commitmentDate: string;
  budget: number; // presupuesto
  expectedRevenue: number;
  estimatedCost: number;
  supervisor: string;
  region: string;
  description: string;
  activity: ActivityLog[];
}

export interface UserProfile {
  id: string;
  name: string;
  role: UserRole;
  title: string;
  clientId?: string; // para rol cliente externo
}

/* ---------------------------- Bitácora de auditoría ----------------------- */

export type AuditAction = "crear" | "editar" | "eliminar" | "estado" | "avance";
export type AuditEntity = "sitio" | "proyecto" | "cliente" | "cuadrilla" | "config";

export interface AuditChange {
  field: string; // etiqueta legible del campo
  before: string;
  after: string;
}

export interface AuditEntry {
  id: string;
  at: string; // fecha y hora ISO
  userId: string;
  userName: string; // quién realizó el cambio
  userRole: UserRole;
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName: string;
  summary: string; // descripción legible del cambio
  changes?: AuditChange[]; // detalle campo por campo (antes → después)
}
