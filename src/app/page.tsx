"use client";

import { useMemo, useState } from "react";
import { useStore, useClientMap } from "@/lib/store";
import { applySiteFilter, EMPTY_FILTER, type SiteFilter } from "@/lib/filters";
import {
  computeSiteStats,
  computeAlerts,
  computeClientRollups,
  computeCrewPerformance,
  hoursPerWeek,
  overdueByRegion,
  avgDurationByType,
} from "@/lib/kpi";
import { SITE_STATUS, WORK_TYPE } from "@/lib/status";
import { formatCLP, formatNumber, formatPct } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertsPanel } from "@/components/dashboard/AlertsPanel";
import { SitesMap } from "@/components/map/SitesMap";
import { SiteDrawer } from "@/components/site/SiteDrawer";
import {
  HBarChart,
  VBarChart,
  AreaTrend,
  DonutChart,
} from "@/components/charts/Charts";
import { exportCSV, toCSV } from "@/lib/export";
import {
  RadioTower,
  CheckCircle2,
  Loader,
  AlertTriangle,
  Gauge,
  Wallet,
  ReceiptText,
  Clock,
  Zap,
  Map as MapIcon,
  BellRing,
  Download,
} from "lucide-react";
import { toast } from "sonner";

export default function DashboardPage() {
  const { sites, projects, crews } = useStore();
  const clientMap = useClientMap();
  const [filter, setFilter] = useState<SiteFilter>(EMPTY_FILTER);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const filtered = useMemo(() => applySiteFilter(sites, filter), [sites, filter]);
  const stats = useMemo(() => computeSiteStats(filtered), [filtered]);
  const alerts = useMemo(
    () => computeAlerts(filtered, projects, crews),
    [filtered, projects, crews],
  );
  const crewPerf = useMemo(
    () => computeCrewPerformance(filtered, crews),
    [filtered, crews],
  );
  const clientRollups = useMemo(
    () => computeClientRollups(filtered, projects, [...clientMap.values()]),
    [filtered, projects, clientMap],
  );
  const avgProductivity = useMemo(() => {
    const active = crewPerf.filter((c) => c.assigned > 0);
    return active.length
      ? Math.round(active.reduce((a, c) => a + c.productivity, 0) / active.length)
      : 0;
  }, [crewPerf]);

  // Series de gráficos
  const clientProgress = clientRollups
    .filter((c) => c.sites > 0)
    .map((c) => ({ name: c.client.shortName, value: c.avgProgress, color: c.client.color }));

  const crewProductivity = crewPerf
    .filter((c) => c.assigned > 0)
    .map((c) => ({ name: c.crew.name.replace("Cuadrilla ", ""), value: c.productivity }));

  const weekHours = hoursPerWeek(filtered, 8);

  const revenueByProject = useMemo(() => {
    return projects
      .map((p) => ({
        name: p.code.split("-").slice(-1)[0] || p.code,
        value: filtered
          .filter((s) => s.projectId === p.id)
          .reduce((a, s) => a + s.budget, 0),
        color: clientMap.get(p.clientId)?.color ?? "#0e7490",
      }))
      .filter((d) => d.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [projects, filtered, clientMap]);

  const regionDelays = overdueByRegion(filtered).map((r) => ({
    name: r.region,
    value: r.atrasados,
  }));

  const durationByType = avgDurationByType(filtered).map((d) => ({
    name: WORK_TYPE[d.tipo as keyof typeof WORK_TYPE]?.short ?? d.tipo,
    value: d.dias,
  }));

  const statusDonut = [
    { name: "Terminado", value: stats.terminado, color: SITE_STATUS.terminado.hex },
    { name: "En ejecución", value: stats.ejecucion, color: SITE_STATUS.ejecucion.hex },
    { name: "Atrasado", value: stats.atrasado, color: SITE_STATUS.atrasado.hex },
    { name: "Programado", value: stats.programado, color: SITE_STATUS.programado.hex },
    { name: "Pendiente", value: stats.pendiente, color: SITE_STATUS.pendiente.hex },
  ].filter((d) => d.value > 0);

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      id: s.id,
      sitio: s.name,
      cliente: clientMap.get(s.clientId)?.shortName ?? "",
      region: s.region,
      estado: SITE_STATUS[s.status].label,
      avance: s.progress,
      horas: s.hoursWorked,
      ingreso: s.budget,
    }));
    exportCSV("inssup-dashboard-sitios.csv", toCSV(rows));
    toast.success("Exportación generada", {
      description: `${rows.length} sitios exportados a CSV.`,
    });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Dashboard Ejecutivo"
        description="Estado consolidado de la operación de sitios en tiempo real."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" />
            Exportar
          </Button>
        }
      />

      <FilterBar value={filter} onChange={setFilter} />

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-5">
        <KpiCard
          label="Total de sitios"
          value={formatNumber(stats.total)}
          icon={<RadioTower className="size-4" />}
          tone="brand"
          accent
          hint={`${stats.pendiente} pendientes · ${stats.programado} programados`}
        />
        <KpiCard
          label="Terminados"
          value={formatNumber(stats.terminado)}
          icon={<CheckCircle2 className="size-4" />}
          tone="emerald"
          accent
          hint={stats.total ? `${formatPct(Math.round((stats.terminado / stats.total) * 100))} del total` : "—"}
        />
        <KpiCard
          label="En ejecución"
          value={formatNumber(stats.ejecucion)}
          icon={<Loader className="size-4" />}
          tone="amber"
          accent
          hint="Cuadrillas en terreno"
        />
        <KpiCard
          label="Atrasados"
          value={formatNumber(stats.atrasado)}
          icon={<AlertTriangle className="size-4" />}
          tone="red"
          accent
          hint="Sobre compromiso SLA"
        />
        <KpiCard
          label="Avance general"
          value={formatPct(stats.avgProgress)}
          icon={<Gauge className="size-4" />}
          tone="brand"
          accent
          hint="Promedio de sitios"
        />
        <KpiCard
          label="Ingresos proyectados"
          value={formatCLP(stats.expectedRevenue, { compact: true })}
          icon={<Wallet className="size-4" />}
          tone="blue"
          hint="Cartera total filtrada"
        />
        <KpiCard
          label="Ingresos facturados"
          value={formatCLP(stats.billedRevenue, { compact: true })}
          icon={<ReceiptText className="size-4" />}
          tone="emerald"
          hint={stats.expectedRevenue ? `${formatPct(Math.round((stats.billedRevenue / stats.expectedRevenue) * 100))} recaudado` : "—"}
        />
        <KpiCard
          label="Margen estimado"
          value={formatCLP(stats.estimatedMargin, { compact: true })}
          icon={<Wallet className="size-4" />}
          tone="brand"
          hint={stats.expectedRevenue ? `${formatPct(Math.round((stats.estimatedMargin / stats.expectedRevenue) * 100))} sobre ingreso` : "—"}
        />
        <KpiCard
          label="Horas trabajadas"
          value={formatNumber(stats.totalHours)}
          icon={<Clock className="size-4" />}
          tone="slate"
          hint="Acumulado del período"
        />
        <KpiCard
          label="Productividad prom."
          value={formatPct(avgProductivity)}
          icon={<Zap className="size-4" />}
          tone="amber"
          hint="Índice de cuadrillas"
        />
      </div>

      {/* Mapa + Alertas */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <CardHeader
            title="Mapa operacional de sitios"
            subtitle={`${filtered.length} sitios georreferenciados en Chile`}
            icon={<MapIcon className="size-4" />}
            action={<StatusLegend />}
          />
          <SitesMap
            sites={filtered}
            onSelect={(s) => setSelectedSite(s.id)}
            height={480}
          />
        </Card>

        <Card className="flex flex-col">
          <CardHeader
            title="Alertas operacionales"
            subtitle={`${alerts.length} requieren atención`}
            icon={<BellRing className="size-4" />}
          />
          <div className="max-h-[480px] flex-1 overflow-y-auto">
            <AlertsPanel alerts={alerts} />
          </div>
        </Card>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card>
          <CardHeader title="Avance por cliente" subtitle="% promedio de sitios" />
          <CardBody>
            <HBarChart
              data={clientProgress}
              colorKey
              domainMax={100}
              valueFormatter={(v) => `${v}%`}
              height={Math.max(180, clientProgress.length * 34)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Productividad por cuadrilla" subtitle="Índice compuesto 0-100" />
          <CardBody>
            <HBarChart
              data={crewProductivity}
              color="#0e7490"
              domainMax={100}
              valueFormatter={(v) => `${v}`}
              height={Math.max(180, crewProductivity.length * 30)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Distribución por estado" subtitle="Sitios filtrados" />
          <CardBody>
            <DonutChart
              data={statusDonut}
              centerValue={stats.total}
              centerLabel="sitios"
              height={200}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Horas trabajadas por semana" subtitle="Últimas 8 semanas" />
          <CardBody>
            <AreaTrend
              data={weekHours}
              xKey="week"
              dataKey="horas"
              valueFormatter={(v) => `${v}h`}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Ingresos por proyecto" subtitle="Cartera filtrada (top 8)" />
          <CardBody>
            <VBarChart
              data={revenueByProject}
              colorKey
              valueFormatter={(v) => formatCLP(v, { compact: true })}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Retrasos por región" subtitle="Sitios sobre SLA" />
          <CardBody>
            {regionDelays.length ? (
              <HBarChart
                data={regionDelays}
                color="#dc2626"
                valueFormatter={(v) => `${v}`}
                height={Math.max(160, regionDelays.length * 32)}
              />
            ) : (
              <p className="py-10 text-center text-sm text-slate-400">
                Sin retrasos en la selección actual.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {durationByType.length > 0 && (
        <Card>
          <CardHeader
            title="Tiempo promedio por tipo de trabajo"
            subtitle="Días de ejecución en sitios terminados"
          />
          <CardBody>
            <VBarChart
              data={durationByType}
              color="#0891b2"
              valueFormatter={(v) => `${v}d`}
              height={200}
            />
          </CardBody>
        </Card>
      )}

      <SiteDrawer siteId={selectedSite} onClose={() => setSelectedSite(null)} />
    </div>
  );
}

function StatusLegend() {
  const items = [
    { s: "terminado", label: "Terminado" },
    { s: "ejecucion", label: "Ejecución" },
    { s: "atrasado", label: "Atrasado" },
    { s: "programado", label: "Programado" },
    { s: "pendiente", label: "Pendiente" },
  ] as const;
  return (
    <div className="hidden flex-wrap items-center gap-x-3 gap-y-1 md:flex">
      {items.map((i) => (
        <span key={i.s} className="inline-flex items-center gap-1 text-[11px] text-slate-500">
          <span
            className="inline-block size-2 rounded-full"
            style={{ background: SITE_STATUS[i.s].hex }}
          />
          {i.label}
        </span>
      ))}
    </div>
  );
}
