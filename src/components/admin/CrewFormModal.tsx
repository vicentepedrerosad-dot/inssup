"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FieldGroup } from "@/components/ui/Field";
import { REGIONS } from "@/lib/data";
import { WORK_TYPE } from "@/lib/status";
import type { Crew, WorkType } from "@/lib/types";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const WORK_TYPES = Object.keys(WORK_TYPE) as WorkType[];

export function CrewFormModal({
  open,
  onClose,
  crew,
}: {
  open: boolean;
  onClose: () => void;
  crew?: Crew;
}) {
  const { createCrew, updateCrew } = useStore();
  const editing = !!crew;

  const [form, setForm] = useState({
    name: crew?.name ?? "",
    base: crew?.base ?? "",
    region: crew?.region ?? REGIONS[0],
    lead: crew?.lead ?? "",
    membersText: crew?.members.join("\n") ?? "",
    specialties: crew?.specialties ?? ([] as WorkType[]),
    active: crew?.active ?? true,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const toggleSpec = (w: WorkType) =>
    set({
      specialties: form.specialties.includes(w)
        ? form.specialties.filter((x) => x !== w)
        : [...form.specialties, w],
    });

  const submit = () => {
    if (!form.name.trim() || !form.lead.trim()) {
      toast.error("Nombre y jefe de cuadrilla son obligatorios.");
      return;
    }
    const members = form.membersText
      .split("\n")
      .map((m) => m.trim())
      .filter(Boolean);
    if (!members.includes(form.lead)) members.unshift(form.lead);

    const data = {
      name: form.name,
      base: form.base,
      region: form.region,
      lead: form.lead,
      members,
      specialties: form.specialties,
      active: form.active,
    };

    if (editing && crew) {
      updateCrew(crew.id, data);
      toast.success("Cuadrilla actualizada", { description: form.name });
    } else {
      const id = `cw-${form.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 10)}-${Math.random().toString(36).slice(2, 5)}`;
      createCrew({ id, ...data });
      toast.success("Cuadrilla creada", { description: form.name });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar cuadrilla" : "Nueva cuadrilla"}
      subtitle={editing ? crew?.name : "Registra una cuadrilla operativa"}
      size="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={submit}>{editing ? "Guardar cambios" : "Crear cuadrilla"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Nombre">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Cuadrilla …" />
        </FieldGroup>
        <FieldGroup label="Jefe de cuadrilla">
          <Input value={form.lead} onChange={(e) => set({ lead: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Base">
          <Input value={form.base} onChange={(e) => set({ base: e.target.value })} placeholder="Ciudad base" />
        </FieldGroup>
        <FieldGroup label="Región">
          <Select value={form.region} onChange={(e) => set({ region: e.target.value })}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Técnicos (uno por línea)" className="sm:col-span-2" hint="El jefe se incluye automáticamente.">
          <Textarea rows={3} value={form.membersText} onChange={(e) => set({ membersText: e.target.value })} placeholder={"Nombre 1\nNombre 2"} />
        </FieldGroup>
        <div className="sm:col-span-2">
          <p className="mb-1.5 text-xs font-medium text-slate-600">Especialidades</p>
          <div className="flex flex-wrap gap-1.5">
            {WORK_TYPES.map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => toggleSpec(w)}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors",
                  form.specialties.includes(w)
                    ? "bg-brand-50 text-brand-700 ring-brand-600/30"
                    : "bg-slate-50 text-slate-500 ring-slate-300 hover:bg-slate-100",
                )}
              >
                {WORK_TYPE[w].short}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center pb-1 sm:col-span-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.active} onChange={(e) => set({ active: e.target.checked })} className="size-4 accent-brand-600" />
            Cuadrilla activa
          </label>
        </div>
      </div>
    </Modal>
  );
}
