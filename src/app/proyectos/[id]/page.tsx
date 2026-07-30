"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useStore, useClientMap } from "@/lib/store";
import { computeSiteStats, projectProgress, isOverdue } from "@/lib/kpi";
import { SITE_STATUS } from "@/lib/status";
import { formatCLP, formatDate, formatNumber, cn } from "@/lib/utils";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState, Stat } from "@/components/ui/misc";
import {
  ProjectStatusBadge,
  SiteStatusBadge,
  WorkTypeBadge,
} from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { ActivityTimeline } from "@/components/site/ActivityTimeline";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import { SiteDrawer } from "@/components/site/SiteDrawer";
import { DonutChart } from "@/components/charts/Charts";
import { PriceGate } from "@/components/Money";
import { Table, THead, TBody, TR, TD, TH } from "@/components/ui/Table";
import {
  ArrowLeft,
  FolderKanban,
  Pencil,
  Wallet,
  TrendingUp,
  Building2,
  User,
  CalendarClock,
  MapPin,
} from "lucide-react";

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { projects, sites } = useStore();
  const clientMap = useClientMap();
  const [editOpen, setEditOpen] = useState(false);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const project = projects.find((p) => p.id === params.id);
  const projSites = useMemo(
    () => sites.filter((s) => s.projectId === params.id),
    [sites, params.id],
  );
  const stats = useMemo(() => computeSiteStats(projSites), [projSites]);

  if (!project) {
    return (
      <Card>
        <EmptyState
          icon={<FolderKanban className="size-6" />}
          title="Proyecto no encontrado"
          action={
            <Link href="/proyectos">
              <Button variant="outline" size="sm">
                <ArrowLeft className="size-4" /> Volver
              </Button>
            </Link>
          }
        />
      </Card>
    );
  }

  const client = clientMap.get(project.clientId);
  const progress = projectProgress(project, sites);
  const margin = project.expectedRevenue - project.estimatedCost;
  const marginPct = project.expectedRevenue
    ? Math.round((margin / project.expectedRevenue) * 100)
    : 0;
  const overBudget = project.estimatedCost > project.budget;

  const statusDonut = [
    { name: "Terminado", value: stats.terminado, color: SITE_STATUS.terminado.hex },
    { name: "En ejecución", value: stats.ejecucion, color: SITE_STATUS.ejecucion.hex },
    { name: "Atrasado", value: stats.atrasado, color: SITE_STATUS.atrasado.hex },
    { name: "Programado", value: stats.programado, color: SITE_STATUS.programado.hex },
    { name: "Pendiente", value: stats.pendiente, color: SITE_STATUS.pendiente.hex },
  ].filter((d) => d.value > 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Link href="/proyectos">
            <Button variant="ghost" size="icon" aria-label="Volver">
              <ArrowLeft className="size-4.5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-medium text-slate-400">
                {project.code}
              </span>
              <ProjectStatusBadge status={project.status} />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              {project.name}
            </h1>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4" /> <span className="hidden sm:inline">Editar</span>
        </Button>
      </div>

      {/* Resumen financiero */}
      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <PriceGate>
        <Card className="p-3.5">
          <p className="text-xs font-medium text-slate-500">Ingresos esperados</p>
          <p className="tabular mt-1 text-xl font-bold text-slate-900">
            {formatCLP(project.expectedRevenue, { compact: true })}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">
            Facturado: {formatCLP(stats.billedRevenue, { compact: true })}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs font-medium text-slate-500">Costos estimados</p>
          <p className="tabular mt-1 text-xl font-bold text-slate-900">
            {formatCLP(project.estimatedCost, { compact: true })}
          </p>
          <p className={cn("mt-0.5 text-xs", overBudget ? "text-red-500" : "text-slate-400")}>
            Presupuesto: {formatCLP(project.budget, { compact: true })}
          </p>
        </Card>
        <Card className="p-3.5">
          <p className="text-xs font-medium text-slate-500">Margen estimado</p>
          <p className={cn("tabular mt-1 text-xl font-bold", overBudget ? "text-red-600" : "text-emerald-600")}>
            {formatCLP(margin, { compact: true })}
          </p>
          <p className="mt-0.5 text-xs text-slate-400">{marginPct}% sobre ingreso</p>
        </Card>
        </PriceGate>
        <Card className="p-3.5">
          <p className="text-xs font-medium text-slate-500">Avance total</p>
          <p className="tabular mt-1 text-xl font-bold text-slate-900">{progress}%</p>
          <Progress value={progress} size="sm" className="mt-2" />
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Info general */}
        <Card>
          <CardHeader title="Información del proyecto" icon={<FolderKanban className="size-4" />} />
          <CardBody className="space-y-1">
            <InfoRow icon={<Building2 className="size-3.5" />} label="Cliente" value={client?.name} />
            <InfoRow icon={<User className="size-3.5" />} label="Supervisor" value={project.supervisor} />
            <InfoRow icon={<MapPin className="size-3.5" />} label="Región" value={project.region} />
            <InfoRow icon={<CalendarClock className="size-3.5" />} label="Inicio" value={formatDate(project.startDate)} />
            <InfoRow icon={<CalendarClock className="size-3.5" />} label="Compromiso" value={formatDate(project.commitmentDate)} />
            <div className="grid grid-cols-2 gap-2 pt-2">
              <Stat label="Sitios" value={formatNumber(stats.total)} />
              <Stat label="Horas" value={formatNumber(stats.totalHours)} />
            </div>
            {project.description && (
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
                {project.description}
              </p>
            )}
          </CardBody>
        </Card>

        {/* Distribución */}
        <Card>
          <CardHeader title="Sitios por estado" icon={<Wallet className="size-4" />} />
          <CardBody>
            {statusDonut.length ? (
              <DonutChart data={statusDonut} centerValue={stats.total} centerLabel="sitios" height={200} />
            ) : (
              <p className="py-8 text-center text-sm text-slate-400">Sin sitios.</p>
            )}
          </CardBody>
        </Card>

        {/* Actividad */}
        <Card>
          <CardHeader title="Historial de actividad" icon={<TrendingUp className="size-4" />} />
          <CardBody>
            <ActivityTimeline items={project.activity} />
          </CardBody>
        </Card>
      </div>

      {/* Sitios asociados */}
      <Card className="overflow-hidden">
        <CardHeader title="Sitios asociados" subtitle={`${projSites.length} sitios`} />
        {projSites.length ? (
          <Table>
            <THead>
              <tr>
                <TH>Código</TH>
                <TH>Sitio</TH>
                <TH className="hidden sm:table-cell">Tipo</TH>
                <TH>Estado</TH>
                <TH className="w-32">Avance</TH>
                <TH align="right" className="hidden sm:table-cell">SLA</TH>
              </tr>
            </THead>
            <TBody>
              {projSites.map((s) => (
                <TR key={s.id} onClick={() => setSelectedSite(s.id)}>
                  <TD className="font-mono text-xs text-slate-500">{s.id}</TD>
                  <TD className="max-w-[200px]">
                    <span className="block truncate font-medium text-slate-800">{s.name}</span>
                  </TD>
                  <TD className="hidden sm:table-cell"><WorkTypeBadge type={s.workType} /></TD>
                  <TD><SiteStatusBadge status={s.status} /></TD>
                  <TD><Progress value={s.progress} showLabel size="sm" /></TD>
                  <TD align="right" className="hidden sm:table-cell">
                    <span className={cn("text-xs", isOverdue(s) ? "font-semibold text-red-600" : "text-slate-500")}>
                      {formatDate(s.slaDate)}
                    </span>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState title="Sin sitios asociados" description="Este proyecto aún no tiene sitios." />
        )}
      </Card>

      <ProjectFormModal open={editOpen} onClose={() => setEditOpen(false)} project={project} />
      <SiteDrawer siteId={selectedSite} onClose={() => setSelectedSite(null)} />
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 py-2 last:border-0">
      <span className="flex items-center gap-1.5 text-xs text-slate-500">{icon}{label}</span>
      <span className="text-right text-sm font-medium text-slate-800">{value ?? "—"}</span>
    </div>
  );
}
