"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FieldGroup } from "@/components/ui/Field";
import { computeRevision, REVISION_META, type Vehicle } from "@/lib/vehicles";
import { CalendarClock } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const TIPOS = ["Camioneta", "Camión", "Furgón", "Automóvil", "SUV"];

export function VehicleFormModal({
  open,
  onClose,
  onSaved,
  vehicle,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  vehicle?: Vehicle;
}) {
  const { upsertVehicle } = useAuth();
  const editing = !!vehicle;

  const [form, setForm] = useState({
    patente: vehicle?.patente ?? "",
    marca: vehicle?.marca ?? "",
    modelo: vehicle?.modelo ?? "",
    anio: vehicle?.anio ?? new Date().getFullYear(),
    tipo: vehicle?.tipo ?? "Camioneta",
    lastRevision: vehicle?.lastRevision ?? "",
    notes: vehicle?.notes ?? "",
    active: vehicle?.active ?? true,
  });
  const [loading, setLoading] = useState(false);
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const preview = useMemo(
    () => (form.patente ? computeRevision(form.patente, form.lastRevision || null) : null),
    [form.patente, form.lastRevision],
  );

  const submit = async () => {
    if (!form.patente.trim()) return toast.error("La patente es obligatoria.");
    setLoading(true);
    const res = await upsertVehicle({
      id: vehicle?.id,
      patente: form.patente,
      marca: form.marca,
      modelo: form.modelo,
      anio: Number(form.anio) || null,
      tipo: form.tipo,
      lastRevision: form.lastRevision || null,
      notes: form.notes,
      active: form.active,
    });
    setLoading(false);
    if (res.error) return toast.error(res.error);
    toast.success(editing ? "Camioneta actualizada" : "Camioneta registrada", { description: form.patente.toUpperCase() });
    onSaved();
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar camioneta" : "Nueva camioneta"}
      subtitle={editing ? vehicle?.patente : "Registra un vehículo de la flota"}
      size="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={submit} disabled={loading}>{editing ? "Guardar cambios" : "Registrar"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Patente" hint="Determina el mes de revisión técnica">
          <Input value={form.patente} onChange={(e) => set({ patente: e.target.value.toUpperCase() })} placeholder="GXTR41" className="font-mono uppercase" />
        </FieldGroup>
        <FieldGroup label="Tipo">
          <Select value={form.tipo} onChange={(e) => set({ tipo: e.target.value })}>
            {TIPOS.map((t) => <option key={t} value={t}>{t}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Marca">
          <Input value={form.marca} onChange={(e) => set({ marca: e.target.value })} placeholder="Toyota" />
        </FieldGroup>
        <FieldGroup label="Modelo">
          <Input value={form.modelo} onChange={(e) => set({ modelo: e.target.value })} placeholder="Hilux 4x4" />
        </FieldGroup>
        <FieldGroup label="Año">
          <Input type="number" value={form.anio} onChange={(e) => set({ anio: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Última revisión aprobada" hint="Opcional · el certificado vale 12 meses">
          <Input type="date" value={form.lastRevision} onChange={(e) => set({ lastRevision: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Notas / cuadrilla" className="sm:col-span-2">
          <Textarea rows={2} value={form.notes} onChange={(e) => set({ notes: e.target.value })} placeholder="Asignación, observaciones…" />
        </FieldGroup>
      </div>

      {preview && preview.assignedMonth && (
        <div className={cn("mt-4 flex items-start gap-2.5 rounded-xl p-3 ring-1 ring-inset", REVISION_META[preview.status].badge)}>
          <CalendarClock className="mt-0.5 size-4 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">
              Revisión técnica: {preview.assignedMonthName} (patente termina en {preview.digit})
            </p>
            <p className="text-xs opacity-90">
              {preview.status === "vencida" && `Vencida hace ${Math.abs(preview.daysLeft)} días.`}
              {preview.status === "por_vencer" && `Vence en ${preview.daysLeft} días.`}
              {preview.status === "al_dia" && `Al día · vence en ${preview.daysLeft} días.`}
              {preview.status === "sin_registro" && `Sin registro. Próxima fecha límite estimada: ${preview.nextDeadline?.toLocaleDateString("es-CL")}.`}
            </p>
          </div>
        </div>
      )}
    </Modal>
  );
}
