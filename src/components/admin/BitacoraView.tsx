"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth, type AuditRow } from "@/lib/auth";
import { formatDateTime, cn } from "@/lib/utils";
import { ROLE } from "@/lib/status";
import { Avatar, EmptyState } from "@/components/ui/misc";
import { Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { exportCSV, toCSV } from "@/lib/export";
import {
  Plus, Pencil, Trash2, Activity as ActivityIcon, TrendingUp, History,
  Download, Search, ShieldAlert, RefreshCw, Loader2,
} from "lucide-react";
import { toast } from "sonner";

const ACTION_META: Record<string, { label: string; icon: typeof Plus; cls: string }> = {
  crear: { label: "Creación", icon: Plus, cls: "bg-emerald-100 text-emerald-600" },
  editar: { label: "Edición", icon: Pencil, cls: "bg-blue-100 text-blue-600" },
  eliminar: { label: "Eliminación", icon: Trash2, cls: "bg-red-100 text-red-600" },
  estado: { label: "Cambio de estado", icon: ActivityIcon, cls: "bg-amber-100 text-amber-600" },
  avance: { label: "Avance", icon: TrendingUp, cls: "bg-brand-100 text-brand-600" },
};

const ENTITY_LABEL: Record<string, string> = {
  sitio: "Sitio", proyecto: "Proyecto", cliente: "Empresa",
  cuadrilla: "Cuadrilla", usuario: "Usuario", camioneta: "Camioneta", config: "Configuración",
};

export function BitacoraView() {
  const { listAudit } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [userFilter, setUserFilter] = useState("");
  const [entityFilter, setEntityFilter] = useState("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const data = await listAudit();
    setRows(data);
    setLoading(false);
  }, [listAudit]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((e) => {
      if (userFilter && e.user_name !== userFilter) return false;
      if (entityFilter && e.entity !== entityFilter) return false;
      if (q && !`${e.entity_name ?? ""} ${e.summary ?? ""} ${e.entity_id ?? ""} ${e.user_name}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, userFilter, entityFilter, search]);

  const userNames = useMemo(() => Array.from(new Set(rows.map((e) => e.user_name))), [rows]);

  const handleExport = () => {
    const out = filtered.map((e) => ({
      fecha_hora: formatDateTime(e.at),
      usuario: e.user_name,
      rol: ROLE[e.user_role]?.label ?? e.user_role,
      accion: ACTION_META[e.action]?.label ?? e.action,
      entidad: ENTITY_LABEL[e.entity] ?? e.entity,
      elemento: e.entity_name ?? "",
      id: e.entity_id ?? "",
      detalle: e.summary ?? "",
    }));
    exportCSV("inssup-bitacora-auditoria.csv", toCSV(out));
    toast.success("Bitácora exportada", { description: `${out.length} registros en CSV.` });
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar en la bitácora…" className="pl-8.5" />
        </div>
        <Select value={userFilter} onChange={(e) => setUserFilter(e.target.value)} className="w-auto min-w-36">
          <option value="">Todos los usuarios</option>
          {userNames.map((n) => <option key={n} value={n}>{n}</option>)}
        </Select>
        <Select value={entityFilter} onChange={(e) => setEntityFilter(e.target.value)} className="w-auto min-w-32">
          <option value="">Todo tipo</option>
          {Object.keys(ENTITY_LABEL).map((k) => <option key={k} value={k}>{ENTITY_LABEL[k]}</option>)}
        </Select>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={cn("size-4", loading && "animate-spin")} />
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!filtered.length}>
          <Download className="size-4" /> <span className="hidden sm:inline">Exportar</span>
        </Button>
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-600/15">
        <ShieldAlert className="size-4 shrink-0" />
        Registro de auditoría almacenado en la base de datos (Supabase). Cada cambio queda asociado al usuario que lo realizó, con fecha y hora — para trazabilidad ante emergencias.
      </div>

      {loading ? (
        <div className="grid place-items-center rounded-xl border border-slate-200 bg-white py-16">
          <Loader2 className="size-6 animate-spin text-slate-300" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white">
          <EmptyState icon={<History className="size-6" />} title="Sin movimientos registrados"
            description="Los cambios que realices (o tu equipo) aparecerán aquí con autor, fecha y hora." />
        </div>
      ) : (
        <ol className="space-y-2">
          {filtered.map((e) => <BitacoraRow key={e.id} entry={e} />)}
        </ol>
      )}
    </div>
  );
}

function BitacoraRow({ entry }: { entry: AuditRow }) {
  const [open, setOpen] = useState(false);
  const meta = ACTION_META[entry.action] ?? ACTION_META.editar;
  const Icon = meta.icon;
  const hasDetail = !!entry.changes?.length;

  return (
    <li className="rounded-xl border border-slate-200 bg-white p-3">
      <div className="flex items-start gap-3">
        <span className={cn("grid size-9 shrink-0 place-items-center rounded-lg", meta.cls)}>
          <Icon className="size-4.5" />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] font-semibold text-slate-600">
              {ENTITY_LABEL[entry.entity] ?? entry.entity}
            </span>
            <span className="text-sm font-semibold text-slate-800">{entry.entity_name}</span>
            {entry.entity_id && <span className="font-mono text-[11px] text-slate-400">{entry.entity_id}</span>}
          </div>
          <p className="mt-0.5 line-clamp-2 text-sm text-slate-600">{entry.summary}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1.5">
              <Avatar name={entry.user_name} size={18} />
              <span className="font-medium text-slate-700">{entry.user_name}</span>
              <span className="text-slate-400">· {ROLE[entry.user_role]?.label ?? entry.user_role}</span>
            </span>
            <span className="text-slate-300">•</span>
            <span className="tabular">{formatDateTime(entry.at)}</span>
            {hasDetail && (
              <button onClick={() => setOpen((v) => !v)} className="ml-auto font-medium text-brand-600 hover:underline">
                {open ? "Ocultar detalle" : `Ver ${entry.changes!.length} cambio(s)`}
              </button>
            )}
          </div>

          {open && hasDetail && (
            <div className="mt-2 space-y-1 rounded-lg bg-slate-50 p-2.5">
              {entry.changes!.map((c, i) => (
                <div key={i} className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="font-medium text-slate-600">{c.field}:</span>
                  <span className="rounded bg-red-50 px-1.5 py-0.5 text-red-600 line-through">{c.before}</span>
                  <span className="text-slate-400">→</span>
                  <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-medium text-emerald-700">{c.after}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
  );
}
