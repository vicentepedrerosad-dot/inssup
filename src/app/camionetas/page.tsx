"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { useAuth } from "@/lib/auth";
import {
  computeRevision,
  REVISION_META,
  type Vehicle,
  type RevisionStatus,
} from "@/lib/vehicles";
import { formatDate, cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TD, TH } from "@/components/ui/Table";
import { VehicleFormModal } from "@/components/vehicles/VehicleFormModal";
import {
  Truck, Plus, Pencil, Trash2, ShieldX, Loader2, CalendarClock,
  CheckCircle2, AlertTriangle, Clock3, HelpCircle,
} from "lucide-react";
import { toast } from "sonner";

const ORDER: Record<RevisionStatus, number> = { vencida: 0, por_vencer: 1, sin_registro: 2, al_dia: 3 };

export default function CamionetasPage() {
  const { hasPermission, listVehicles, deleteVehicle } = useAuth();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [edit, setEdit] = useState<{ open: boolean; item?: Vehicle }>({ open: false });
  const [del, setDel] = useState<Vehicle | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setVehicles(await listVehicles());
    setLoading(false);
  }, [listVehicles]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (hasPermission("ver_camionetas")) load(); else setLoading(false); }, [load, hasPermission]);

  const rows = useMemo(
    () =>
      vehicles
        .map((v) => ({ v, rev: computeRevision(v.patente, v.lastRevision) }))
        .sort((a, b) => ORDER[a.rev.status] - ORDER[b.rev.status] || a.rev.daysLeft - b.rev.daysLeft),
    [vehicles],
  );

  const counts = useMemo(() => {
    const c = { al_dia: 0, por_vencer: 0, vencida: 0, sin_registro: 0 };
    rows.forEach((r) => c[r.rev.status]++);
    return c;
  }, [rows]);

  if (!hasPermission("ver_camionetas")) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState icon={<ShieldX className="size-6" />} title="Sin acceso a Camionetas"
          description="Esta sección es exclusiva de administración (gerente y administrador)." />
      </Card>
    );
  }

  const confirmDelete = async () => {
    if (!del) return;
    const res = await deleteVehicle(del.id);
    if (res.error) return toast.error(res.error);
    toast.success("Camioneta eliminada", { description: del.patente });
    setDel(null);
    load();
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Camionetas y Flota"
        description="Control de patentes y revisión técnica según el calendario chileno (por último dígito)."
        actions={
          <Button size="sm" onClick={() => setEdit({ open: true })}>
            <Plus className="size-4" /> Nueva camioneta
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Flota total" value={vehicles.length} icon={<Truck className="size-4" />} tone="brand" accent />
        <KpiCard label="Al día" value={counts.al_dia} icon={<CheckCircle2 className="size-4" />} tone="emerald" accent />
        <KpiCard label="Por vencer" value={counts.por_vencer} icon={<Clock3 className="size-4" />} tone="amber" accent hint="Próximos 30 días" />
        <KpiCard label="Vencidas / sin registro" value={counts.vencida + counts.sin_registro} icon={<AlertTriangle className="size-4" />} tone={counts.vencida ? "red" : "slate"} accent />
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <div className="grid place-items-center py-16"><Loader2 className="size-6 animate-spin text-slate-300" /></div>
        ) : rows.length === 0 ? (
          <EmptyState icon={<Truck className="size-6" />} title="Sin camionetas registradas"
            description="Agrega la primera camioneta para controlar su revisión técnica." />
        ) : (
          <Table>
            <THead>
              <tr>
                <TH>Patente</TH>
                <TH>Vehículo</TH>
                <TH className="hidden md:table-cell">Mes revisión</TH>
                <TH className="hidden lg:table-cell">Última rev.</TH>
                <TH>Vence</TH>
                <TH>Estado</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {rows.map(({ v, rev }) => {
                const meta = REVISION_META[rev.status];
                return (
                  <TR key={v.id}>
                    <TD className="font-mono font-semibold text-slate-800">{v.patente}</TD>
                    <TD>
                      <span className="block font-medium text-slate-800">{v.marca} {v.modelo}</span>
                      <span className="block text-xs text-slate-400">{v.tipo}{v.anio ? ` · ${v.anio}` : ""}{v.notes ? ` · ${v.notes}` : ""}</span>
                    </TD>
                    <TD className="hidden md:table-cell">
                      <span className="inline-flex items-center gap-1 text-sm text-slate-600">
                        <CalendarClock className="size-3.5 text-slate-400" />
                        {rev.assignedMonthName}
                      </span>
                    </TD>
                    <TD className="hidden lg:table-cell text-slate-500">{formatDate(v.lastRevision)}</TD>
                    <TD className="text-slate-600">
                      {rev.expiry ? formatDate(rev.expiry.toISOString()) : rev.nextDeadline ? `~${formatDate(rev.nextDeadline.toISOString())}` : "—"}
                    </TD>
                    <TD>
                      <div className="flex flex-col gap-0.5">
                        <span className={cn("inline-flex w-fit items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset", meta.badge)}>
                          <span className={cn("size-1.5 rounded-full", meta.dot)} />
                          {meta.label}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {rev.status === "vencida" && `Hace ${Math.abs(rev.daysLeft)} días`}
                          {rev.status === "por_vencer" && `En ${rev.daysLeft} días`}
                          {rev.status === "al_dia" && `En ${rev.daysLeft} días`}
                          {rev.status === "sin_registro" && (rev.nextDeadline ? `En ${rev.daysLeft} días` : "Sin dígito")}
                        </span>
                      </div>
                    </TD>
                    <TD align="right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => setEdit({ open: true, item: v })} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-700" aria-label="Editar">
                          <Pencil className="size-4" />
                        </button>
                        <button onClick={() => setDel(v)} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600" aria-label="Eliminar">
                          <Trash2 className="size-4" />
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

      <div className="flex items-start gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
        <HelpCircle className="size-4 shrink-0 text-slate-400" />
        <span>
          La revisión técnica de vehículos livianos particulares es <b>anual</b> y el mes se asigna por el
          último dígito de la patente (marzo y diciembre quedan libres). El certificado vale 12 meses desde
          la última revisión aprobada; registra esa fecha para un cálculo exacto.
        </span>
      </div>

      {edit.open && (
        <VehicleFormModal open onClose={() => setEdit({ open: false })} onSaved={load} vehicle={edit.item} />
      )}

      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Eliminar camioneta"
        size="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Eliminar</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Eliminar la camioneta <b className="font-mono text-slate-900">{del?.patente}</b>? Quedará registrado en la bitácora.
        </p>
      </Modal>
    </div>
  );
}
