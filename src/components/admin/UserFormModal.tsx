"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, FieldGroup } from "@/components/ui/Field";
import { ROLE } from "@/lib/status";
import {
  PERMISSIONS, ROLE_TEMPLATE, ALL_PERMISSIONS, SUPER_ROLES,
  type Permission, type AuthUser,
} from "@/lib/permissions";
import type { UserRole } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { ShieldCheck, DollarSign, Check } from "lucide-react";

const ROLES: UserRole[] = ["administrador", "gerente", "supervisor", "jefe_cuadrilla", "tecnico", "cliente"];
const GROUPS = ["Operación", "Comercial", "Administración"] as const;

export function UserFormModal({
  open,
  onClose,
  onSaved,
  user,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  user?: AuthUser;
}) {
  const { createUser, updateUser } = useAuth();
  const editing = !!user;

  const [form, setForm] = useState({
    username: user?.username ?? "",
    password: "",
    name: user?.name ?? "",
    title: user?.title ?? "",
    role: user?.role ?? ("tecnico" as UserRole),
    permissions: (user?.permissions ?? ROLE_TEMPLATE.tecnico) as Permission[],
    active: user?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const isSuper = SUPER_ROLES.includes(form.role);

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const onRole = (role: UserRole) => {
    // Al cambiar el rol, precargar la plantilla de accesos sugerida.
    set({ role, permissions: [...ROLE_TEMPLATE[role]] });
  };

  const toggle = (p: Permission) =>
    set({
      permissions: form.permissions.includes(p)
        ? form.permissions.filter((x) => x !== p)
        : [...form.permissions, p],
    });

  const submit = async () => {
    if (!form.name.trim()) return toast.error("El nombre es obligatorio.");
    if (!editing && (!form.username.trim() || form.password.length < 6))
      return toast.error("Usuario y contraseña (mín. 6) son obligatorios.");

    const perms = isSuper ? ALL_PERMISSIONS : form.permissions;
    setLoading(true);
    const res = editing
      ? await updateUser(user!.id, { name: form.name, title: form.title, role: form.role, permissions: perms, active: form.active })
      : await createUser({ username: form.username, password: form.password, name: form.name, title: form.title, role: form.role, permissions: perms });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success(editing ? "Usuario actualizado" : "Usuario creado", { description: form.name });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar usuario" : "Nuevo usuario"}
      subtitle={editing ? `@${user?.username}` : "Crea una cuenta y define sus accesos"}
      size="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{editing ? "Guardar cambios" : "Crear usuario"}</Button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <FieldGroup label="Nombre completo">
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Nombre Apellido" />
          </FieldGroup>
          <FieldGroup label="Cargo / título">
            <Input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="Ej: Técnico de terreno" />
          </FieldGroup>
          <FieldGroup label="Usuario (para ingresar)" hint={editing ? "No se puede cambiar" : "Sin espacios, ej: nombre.apellido"}>
            <Input value={form.username} onChange={(e) => set({ username: e.target.value.toLowerCase() })} disabled={editing} placeholder="usuario" autoCapitalize="none" />
          </FieldGroup>
          {!editing ? (
            <FieldGroup label="Contraseña temporal" hint="El usuario deberá cambiarla al entrar">
              <Input type="text" value={form.password} onChange={(e) => set({ password: e.target.value })} placeholder="Mínimo 6 caracteres" />
            </FieldGroup>
          ) : (
            <FieldGroup label="Estado">
              <Select value={form.active ? "1" : "0"} onChange={(e) => set({ active: e.target.value === "1" })}>
                <option value="1">Activo</option>
                <option value="0">Inactivo (bloqueado)</option>
              </Select>
            </FieldGroup>
          )}
          <FieldGroup label="Rol" className="sm:col-span-2">
            <Select value={form.role} onChange={(e) => onRole(e.target.value as UserRole)}>
              {ROLES.map((r) => <option key={r} value={r}>{ROLE[r].label} — {ROLE[r].scope}</option>)}
            </Select>
          </FieldGroup>
        </div>

        {/* Checklist de accesos */}
        <div className="rounded-xl border border-slate-200">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
              <ShieldCheck className="size-4 text-brand-600" /> Accesos del usuario
            </span>
            {!isSuper && (
              <span className="text-xs text-slate-400">{form.permissions.length}/{ALL_PERMISSIONS.length} activos</span>
            )}
          </div>

          {isSuper ? (
            <div className="flex items-center gap-2 px-3 py-4 text-sm text-slate-600">
              <ShieldCheck className="size-5 text-emerald-500" />
              <span>{ROLE[form.role].label} tiene <b>acceso total</b> a la plataforma, incluidos precios y gestión de usuarios. No se puede limitar.</span>
            </div>
          ) : (
            <div className="space-y-3 p-3">
              {GROUPS.map((g) => {
                const perms = PERMISSIONS.filter((p) => p.group === g);
                if (!perms.length) return null;
                return (
                  <div key={g}>
                    <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">{g}</p>
                    <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                      {perms.map((p) => {
                        const on = form.permissions.includes(p.key);
                        const isPrice = p.key === "ver_precios";
                        return (
                          <button
                            key={p.key}
                            type="button"
                            onClick={() => toggle(p.key)}
                            className={cn(
                              "flex items-start gap-2.5 rounded-lg border p-2.5 text-left transition-colors",
                              on ? "border-brand-300 bg-brand-50/60" : "border-slate-200 hover:bg-slate-50",
                              isPrice && on && "border-emerald-300 bg-emerald-50/60",
                            )}
                          >
                            <span className={cn(
                              "mt-0.5 grid size-4.5 shrink-0 place-items-center rounded border",
                              on ? (isPrice ? "border-emerald-500 bg-emerald-500 text-white" : "border-brand-500 bg-brand-500 text-white") : "border-slate-300",
                            )}>
                              {on && <Check className="size-3" />}
                            </span>
                            <span className="min-w-0">
                              <span className="flex items-center gap-1 text-sm font-medium text-slate-800">
                                {isPrice && <DollarSign className="size-3.5 text-emerald-600" />}
                                {p.label}
                              </span>
                              <span className="block text-xs text-slate-500">{p.description}</span>
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              <p className="rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
                <b>Ver precios e ingresos</b> está desactivado por defecto para trabajadores: solo quien lo tenga marcado verá montos, ingresos y márgenes.
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
