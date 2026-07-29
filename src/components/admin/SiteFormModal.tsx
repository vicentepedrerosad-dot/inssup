"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FieldGroup } from "@/components/ui/Field";
import { REGIONS } from "@/lib/data";
import { SUPERVISORS } from "@/lib/data/entities";
import {
  WORK_TYPE,
  SITE_STATUS_ORDER,
  SITE_STATUS,
} from "@/lib/status";
import type { Site, SiteStatus, Priority, WorkType } from "@/lib/types";
import { TODAY } from "@/lib/utils";
import { toast } from "sonner";

const WORK_TYPES = Object.keys(WORK_TYPE) as WorkType[];
const PRIORITIES: Priority[] = ["baja", "media", "alta", "critica"];

export function SiteFormModal({
  open,
  onClose,
  site,
}: {
  open: boolean;
  onClose: () => void;
  site?: Site;
}) {
  const { clients, projects, crews, createSite, updateSite } = useStore();
  const editing = !!site;

  const [form, setForm] = useState({
    id: site?.id ?? "",
    name: site?.name ?? "",
    clientId: site?.clientId ?? clients[0]?.id ?? "",
    projectId: site?.projectId ?? projects[0]?.id ?? "",
    region: site?.region ?? REGIONS[0],
    comuna: site?.comuna ?? "",
    workType: site?.workType ?? ("instalacion" as WorkType),
    status: site?.status ?? ("programado" as SiteStatus),
    priority: site?.priority ?? ("media" as Priority),
    progress: site?.progress ?? 0,
    crewId: site?.crewId ?? "",
    supervisor: site?.supervisor ?? SUPERVISORS[0],
    hoursWorked: site?.hoursWorked ?? 0,
    budget: site?.budget ?? 0,
    cost: site?.cost ?? 0,
    billed: site?.billed ?? false,
    scheduledDate: site?.scheduledDate ?? TODAY,
    slaDate: site?.slaDate ?? TODAY,
    observations: site?.observations ?? "",
    blocker: site?.blocker ?? "",
    lat: site?.lat ?? -33.45,
    lng: site?.lng ?? -70.66,
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("El nombre del sitio es obligatorio.");
      return;
    }
    const base = {
      name: form.name,
      clientId: form.clientId,
      projectId: form.projectId,
      region: form.region,
      comuna: form.comuna,
      workType: form.workType,
      status: form.status,
      priority: form.priority,
      progress: Number(form.progress),
      crewId: form.crewId || null,
      supervisor: form.supervisor,
      hoursWorked: Number(form.hoursWorked),
      budget: Number(form.budget),
      cost: Number(form.cost),
      billed: form.billed,
      scheduledDate: form.scheduledDate,
      slaDate: form.slaDate,
      observations: form.observations,
      blocker: form.blocker.trim() || null,
      lat: Number(form.lat),
      lng: Number(form.lng),
    };

    if (editing && site) {
      updateSite(site.id, base);
      toast.success("Sitio actualizado", { description: site.id });
    } else {
      const prefix = (form.comuna.slice(0, 3) || "NEW").toUpperCase();
      const id = form.id.trim() || `${prefix}-${Math.floor(1000 + Math.random() * 8999)}`;
      const newSite: Site = {
        id,
        ...base,
        actualStart: form.status === "ejecucion" || form.status === "terminado" ? TODAY : null,
        actualEnd: form.status === "terminado" ? TODAY : null,
        checklist: [],
        evidence: [],
        lastUpdate: new Date(TODAY).toISOString(),
        activity: [],
      };
      createSite(newSite);
      toast.success("Sitio creado", { description: id });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar sitio" : "Nuevo sitio"}
      subtitle={editing ? `${site?.id} · ${site?.name}` : "Registra un sitio en la red"}
      size="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={submit}>{editing ? "Guardar cambios" : "Crear sitio"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Nombre del sitio" className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Cliente">
          <Select value={form.clientId} onChange={(e) => set({ clientId: e.target.value })}>
            {clients.map((c) => <option key={c.id} value={c.id}>{c.shortName}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Proyecto">
          <Select value={form.projectId} onChange={(e) => set({ projectId: e.target.value })}>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.code}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Región">
          <Select value={form.region} onChange={(e) => set({ region: e.target.value })}>
            {REGIONS.map((r) => <option key={r} value={r}>{r}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Comuna">
          <Input value={form.comuna} onChange={(e) => set({ comuna: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Tipo de trabajo">
          <Select value={form.workType} onChange={(e) => set({ workType: e.target.value as WorkType })}>
            {WORK_TYPES.map((w) => <option key={w} value={w}>{WORK_TYPE[w].label}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Estado">
          <Select value={form.status} onChange={(e) => set({ status: e.target.value as SiteStatus })}>
            {SITE_STATUS_ORDER.map((s) => <option key={s} value={s}>{SITE_STATUS[s].label}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Prioridad">
          <Select value={form.priority} onChange={(e) => set({ priority: e.target.value as Priority })}>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Avance (%)">
          <Input type="number" min={0} max={100} value={form.progress} onChange={(e) => set({ progress: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Cuadrilla">
          <Select value={form.crewId} onChange={(e) => set({ crewId: e.target.value })}>
            <option value="">Sin asignar</option>
            {crews.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Supervisor">
          <Select value={form.supervisor} onChange={(e) => set({ supervisor: e.target.value })}>
            {SUPERVISORS.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Ingreso / Precio (CLP)">
          <Input type="number" value={form.budget} onChange={(e) => set({ budget: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Costo estimado (CLP)">
          <Input type="number" value={form.cost} onChange={(e) => set({ cost: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Horas trabajadas">
          <Input type="number" value={form.hoursWorked} onChange={(e) => set({ hoursWorked: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Fecha programada">
          <Input type="date" value={form.scheduledDate} onChange={(e) => set({ scheduledDate: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Fecha compromiso (SLA)">
          <Input type="date" value={form.slaDate} onChange={(e) => set({ slaDate: e.target.value })} />
        </FieldGroup>
        <div className="flex items-end pb-1">
          <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" checked={form.billed} onChange={(e) => set({ billed: e.target.checked })} className="size-4 accent-brand-600" />
            Facturado
          </label>
        </div>
        <FieldGroup label="Observaciones" className="sm:col-span-2">
          <Textarea rows={2} value={form.observations} onChange={(e) => set({ observations: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Bloqueo (opcional)" className="sm:col-span-2">
          <Input value={form.blocker} onChange={(e) => set({ blocker: e.target.value })} placeholder="Impedimento actual…" />
        </FieldGroup>
      </div>
    </Modal>
  );
}
