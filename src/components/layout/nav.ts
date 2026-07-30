import type { UserRole } from "@/lib/types";
import type { Permission } from "@/lib/permissions";
import {
  LayoutDashboard,
  FolderKanban,
  RadioTower,
  Users,
  HardHat,
  Building2,
  Wallet,
  FileBarChart,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  section: "Operación" | "Comercial" | "Administración";
  permission?: Permission; // acceso requerido (si no está, visible para todos)
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, section: "Operación", permission: "ver_dashboard", exact: true },
  { href: "/sitios", label: "Sitios", icon: RadioTower, section: "Operación", permission: "ver_sitios" },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban, section: "Operación", permission: "ver_proyectos" },
  { href: "/cuadrillas", label: "Cuadrillas", icon: Users, section: "Operación", permission: "ver_cuadrillas" },
  { href: "/terreno", label: "Terreno", icon: HardHat, section: "Operación", permission: "registrar_terreno" },
  { href: "/clientes", label: "Clientes", icon: Building2, section: "Comercial", permission: "ver_clientes" },
  { href: "/finanzas", label: "Finanzas", icon: Wallet, section: "Comercial", permission: "ver_finanzas" },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, section: "Comercial", permission: "ver_reportes" },
  { href: "/admin", label: "Administración", icon: ShieldCheck, section: "Administración", permission: "gestionar_usuarios" },
];

export function visibleNav(
  _role: UserRole,
  hasPermission: (p: Permission) => boolean,
): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.permission || hasPermission(i.permission));
}
