"use client";

import { useMemo, useState } from "react";
import { useStore, useClientMap, useCrewMap, useProjectMap } from "@/lib/store";
import { WORK_TYPE } from "@/lib/status";
import { overdueDays, isOverdue, daysSinceUpdate } from "@/lib/kpi";
import {
  formatCLP,
  formatDate,
  formatNumber,
  relativeDays,
  cn,
} from "@/lib/utils";
import type { Site, SiteStatus } from "@/lib/types";
import {
  SiteStatusBadge,
  PriorityBadge,
  WorkTypeBadge,
} from "@/components/ui/Badge";
import { Progress, ProgressRing } from "@/components/ui/Progress";
import { Segmented } from "@/components/ui/Segmented";
import { DefRow, Stat } from "@/components/ui/misc";
import { EvidenceThumb } from "./EvidenceThumb";
import { ActivityTimeline } from "./ActivityTimeline";
import { PriceGate } from "@/components/Money";
import {
  Building2,
  FolderKanban,
  MapPin,
  User,
  Users,
  CalendarClock,
  Wallet,
  AlertTriangle,
  CheckCircle2,
  Circle,
  Camera,
  ListChecks,
  FileText,
  Activity as ActivityIcon,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "resumen" | "checklist" | "evidencias" | "actividad";

export function SiteDetailBody({ siteId }: { siteId: string }) {
  const { sites, currentUser, updateSite } = useStore();
  const clientMap = useClientMap();
  const crewMap = useCrewMap();
  const projectMap = useProjectMap();
  const [tab, setTab] = useState<Tab>("resumen");

  const site = useMemo(() => sites.find((s) => s.id === siteId), [sites, siteId]);
  if (!site) return null;

  const client = clientMap.get(site.clientId);
  const crew = site.crewId ? crewMap.get(site.crewId) : null;
  const project = projectMap.get(site.projectId);
  const overdue = isOverdue(site);
  const margin = site.budget - site.cost;
  const staleDays = daysSinceUpdate(site);

  const changeStatus = (status: SiteStatus) => {
    if (status === site.status) return;
    const patch: Partial<Site> = { status };
    if (status === "terminado") patch.progress = 100;
    updateSite(site.id, patch, {
      author: currentUser.name,
      role: currentUser.role,
      message: `Estado cambiado a "${status}".`,
      kind: "estado",
    });
    toast.success("Estado actualizado", { description: `${site.id} → ${status}` });
  };

  const toggleCheck = (id: string) => {
    const checklist = site.checklist.map((c) =>
      c.id === id ? { ...c, done: !c.done } : c,
    );
    const done = checklist.filter((c) => c.done).length;
    const progress = Math.round((done / checklist.length) * 100);
    updateSite(
      site.id,
      { checklist, progress },
      {
        author: currentUser.name,
        role: currentUser.role,
        message: `Checklist actualizado (${done}/${checklist.length}). Avance ${progress}%.`,
        kind: "avance",
      },
    );
  };

  const doneChecks = site.checklist.filter((c) => c.done).length;

  return (
    <div className="flex h-full flex-col">
      {/* Encabezado con métricas clave */}
      <div className="border-b border-slate-100 px-4 py-4 sm:px-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <SiteStatusBadge status={site.status} />
            <PriorityBadge priority={site.priority} />
            <WorkTypeBadge type={site.workType} />
          </div>
          <ProgressRing value={site.progress} size={54} />
        </div>

        {overdue && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
            <AlertTriangle className="size-4 shrink-0" />
            <span>
              Compromiso vencido hace <b>{overdueDays(site)} días</b> (SLA{" "}
              {formatDate(site.slaDate)}).
            </span>
          </div>
        )}
        {site.blocker && (
          <div className="mt-2 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/15">
            <AlertTriangle className="size-4 shrink-0 mt-0.5" />
            <span>
              <b>Bloqueo:</b> {site.blocker}
            </span>
          </div>
        )}

        <div className="mt-3 grid grid-cols-3 gap-2">
          <Stat label="Horas" value={formatNumber(site.hoursWorked)} />
          <Stat
            label="SLA"
            value={
              <span className={cn(overdue && "text-red-600")}>
                {relativeDays(site.slaDate)}
              </span>
            }
          />
          <Stat
            label="Actualizado"
            value={staleDays === 0 ? "hoy" : `${staleDays}d`}
          />
        </div>

        {/* Cambio rápido de estado */}
        <div className="mt-3">
          <p className="mb-1.5 text-[11px] font-medium text-slate-500">
            Cambiar estado
          </p>
          <Segmented<SiteStatus>
            size="sm"
            value={site.status}
            onChange={changeStatus}
            className="flex-wrap"
            options={[
              { value: "programado", label: "Programado" },
              { value: "ejecucion", label: "Ejecución" },
              { value: "atrasado", label: "Atrasado" },
              { value: "terminado", label: "Terminado" },
            ]}
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 px-3 sm:px-4">
        {(
          [
            { id: "resumen", label: "Resumen", icon: FileText },
            { id: "checklist", label: `Checklist (${doneChecks}/${site.checklist.length})`, icon: ListChecks },
            { id: "evidencias", label: `Evidencias (${site.evidence.length})`, icon: Camera },
            { id: "actividad", label: "Actividad", icon: ActivityIcon },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              "flex items-center gap-1.5 border-b-2 px-2.5 py-2.5 text-xs font-medium transition-colors sm:text-sm",
              tab === t.id
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700",
            )}
          >
            <t.icon className="size-4" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Contenido tab */}
      <div className="flex-1 px-4 py-4 sm:px-5">
        {tab === "resumen" && (
          <div className="space-y-4">
            <div className="divide-y divide-slate-100">
              <DefRow label="Cliente" icon={<Building2 className="size-3.5" />}>
                {client?.name ?? "—"}
              </DefRow>
              <DefRow label="Proyecto" icon={<FolderKanban className="size-3.5" />}>
                {project ? `${project.code} · ${project.name}` : "—"}
              </DefRow>
              <DefRow label="Ubicación" icon={<MapPin className="size-3.5" />}>
                {site.comuna}, {site.region}
              </DefRow>
              <DefRow label="Coordenadas">
                <span className="tabular text-xs text-slate-500">
                  {site.lat.toFixed(4)}, {site.lng.toFixed(4)}
                </span>
              </DefRow>
              <DefRow label="Tipo de trabajo">
                {WORK_TYPE[site.workType].label}
              </DefRow>
              <DefRow label="Supervisor" icon={<User className="size-3.5" />}>
                {site.supervisor}
              </DefRow>
              <DefRow label="Cuadrilla" icon={<Users className="size-3.5" />}>
                {crew ? crew.name : <span className="text-slate-400">Sin asignar</span>}
              </DefRow>
              <DefRow label="Programada" icon={<CalendarClock className="size-3.5" />}>
                {formatDate(site.scheduledDate)}
              </DefRow>
              <DefRow label="Inicio real">
                {formatDate(site.actualStart)}
              </DefRow>
              <DefRow label="Término real">
                {formatDate(site.actualEnd)}
              </DefRow>
            </div>

            <div>
              <p className="mb-1.5 text-xs font-semibold text-slate-500">Avance</p>
              <Progress value={site.progress} showLabel />
            </div>

            {/* Financiero (solo con acceso a precios) */}
            <PriceGate>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                  <Wallet className="size-3.5" /> Ficha financiera del sitio
                </div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Stat label="Ingreso" value={formatCLP(site.budget, { compact: true })} className="bg-white" />
                  <Stat label="Costo est." value={formatCLP(site.cost, { compact: true })} className="bg-white" />
                  <Stat label="Margen" value={formatCLP(margin, { compact: true })} className="bg-white" />
                  <Stat
                    label="Facturación"
                    value={site.billed ? "Facturado" : "Pendiente"}
                    className="bg-white"
                  />
                </div>
              </div>
            </PriceGate>

            {site.observations && (
              <div>
                <p className="mb-1 text-xs font-semibold text-slate-500">
                  Observaciones
                </p>
                <p className="rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                  {site.observations}
                </p>
              </div>
            )}
          </div>
        )}

        {tab === "checklist" && (
          <div className="space-y-1.5">
            {site.checklist.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleCheck(c.id)}
                className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-left transition-colors hover:bg-slate-50"
              >
                {c.done ? (
                  <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
                ) : (
                  <Circle className="size-5 shrink-0 text-slate-300" />
                )}
                <span
                  className={cn(
                    "text-sm",
                    c.done ? "text-slate-400 line-through" : "text-slate-700",
                  )}
                >
                  {c.label}
                </span>
              </button>
            ))}
          </div>
        )}

        {tab === "evidencias" && (
          <div>
            {site.evidence.length ? (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {site.evidence.map((ev) => (
                  <EvidenceThumb key={ev.id} ev={ev} />
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">
                Sin evidencias cargadas.
              </p>
            )}
            <p className="mt-3 text-center text-xs text-slate-400">
              Las evidencias son simuladas · carga real de fotos en el roadmap.
            </p>
          </div>
        )}

        {tab === "actividad" && <ActivityTimeline items={site.activity} />}
      </div>
    </div>
  );
}
