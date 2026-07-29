"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, FieldGroup } from "@/components/ui/Field";
import { REGIONS } from "@/lib/data";
import { SUPERVISORS } from "@/lib/data/entities";
import { PROJECT_STATUS_ORDER, PROJECT_STATUS } from "@/lib/status";
import type { Project, ProjectStatus } from "@/lib/types";
import { TODAY } from "@/lib/utils";
import { toast } from "sonner";

export function ProjectFormModal({
  open,
  onClose,
  project,
}: {
  open: boolean;
  onClose: () => void;
  project?: Project;
}) {
  const { clients, createProject, updateProject, currentUser } = useStore();
  const editing = !!project;

  const [form, setForm] = useState({
    name: project?.name ?? "",
    clientId: project?.clientId ?? clients[0].id,
    code: project?.code ?? "",
    status: project?.status ?? ("planificacion" as ProjectStatus),
    region: project?.region ?? REGIONS[0],
    supervisor: project?.supervisor ?? SUPERVISORS[0],
    startDate: project?.startDate ?? TODAY,
    commitmentDate: project?.commitmentDate ?? "",
    expectedRevenue: project?.expectedRevenue ?? 0,
    estimatedCost: project?.estimatedCost ?? 0,
    budget: project?.budget ?? 0,
    description: project?.description ?? "",
  });

  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.name.trim()) {
      toast.error("El nombre del proyecto es obligatorio.");
      return;
    }
    if (editing && project) {
      updateProject(project.id, {
        name: form.name,
        clientId: form.clientId,
        status: form.status,
        region: form.region,
        supervisor: form.supervisor,
        startDate: form.startDate,
        commitmentDate: form.commitmentDate,
        expectedRevenue: Number(form.expectedRevenue),
        estimatedCost: Number(form.estimatedCost),
        budget: Number(form.budget),
        description: form.description,
      });
      toast.success("Proyecto actualizado");
    } else {
      const code =
        form.code.trim() ||
        `NEW-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
      const newProject: Project = {
        id: code,
        code,
        name: form.name,
        clientId: form.clientId,
        status: form.status,
        startDate: form.startDate,
        commitmentDate: form.commitmentDate || form.startDate,
        budget: Number(form.budget) || Number(form.expectedRevenue) * 1.05,
        expectedRevenue: Number(form.expectedRevenue),
        estimatedCost: Number(form.estimatedCost),
        supervisor: form.supervisor,
        region: form.region,
        description: form.description,
        activity: [
          {
            id: "pa-new",
            at: new Date(TODAY).toISOString(),
            author: currentUser.name,
            role: currentUser.role,
            message: "Proyecto creado desde la plataforma.",
            kind: "creacion",
          },
        ],
      };
      createProject(newProject);
      toast.success("Proyecto creado", { description: `${code} · ${form.name}` });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar proyecto" : "Nuevo proyecto"}
      subtitle={editing ? project?.code : "Registra un nuevo proyecto en la cartera"}
      size="max-w-2xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button size="sm" onClick={submit}>
            {editing ? "Guardar cambios" : "Crear proyecto"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Nombre del proyecto" className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Ej: Densificación 5G RM Fase 3" />
        </FieldGroup>
        <FieldGroup label="Cliente">
          <Select value={form.clientId} onChange={(e) => set({ clientId: e.target.value })}>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Código interno" hint={editing ? undefined : "Se genera automáticamente si se deja vacío"}>
          <Input value={form.code} onChange={(e) => set({ code: e.target.value.toUpperCase() })} placeholder="ENT-5G-RM3" disabled={editing} />
        </FieldGroup>
        <FieldGroup label="Estado">
          <Select value={form.status} onChange={(e) => set({ status: e.target.value as ProjectStatus })}>
            {PROJECT_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Región">
          <Select value={form.region} onChange={(e) => set({ region: e.target.value })}>
            {REGIONS.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Supervisor responsable">
          <Select value={form.supervisor} onChange={(e) => set({ supervisor: e.target.value })}>
            {SUPERVISORS.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Fecha de inicio">
          <Input type="date" value={form.startDate} onChange={(e) => set({ startDate: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Fecha compromiso">
          <Input type="date" value={form.commitmentDate} onChange={(e) => set({ commitmentDate: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Ingresos esperados (CLP)">
          <Input type="number" value={form.expectedRevenue} onChange={(e) => set({ expectedRevenue: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Costos estimados (CLP)">
          <Input type="number" value={form.estimatedCost} onChange={(e) => set({ estimatedCost: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Presupuesto (CLP)">
          <Input type="number" value={form.budget} onChange={(e) => set({ budget: Number(e.target.value) })} />
        </FieldGroup>
        <FieldGroup label="Descripción" className="sm:col-span-2">
          <Textarea rows={3} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Alcance y objetivo del proyecto…" />
        </FieldGroup>
      </div>
    </Modal>
  );
}
