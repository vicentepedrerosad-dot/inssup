"use client";

import { useMemo, useState } from "react";
import { useStore, useClientMap } from "@/lib/store";
import { projectProgress } from "@/lib/kpi";
import { PROJECT_STATUS_ORDER, PROJECT_STATUS } from "@/lib/status";
import type { ProjectStatus } from "@/lib/types";
import { formatCLP } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Input, Select } from "@/components/ui/Field";
import { ProjectCard } from "@/components/project/ProjectCard";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import { KpiCard } from "@/components/KpiCard";
import {
  Plus,
  LayoutList,
  Columns3,
  Search,
  FolderKanban,
  Wallet,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

type View = "lista" | "kanban";

export default function ProyectosPage() {
  const { projects, sites } = useStore();
  const clientMap = useClientMap();
  const [view, setView] = useState<View>("lista");
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "">("");
  const [modalOpen, setModalOpen] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return projects.filter((p) => {
      if (clientFilter && p.clientId !== clientFilter) return false;
      if (statusFilter && p.status !== statusFilter) return false;
      if (q && !`${p.code} ${p.name} ${p.supervisor}`.toLowerCase().includes(q))
        return false;
      return true;
    });
  }, [projects, search, clientFilter, statusFilter]);

  const totals = useMemo(() => {
    const revenue = filtered.reduce((a, p) => a + p.expectedRevenue, 0);
    const cost = filtered.reduce((a, p) => a + p.estimatedCost, 0);
    const overBudget = filtered.filter((p) => p.estimatedCost > p.budget).length;
    const avgProgress = filtered.length
      ? Math.round(
          filtered.reduce((a, p) => a + projectProgress(p, sites), 0) / filtered.length,
        )
      : 0;
    return { revenue, margin: revenue - cost, overBudget, avgProgress };
  }, [filtered, sites]);

  const byStatus = (status: ProjectStatus) =>
    filtered.filter((p) => p.status === status);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión de Proyectos"
        description={`${filtered.length} proyectos en cartera`}
        actions={
          <>
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: "lista", label: "Lista", icon: <LayoutList className="size-4" /> },
                { value: "kanban", label: "Kanban", icon: <Columns3 className="size-4" /> },
              ]}
            />
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus className="size-4" />
              <span className="hidden sm:inline">Nuevo proyecto</span>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Proyectos" value={filtered.length} icon={<FolderKanban className="size-4" />} tone="brand" accent />
        <KpiCard label="Cartera total" value={formatCLP(totals.revenue, { compact: true })} icon={<Wallet className="size-4" />} tone="blue" accent />
        <KpiCard label="Margen estimado" value={formatCLP(totals.margin, { compact: true })} icon={<TrendingUp className="size-4" />} tone="emerald" accent />
        <KpiCard label="Sobre presupuesto" value={totals.overBudget} icon={<AlertTriangle className="size-4" />} tone={totals.overBudget ? "red" : "slate"} accent />
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-slate-200 bg-white p-2.5">
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar proyecto…"
            className="pl-8.5"
          />
        </div>
        <Select value={clientFilter} onChange={(e) => setClientFilter(e.target.value)} className="w-auto min-w-32">
          <option value="">Todos los clientes</option>
          {[...clientMap.values()].map((c) => (
            <option key={c.id} value={c.id}>{c.shortName}</option>
          ))}
        </Select>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as ProjectStatus | "")} className="w-auto min-w-32">
          <option value="">Todos los estados</option>
          {PROJECT_STATUS_ORDER.map((s) => (
            <option key={s} value={s}>{PROJECT_STATUS[s].label}</option>
          ))}
        </Select>
      </div>

      {view === "lista" ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} sites={sites} />
          ))}
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {PROJECT_STATUS_ORDER.map((status) => {
            const items = byStatus(status);
            const meta = PROJECT_STATUS[status];
            return (
              <div key={status} className="w-72 shrink-0">
                <div className="mb-2 flex items-center justify-between rounded-lg bg-white px-3 py-2 ring-1 ring-slate-200">
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                    <span className={`size-2 rounded-full ${meta.dot}`} />
                    {meta.label}
                  </span>
                  <span className="tabular rounded-md bg-slate-100 px-1.5 text-xs font-semibold text-slate-500">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.map((p) => (
                    <ProjectCard key={p.id} project={p} sites={sites} compact />
                  ))}
                  {!items.length && (
                    <div className="rounded-lg border border-dashed border-slate-200 py-6 text-center text-xs text-slate-400">
                      Sin proyectos
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {filtered.length === 0 && (
        <Card className="py-12 text-center text-sm text-slate-400">
          No hay proyectos que coincidan con los filtros.
        </Card>
      )}

      <ProjectFormModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </div>
  );
}
