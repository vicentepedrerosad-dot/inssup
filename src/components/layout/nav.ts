import type { UserRole } from "@/lib/types";
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
  roles?: UserRole[]; // si no está, visible para todos
  exact?: boolean;
}

export const NAV_ITEMS: NavItem[] = [
  {
    href: "/",
    label: "Dashboard",
    icon: LayoutDashboard,
    section: "Operación",
    exact: true,
  },
  { href: "/sitios", label: "Sitios", icon: RadioTower, section: "Operación" },
  { href: "/proyectos", label: "Proyectos", icon: FolderKanban, section: "Operación" },
  {
    href: "/cuadrillas",
    label: "Cuadrillas",
    icon: Users,
    section: "Operación",
    roles: ["administrador", "gerente", "supervisor", "jefe_cuadrilla"],
  },
  {
    href: "/terreno",
    label: "Terreno",
    icon: HardHat,
    section: "Operación",
    roles: ["administrador", "supervisor", "jefe_cuadrilla", "tecnico"],
  },
  {
    href: "/clientes",
    label: "Clientes",
    icon: Building2,
    section: "Comercial",
    roles: ["administrador", "gerente", "supervisor"],
  },
  {
    href: "/finanzas",
    label: "Finanzas",
    icon: Wallet,
    section: "Comercial",
    roles: ["administrador", "gerente"],
  },
  { href: "/reportes", label: "Reportes", icon: FileBarChart, section: "Comercial" },
  {
    href: "/admin",
    label: "Administración",
    icon: ShieldCheck,
    section: "Administración",
    roles: ["administrador", "gerente"],
  },
];

export function visibleNav(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((i) => !i.roles || i.roles.includes(role));
}
