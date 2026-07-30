"use client";

import { useMemo } from "react";
import { useStore, useClientMap, useCrewMap } from "@/lib/store";
import {
  computeSiteStats,
  computeCrewPerformance,
  computeClientRollups,
  isOverdue,
  overdueDays,
} from "@/lib/kpi";
import { WORK_TYPE } from "@/lib/status";
import { formatDate, TODAY } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { exportCSV, toCSV } from "@/lib/export";
import { useCanSeePrices } from "@/components/Money";
import {
  FileBarChart,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  AlertTriangle,
  Users,
  Wallet,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

export default function ReportesPage() {
  const { sites, projects, crews } = useStore();
  const clientMap = useClientMap();
  const crewMap = useCrewMap();
  const canPrices = useCanSeePrices();

  const stats = useMemo(() => computeSiteStats(sites), [sites]);
  const crewPerf = useMemo(() => computeCrewPerformance(sites, crews), [sites, crews]);
  const clientRollups = useMemo(
    () => computeClientRollups(sites, projects, [...clientMap.values()]),
    [sites, projects, clientMap],
  );

  const overdueSites = sites.filter(isOverdue);
  const completedSites = sites.filter((s) => s.status === "terminado");

  const pdfMock = (name: string) =>
    toast.success("Documento PDF generado", {
      description: `${name} · exportación simulada (demo).`,
    });

  const reports: {
    id: string;
    icon: LucideIcon;
    tone: string;
    title: string;
    desc: string;
    meta: string;
    csv: () => void;
  }[] = [
    {
      id: "ejecutivo",
      icon: FileBarChart,
      tone: "bg-brand-50 text-brand-700",
      title: "Reporte ejecutivo mensual",
      desc: "Consolidado de KPIs operacionales y financieros del período.",
      meta: `Corte ${formatDate(TODAY)}`,
      csv: () => {
        const rows = [
          { indicador: "Total de sitios", valor: stats.total },
          { indicador: "Sitios terminados", valor: stats.terminado },
          { indicador: "Sitios en ejecución", valor: stats.ejecucion },
          { indicador: "Sitios atrasados", valor: stats.atrasado },
          { indicador: "Avance general (%)", valor: stats.avgProgress },
          { indicador: "Horas trabajadas", valor: stats.totalHours },
          ...(canPrices
            ? [
                { indicador: "Ingresos proyectados", valor: stats.expectedRevenue },
                { indicador: "Ingresos facturados", valor: stats.billedRevenue },
                { indicador: "Margen estimado", valor: stats.estimatedMargin },
              ]
            : []),
        ];
        exportCSV("inssup-reporte-ejecutivo.csv", toCSV(rows));
      },
    },
    {
      id: "cliente",
      icon: TrendingUp,
      tone: "bg-blue-50 text-blue-700",
      title: "Avance por cliente",
      desc: "Sitios, avance, ingresos y cumplimiento de SLA por cliente.",
      meta: `${clientRollups.length} clientes`,
      csv: () => {
        const rows = clientRollups.map((r) => ({
          cliente: r.client.name,
          proyectos: r.projects,
          sitios: r.sites,
          terminados: r.completed,
          avance_pct: r.avgProgress,
          atrasos: r.overdue,
          cumplimiento_pct: r.onTimeRate,
          ingresos: r.revenue,
          facturado: r.billed,
        }));
        exportCSV("inssup-avance-por-cliente.csv", toCSV(rows));
      },
    },
    {
      id: "atrasos",
      icon: AlertTriangle,
      tone: "bg-red-50 text-red-700",
      title: "Reporte de atrasos",
      desc: "Sitios con compromiso SLA vencido y días de atraso.",
      meta: `${overdueSites.length} sitios atrasados`,
      csv: () => {
        const rows = overdueSites.map((s) => ({
          codigo: s.id,
          sitio: s.name,
          cliente: clientMap.get(s.clientId)?.shortName ?? "",
          region: s.region,
          cuadrilla: s.crewId ? crewMap.get(s.crewId)?.name ?? "" : "",
          sla: s.slaDate,
          dias_atraso: overdueDays(s),
          avance_pct: s.progress,
          bloqueo: s.blocker ?? "",
        }));
        exportCSV("inssup-reporte-atrasos.csv", toCSV(rows));
      },
    },
    {
      id: "productividad",
      icon: Users,
      tone: "bg-amber-50 text-amber-700",
      title: "Reporte de productividad",
      desc: "Rendimiento por cuadrilla: avance, cumplimiento y horas.",
      meta: `${crewPerf.filter((c) => c.assigned > 0).length} cuadrillas`,
      csv: () => {
        const rows = crewPerf.map((c) => ({
          cuadrilla: c.crew.name,
          base: c.crew.base,
          sitios: c.assigned,
          terminados: c.completed,
          en_curso: c.inProgress,
          horas: c.hours,
          avance_pct: c.avgProgress,
          cumplimiento_pct: c.onTimeRate,
          productividad: c.productivity,
        }));
        exportCSV("inssup-reporte-productividad.csv", toCSV(rows));
      },
    },
    {
      id: "financiero",
      icon: Wallet,
      tone: "bg-emerald-50 text-emerald-700",
      title: "Reporte financiero",
      desc: "Ingresos, costos, márgenes y presupuesto por proyecto.",
      meta: `${projects.length} proyectos`,
      csv: () => {
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
          };
        });
        exportCSV("inssup-reporte-financiero.csv", toCSV(rows));
      },
    },
    {
      id: "terminados",
      icon: CheckCircle2,
      tone: "bg-emerald-50 text-emerald-700",
      title: "Reporte de sitios terminados",
      desc: "Sitios completados con fechas reales y facturación.",
      meta: `${completedSites.length} sitios terminados`,
      csv: () => {
        const rows = completedSites.map((s) => ({
          codigo: s.id,
          sitio: s.name,
          cliente: clientMap.get(s.clientId)?.shortName ?? "",
          tipo: WORK_TYPE[s.workType].label,
          region: s.region,
          inicio_real: s.actualStart ? formatDate(s.actualStart) : "",
          termino_real: s.actualEnd ? formatDate(s.actualEnd) : "",
          horas: s.hoursWorked,
          ingreso: s.budget,
          facturado: s.billed ? "Sí" : "No",
        }));
        exportCSV("inssup-sitios-terminados.csv", toCSV(rows));
      },
    },
  ];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Reportes"
        description="Genera y exporta reportes operacionales, comerciales y financieros."
      />

      <div className="rounded-xl border border-brand-200 bg-brand-50/60 p-3.5">
        <p className="flex items-center gap-2 text-sm text-brand-900">
          <FileText className="size-4 shrink-0" />
          Los reportes CSV descargan datos reales del sistema. La exportación PDF es
          simulada en esta demo (ver roadmap para generación real).
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {reports.filter((r) => canPrices || r.id !== "financiero").map((r) => {
          const Icon = r.icon;
          return (
            <Card key={r.id} className="flex flex-col p-4">
              <div className="flex items-start gap-3">
                <div className={`grid size-10 shrink-0 place-items-center rounded-lg ${r.tone}`}>
                  <Icon className="size-5" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-slate-800">{r.title}</h3>
                  <p className="mt-0.5 text-xs text-slate-500">{r.desc}</p>
                </div>
              </div>
              <p className="mt-3 text-xs font-medium text-slate-400">{r.meta}</p>
              <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3">
                <Button variant="outline" size="sm" className="flex-1" onClick={r.csv}>
                  <FileSpreadsheet className="size-4" /> CSV
                </Button>
                <Button variant="ghost" size="sm" className="flex-1 border border-slate-200" onClick={() => pdfMock(r.title)}>
                  <FileText className="size-4" /> PDF
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
