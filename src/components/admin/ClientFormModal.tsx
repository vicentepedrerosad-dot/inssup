"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input, Select, FieldGroup } from "@/components/ui/Field";
import type { Client } from "@/lib/types";
import { toast } from "sonner";

const SEGMENTS: { value: Client["segment"]; label: string }[] = [
  { value: "operador_movil", label: "Operador móvil" },
  { value: "torrero", label: "Torrero / Infraestructura" },
  { value: "corporativo", label: "Corporativo" },
];

const COLORS = ["#1D4ED8", "#0EA5E9", "#C026D3", "#E11D48", "#EA580C", "#0D9488", "#CA8A04", "#7C3AED"];

export function ClientFormModal({
  open,
  onClose,
  client,
}: {
  open: boolean;
  onClose: () => void;
  client?: Client;
}) {
  const { createClient, updateClient } = useStore();
  const editing = !!client;

  const [form, setForm] = useState({
    name: client?.name ?? "",
    shortName: client?.shortName ?? "",
    segment: client?.segment ?? ("operador_movil" as Client["segment"]),
    color: client?.color ?? COLORS[0],
    contactName: client?.contactName ?? "",
    contactRole: client?.contactRole ?? "",
    contactEmail: client?.contactEmail ?? "",
    contactPhone: client?.contactPhone ?? "",
  });
  const set = (patch: Partial<typeof form>) => setForm((f) => ({ ...f, ...patch }));

  const submit = () => {
    if (!form.name.trim() || !form.shortName.trim()) {
      toast.error("Razón social y nombre corto son obligatorios.");
      return;
    }
    if (editing && client) {
      updateClient(client.id, { ...form });
      toast.success("Cliente actualizado", { description: form.shortName });
    } else {
      const id = `cl-${form.shortName.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12)}-${Math.random().toString(36).slice(2, 5)}`;
      createClient({ id, ...form });
      toast.success("Cliente creado", { description: form.shortName });
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editing ? "Editar empresa" : "Nueva empresa"}
      subtitle={editing ? client?.name : "Registra un cliente en la cartera"}
      size="max-w-xl"
      footer={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
          <Button size="sm" onClick={submit}>{editing ? "Guardar cambios" : "Crear empresa"}</Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <FieldGroup label="Razón social" className="sm:col-span-2">
          <Input value={form.name} onChange={(e) => set({ name: e.target.value })} placeholder="Empresa S.A." />
        </FieldGroup>
        <FieldGroup label="Nombre corto">
          <Input value={form.shortName} onChange={(e) => set({ shortName: e.target.value })} placeholder="Empresa" />
        </FieldGroup>
        <FieldGroup label="Segmento">
          <Select value={form.segment} onChange={(e) => set({ segment: e.target.value as Client["segment"] })}>
            {SEGMENTS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </Select>
        </FieldGroup>
        <FieldGroup label="Color de marca" className="sm:col-span-2">
          <div className="flex flex-wrap gap-1.5">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => set({ color: c })}
                className="size-7 rounded-md ring-2 ring-offset-1 transition-all"
                style={{ background: c, boxShadow: form.color === c ? `0 0 0 2px ${c}` : "none" }}
                aria-label={c}
              >
                {form.color === c && <span className="text-white">✓</span>}
              </button>
            ))}
          </div>
        </FieldGroup>
        <FieldGroup label="Contacto principal">
          <Input value={form.contactName} onChange={(e) => set({ contactName: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Cargo">
          <Input value={form.contactRole} onChange={(e) => set({ contactRole: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Email">
          <Input type="email" value={form.contactEmail} onChange={(e) => set({ contactEmail: e.target.value })} />
        </FieldGroup>
        <FieldGroup label="Teléfono">
          <Input value={form.contactPhone} onChange={(e) => set({ contactPhone: e.target.value })} />
        </FieldGroup>
      </div>
    </Modal>
  );
}
