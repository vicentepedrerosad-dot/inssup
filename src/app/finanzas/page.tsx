"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useStore, useClientMap } from "@/lib/store";
import {
  computeSiteStats,
  computeCrewPerformance,
  computeClientRollups,
  isOverdue,
} from "@/lib/kpi";
import { formatCLP, formatNumber, formatPct, cn } from "@/lib/utils";
import type { Project, Site } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/misc";
import { useAuth } from "@/lib/auth";
import { ShieldX } from "lucide-react";
import { HBarChart } from "@/components/charts/Charts";
import { Table, THead, TBody, TR, TD, TH } from "@/components/ui/Table";
import { exportCSV, toCSV } from "@/lib/export";
import {
  Wallet,
  ReceiptText,
  TrendingUp,
  Coins,
  Clock,
  Download,
  FileWarning,
  Users,
} from "lucide-react";
import { toast } from "sonner";

const HOUR_RATE = 22000; // CLP por hora valorizada (referencial)

type Light = "verde" | "amarillo" | "rojo";

function financialLight(project: Project, sites: Site[]): Light {
  const projSites = sites.filter((s) => s.projectId === project.id);
  const margin = project.expectedRevenue - project.estimatedCost;
  const marginPct = project.expectedRevenue ? (margin / project.expectedRevenue) * 100 : 0;
  const overBudget = project.estimatedCost > project.budget;
  const overdueCount = projSites.filter(isOverdue).length;
  if (overBudget || marginPct < 12 || overdueCount >= 3) return "rojo";
  if (marginPct < 22 || overdueCount >= 1) return "amarillo";
  return "verde";
}

const LIGHT_META: Record<Light, { label: string; dot: string; text: string; bg: string }> = {
  verde: { label: "Saludable", dot: "bg-emerald-500", text: "text-emerald-700", bg: "bg-emerald-50" },
  amarillo: { label: "Atención", dot: "bg-amber-500", text: "text-amber-700", bg: "bg-amber-50" },
  rojo: { label: "Crítico", dot: "bg-red-500", text: "text-red-700", bg: "bg-red-50" },
};

export default function FinanzasPage() {
  const { sites, projects, crews } = useStore();
  const { hasPermission } = useAuth();
  const clientMap = useClientMap();

  const stats = useMemo(() => computeSiteStats(sites), [sites]);
  const crewPerf = useMemo(() => computeCrewPerformance(sites, crews), [sites, crews]);
  const clientRollups = useMemo(
    () => computeClientRollups(sites, projects, [...clientMap.values()]),
    [sites, projects, clientMap],
  );

  const valorizedHours = stats.totalHours * HOUR_RATE;
  const pendingBillingSites = sites.filter((s) => s.status === "terminado" && !s.billed);
  const lights = { verde: 0, amarillo: 0, rojo: 0 };
  projects.forEach((p) => lights[financialLight(p, sites)]++);

  const revenueByClient = clientRollups
    .filter((r) => r.revenue > 0)
    .map((r) => ({ name: r.client.shortName, value: r.revenue, color: r.client.color }));

  const costByCrew = crewPerf
    .filter((c) => c.assigned > 0)
    .map((c) => ({
      name: c.crew.name.replace("Cuadrilla ", ""),
      value: sites.filter((s) => s.crewId === c.crew.id).reduce((a, s) => a + s.cost, 0),
    }))
    .sort((a, b) => b.value - a.value);

  const handleExport = () => {
    const rows = projects.map((p) => {
      const margin = p.expectedRevenue - p.estimatedCost;
      return {
        codigo: p.code,
        proyecto: p.name,
        cliente: clientMap.get(p.clientId)?.shortName ?? "",
        ingresos: p.expectedRevenue,
        costos: p.estimatedCost,
        margen: margin,
        margen_pct: p.expectedRevenue ? Math.round((margin / p.expectedRevenue) * 100) : 0,
        presupuesto: p.budget,
        semaforo: LIGHT_META[financialLight(p, sites)].label,
      };
    });
    exportCSV("inssup-finanzas.csv", toCSV(rows));
    toast.success("Reporte financiero exportado", { description: `${rows.length} proyectos en CSV.` });
  };

  if (!hasPermission("ver_finanzas")) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={<ShieldX className="size-6" />}
          title="Sin acceso a Finanzas"
          description="Tu cuenta no tiene el acceso a información financiera. Solicítalo a un administrador o gerente."
        />
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Finanzas Operacionales"
        description="Ingresos, costos, márgenes y salud financiera por proyecto."
        actions={
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="size-4" /> Exportar
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Ingresos proyectados" value={formatCLP(stats.expectedRevenue, { compact: true })} icon={<Wallet className="size-4" />} tone="blue" accent />
        <KpiCard label="Ingresos facturados" value={formatCLP(stats.billedRevenue, { compact: true })} icon={<ReceiptText className="size-4" />} tone="emerald" accent hint={stats.expectedRevenue ? formatPct(Math.round((stats.billedRevenue / stats.expectedRevenue) * 100)) : undefined} />
        <KpiCard label="Costos estimados" value={formatCLP(stats.estimatedCost, { compact: true })} icon={<Coins className="size-4" />} tone="amber" accent />
        <KpiCard label="Margen estimado" value={formatCLP(stats.estimatedMargin, { compact: true })} icon={<TrendingUp className="size-4" />} tone="brand" accent hint={stats.expectedRevenue ? `${formatPct(Math.round((stats.estimatedMargin / stats.expectedRevenue) * 100))} margen` : undefined} />
        <KpiCard label="Horas valorizadas" value={formatCLP(valorizedHours, { compact: true })} icon={<Clock className="size-4" />} tone="slate" accent hint={`${formatNumber(stats.totalHours)}h × ${formatCLP(HOUR_RATE)}`} />
        <KpiCard label="Pend. facturación" value={formatCLP(stats.pendingBilling, { compact: true })} icon={<FileWarning className="size-4" />} tone={pendingBillingSites.length ? "red" : "slate"} accent hint={`${pendingBillingSites.length} sitios`} />
      </div>

      {/* Semáforo resumen */}
      <div className="grid grid-cols-3 gap-2.5">
        {(["verde", "amarillo", "rojo"] as Light[]).map((l) => (
          <Card key={l} className={cn("flex items-center gap-3 p-3.5", LIGHT_META[l].bg)}>
            <span className={cn("size-3 rounded-full", LIGHT_META[l].dot)} />
            <div>
              <p className={cn("tabular text-xl font-bold", LIGHT_META[l].text)}>{lights[l]}</p>
              <p className="text-xs text-slate-500">Proyectos · {LIGHT_META[l].label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Ingresos por cliente" subtitle="Cartera total" icon={<Wallet className="size-4" />} />
          <div className="p-4">
            <HBarChart data={revenueByClient} colorKey valueFormatter={(v) => formatCLP(v, { compact: true })} height={Math.max(200, revenueByClient.length * 34)} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Costo por cuadrilla" subtitle="Costo estimado de sitios asignados" icon={<Users className="size-4" />} />
          <div className="p-4">
            <HBarChart data={costByCrew} color="#d97706" valueFormatter={(v) => formatCLP(v, { compact: true })} height={Math.max(200, costByCrew.length * 30)} />
          </div>
        </Card>
      </div>

      {/* Semáforo financiero por proyecto */}
      <Card className="overflow-hidden">
        <CardHeader title="Semáforo financiero por proyecto" subtitle="Salud de margen y presupuesto" icon={<TrendingUp className="size-4" />} />
        <Table>
          <THead>
            <tr>
              <TH>Proyecto</TH>
              <TH className="hidden md:table-cell">Cliente</TH>
              <TH align="right">Ingresos</TH>
              <TH align="right" className="hidden sm:table-cell">Costos</TH>
              <TH align="right">Margen</TH>
              <TH align="right" className="hidden lg:table-cell">Presupuesto</TH>
              <TH align="center">Estado</TH>
            </tr>
          </THead>
          <TBody>
            {projects.map((p) => {
              const margin = p.expectedRevenue - p.estimatedCost;
              const marginPct = p.expectedRevenue ? Math.round((margin / p.expectedRevenue) * 100) : 0;
              const light = financialLight(p, sites);
              const meta = LIGHT_META[light];
              const overBudget = p.estimatedCost > p.budget;
              return (
                <TR key={p.id}>
                  <TD className="max-w-[220px]">
                    <Link href={`/proyectos/${p.id}`} className="block">
                      <span className="block truncate font-medium text-slate-800 hover:text-brand-700">{p.name}</span>
                      <span className="font-mono text-xs text-slate-400">{p.code}</span>
                    </Link>
                  </TD>
                  <TD className="hidden md:table-cell text-slate-500">{clientMap.get(p.clientId)?.shortName}</TD>
                  <TD align="right" className="tabular">{formatCLP(p.expectedRevenue, { compact: true })}</TD>
                  <TD align="right" className={cn("tabular hidden sm:table-cell", overBudget && "text-red-600 font-medium")}>
                    {formatCLP(p.estimatedCost, { compact: true })}
                  </TD>
                  <TD align="right" className={cn("tabular font-semibold", margin > 0 ? "text-emerald-600" : "text-red-600")}>
                    {marginPct}%
                  </TD>
                  <TD align="right" className="tabular hidden lg:table-cell text-slate-500">{formatCLP(p.budget, { compact: true })}</TD>
                  <TD align="center">
                    <span className={cn("inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-xs font-medium", meta.bg, meta.text)}>
                      <span className={cn("size-2 rounded-full", meta.dot)} />
                      {meta.label}
                    </span>
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      {/* Pendientes de facturación */}
      <Card className="overflow-hidden">
        <CardHeader
          title="Sitios pendientes de facturación"
          subtitle={`${pendingBillingSites.length} sitios terminados sin facturar · ${formatCLP(stats.pendingBilling, { compact: true })}`}
          icon={<FileWarning className="size-4" />}
        />
        {pendingBillingSites.length ? (
          <Table>
            <THead>
              <tr>
                <TH>Código</TH>
                <TH>Sitio</TH>
                <TH className="hidden sm:table-cell">Cliente</TH>
                <TH align="right">Monto</TH>
              </tr>
            </THead>
            <TBody>
              {pendingBillingSites.map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs text-slate-500">{s.id}</TD>
                  <TD className="max-w-[240px]"><span className="block truncate font-medium text-slate-800">{s.name}</span></TD>
                  <TD className="hidden sm:table-cell text-slate-500">{clientMap.get(s.clientId)?.shortName}</TD>
                  <TD align="right" className="tabular font-semibold text-slate-800">{formatCLP(s.budget, { compact: true })}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        ) : (
          <p className="py-8 text-center text-sm text-slate-400">Todo facturado. Sin pendientes.</p>
        )}
      </Card>
    </div>
  );
}
