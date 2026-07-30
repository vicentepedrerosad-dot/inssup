"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import type { AuthUser } from "@/lib/permissions";
import { ROLE } from "@/lib/status";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TD, TH } from "@/components/ui/Table";
import { UserFormModal } from "./UserFormModal";
import {
  Plus, Pencil, KeyRound, Lock, Unlock, Loader2, DollarSign, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export function UsersManager() {
  const { listUsers, updateUser, setUserPassword, user: me } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<{ open: boolean; user?: AuthUser }>({ open: false });
  const [pwReset, setPwReset] = useState<AuthUser | null>(null);
  const [newPw, setNewPw] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setUsers(await listUsers());
    setLoading(false);
  }, [listUsers]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const toggleActive = async (u: AuthUser) => {
    const res = await updateUser(u.id, { active: !u.active });
    if (res.error) return toast.error(res.error);
    toast.success(u.active ? "Usuario bloqueado" : "Usuario activado", { description: u.name });
    load();
  };

  const doReset = async () => {
    if (!pwReset) return;
    if (newPw.length < 6) return toast.error("Mínimo 6 caracteres.");
    const res = await setUserPassword(pwReset.id, newPw);
    if (res.error) return toast.error(res.error);
    toast.success("Contraseña restablecida", { description: `${pwReset.name} deberá cambiarla al entrar.` });
    setPwReset(null); setNewPw("");
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">{users.length} usuarios registrados</p>
        <Button size="sm" onClick={() => setEdit({ open: true })}>
          <Plus className="size-4" /> Nuevo usuario
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Usuario</TH>
                <TH className="hidden sm:table-cell">Rol</TH>
                <TH align="center">Precios</TH>
                <TH className="hidden md:table-cell" align="center">Accesos</TH>
                <TH align="center">Estado</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {users.map((u) => {
                const isSuper = u.role === "administrador" || u.role === "gerente";
                const seesPrices = isSuper || u.permissions.includes("ver_precios");
                return (
                  <TR key={u.id}>
                    <TD>
                      <div className="flex items-center gap-2.5">
                        <Avatar name={u.name} size={32} />
                        <div className="min-w-0">
                          <span className="block truncate font-medium text-slate-800">
                            {u.name}{me?.id === u.id && <span className="ml-1 text-xs text-brand-600">(tú)</span>}
                          </span>
                          <span className="block truncate text-xs text-slate-400">@{u.username} · {u.title}</span>
                        </div>
                      </div>
                    </TD>
                    <TD className="hidden sm:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        {isSuper && <ShieldCheck className="size-3.5 text-brand-600" />}
                        {ROLE[u.role].label}
                      </span>
                    </TD>
                    <TD align="center">
                      {seesPrices ? (
                        <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                          <DollarSign className="size-3" /> Sí
                        </span>
                      ) : (
                        <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-xs text-slate-500">No</span>
                      )}
                    </TD>
                    <TD align="center" className="hidden md:table-cell tabular text-slate-500">
                      {isSuper ? "Total" : u.permissions.length}
                    </TD>
                    <TD align="center">
                      {u.active ? <Badge tone="emerald">Activo</Badge> : <Badge tone="red">Bloqueado</Badge>}
                    </TD>
                    <TD align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEdit({ open: true, user: u })} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-700" aria-label="Editar">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => { setPwReset(u); setNewPw(""); }} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-amber-600" aria-label="Restablecer contraseña">
                          <KeyRound className="size-4" />
                        </button>
                        <button onClick={() => toggleActive(u)} disabled={me?.id === u.id} className={cn("grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 disabled:opacity-30", u.active ? "hover:text-red-600" : "hover:text-emerald-600")} aria-label={u.active ? "Bloquear" : "Activar"}>
                          {u.active ? <Lock className="size-4" /> : <Unlock className="size-4" />}
                        </button>
                      </div>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        )}
      </Card>

      {edit.open && (
        <UserFormModal open onClose={() => setEdit({ open: false })} onSaved={load} user={edit.user} />
      )}

      <Modal
        open={!!pwReset}
        onClose={() => setPwReset(null)}
        title="Restablecer contraseña"
        subtitle={pwReset ? `${pwReset.name} (@${pwReset.username})` : undefined}
        size="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setPwReset(null)}>Cancelar</Button>
            <Button size="sm" onClick={doReset}><KeyRound className="size-4" /> Restablecer</Button>
          </>
        }
      >
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-600">Nueva contraseña temporal</label>
          <Input type="text" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="Mínimo 6 caracteres" />
          <p className="mt-2 text-xs text-slate-500">El usuario deberá cambiarla en su próximo ingreso.</p>
        </div>
      </Modal>
    </div>
  );
}
