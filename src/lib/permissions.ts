import type { UserRole } from "./types";

/** Claves de acceso (el "checklist" que ve el gerente al crear/editar usuarios). */
export type Permission =
  | "ver_dashboard"
  | "ver_sitios"
  | "editar_sitios"
  | "ver_proyectos"
  | "editar_proyectos"
  | "ver_cuadrillas"
  | "registrar_terreno"
  | "ver_clientes"
  | "ver_precios"
  | "ver_finanzas"
  | "ver_reportes"
  | "ver_camionetas"
  | "ver_bitacora"
  | "gestionar_usuarios";

export interface PermissionDef {
  key: Permission;
  label: string;
  description: string;
  group: "Operación" | "Comercial" | "Administración";
}

export const PERMISSIONS: PermissionDef[] = [
  { key: "ver_dashboard", label: "Ver dashboard", description: "Panel ejecutivo y métricas operativas", group: "Operación" },
  { key: "ver_sitios", label: "Ver sitios", description: "Consultar la red de sitios y fichas", group: "Operación" },
  { key: "editar_sitios", label: "Editar sitios", description: "Crear y modificar sitios", group: "Operación" },
  { key: "ver_proyectos", label: "Ver proyectos", description: "Consultar proyectos y su avance", group: "Operación" },
  { key: "editar_proyectos", label: "Editar proyectos", description: "Crear y modificar proyectos", group: "Operación" },
  { key: "ver_cuadrillas", label: "Ver cuadrillas", description: "Productividad y asignación de cuadrillas", group: "Operación" },
  { key: "registrar_terreno", label: "Registrar en terreno", description: "Actualizar avances, evidencias y estados", group: "Operación" },
  { key: "ver_clientes", label: "Ver clientes", description: "Empresas, contactos y cartera", group: "Comercial" },
  { key: "ver_precios", label: "Ver precios e ingresos", description: "Montos, ingresos, costos y márgenes", group: "Comercial" },
  { key: "ver_finanzas", label: "Ver finanzas", description: "Módulo financiero completo", group: "Comercial" },
  { key: "ver_reportes", label: "Ver reportes", description: "Generar y exportar reportes", group: "Comercial" },
  { key: "ver_camionetas", label: "Ver camionetas", description: "Flota, patentes y revisión técnica", group: "Administración" },
  { key: "ver_bitacora", label: "Ver bitácora", description: "Registro de auditoría de cambios", group: "Administración" },
  { key: "gestionar_usuarios", label: "Gestionar usuarios", description: "Crear usuarios y asignar accesos", group: "Administración" },
];

export const ALL_PERMISSIONS: Permission[] = PERMISSIONS.map((p) => p.key);

/** Roles que SIEMPRE tienen todos los accesos (no se les puede limitar). */
export const SUPER_ROLES: UserRole[] = ["administrador", "gerente"];

/** Plantilla de accesos sugerida al elegir un rol (base para el checklist). */
export const ROLE_TEMPLATE: Record<UserRole, Permission[]> = {
  administrador: ALL_PERMISSIONS,
  gerente: ALL_PERMISSIONS,
  supervisor: [
    "ver_dashboard", "ver_sitios", "editar_sitios", "ver_proyectos",
    "editar_proyectos", "ver_cuadrillas", "registrar_terreno", "ver_clientes", "ver_reportes",
  ],
  jefe_cuadrilla: ["ver_dashboard", "ver_sitios", "ver_cuadrillas", "registrar_terreno"],
  tecnico: ["ver_sitios", "registrar_terreno"],
  cliente: ["ver_dashboard", "ver_proyectos", "ver_reportes"],
};

export interface AuthUser {
  id: string;
  username: string;
  name: string;
  title: string;
  role: UserRole;
  permissions: Permission[];
  active: boolean;
  mustChangePassword: boolean;
  createdBy: string;
  createdAt: string;
}

/**
 * Permisos efectivos: admin y gerente tienen TODO siempre; el resto, solo lo
 * que se les otorgó. Los precios nunca se muestran sin `ver_precios`.
 */
export function hasPermission(user: AuthUser | null, perm: Permission): boolean {
  if (!user) return false;
  if (SUPER_ROLES.includes(user.role)) return true;
  return user.permissions.includes(perm);
}

export function canSeePrices(user: AuthUser | null): boolean {
  return hasPermission(user, "ver_precios");
}
