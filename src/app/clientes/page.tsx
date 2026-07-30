"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { computeClientRollups, projectProgress, type ClientRollup } from "@/lib/kpi";
import { formatCLP, formatPct, cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import { Badge, ProjectStatusBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Avatar, DefRow } from "@/components/ui/misc";
import { HBarChart } from "@/components/charts/Charts";
import { Money, PriceGate } from "@/components/Money";
import {
  Building2,
  Wallet,
  RadioTower,
  AlertTriangle,
  Mail,
  Phone,
  ChevronRight,
  FolderKanban,
  CheckCircle2,
} from "lucide-react";

const SEGMENT_LABEL: Record<string, string> = {
  operador_movil: "Operador móvil",
  torrero: "Torrero / Infra",
  corporativo: "Corporativo",
};

export default function ClientesPage() {
  const { sites, projects, clients } = useStore();
  const [openClient, setOpenClient] = useState<string | null>(null);

  const rollups = useMemo(
    () => computeClientRollups(sites, projects, clients),
    [sites, projects, clients],
  );

  const totalRevenue = rollups.reduce((a, r) => a + r.revenue, 0);
  const totalBilled = rollups.reduce((a, r) => a + r.billed, 0);
  const totalOverdue = rollups.reduce((a, r) => a + r.overdue, 0);

  const revenueChart = rollups
    .filter((r) => r.revenue > 0)
    .map((r) => ({ name: r.client.shortName, value: r.revenue, color: r.client.color }));

  const activeRollup = openClient
    ? rollups.find((r) => r.client.id === openClient)
    : null;
  const clientProjects = activeRollup
    ? projects.filter((p) => p.clientId === activeRollup.client.id)
    : [];

  return (
    <div className="space-y-4">
      <PageHeader
        title="Clientes"
        description={`${clients.length} clientes · cartera de ${formatCLP(totalRevenue, { compact: true })}`}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Clientes" value={clients.length} icon={<Building2 className="size-4" />} tone="brand" accent />
        <PriceGate>
          <KpiCard label="Ingresos cartera" value={formatCLP(totalRevenue, { compact: true })} icon={<Wallet className="size-4" />} tone="blue" accent />
          <KpiCard label="Facturado" value={formatCLP(totalBilled, { compact: true })} icon={<CheckCircle2 className="size-4" />} tone="emerald" accent hint={totalRevenue ? `${formatPct(Math.round((totalBilled / totalRevenue) * 100))} recaudado` : undefined} />
        </PriceGate>
        <KpiCard label="Sitios atrasados" value={totalOverdue} icon={<AlertTriangle className="size-4" />} tone={totalOverdue ? "red" : "slate"} accent />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <PriceGate>
        <Card className="lg:col-span-2">
          <CardHeader title="Ingresos por cliente" subtitle="Cartera total (CLP)" icon={<Wallet className="size-4" />} />
          <div className="p-4">
            <HBarChart
              data={revenueChart}
              colorKey
              valueFormatter={(v) => formatCLP(v, { compact: true })}
              height={Math.max(200, revenueChart.length * 34)}
            />
          </div>
        </Card>
        </PriceGate>
        <Card>
          <CardHeader title="Cumplimiento por cliente" subtitle="% sitios dentro de SLA" />
          <div className="divide-y divide-slate-100">
            {rollups.filter((r) => r.sites > 0).map((r) => (
              <div key={r.client.id} className="flex items-center gap-3 px-4 py-2.5">
                <span className="inline-block size-2.5 shrink-0 rounded-sm" style={{ background: r.client.color }} />
                <span className="flex-1 truncate text-sm text-slate-700">{r.client.shortName}</span>
                <div className="w-24"><Progress value={r.onTimeRate} size="sm" tone={r.onTimeRate < 70 ? "red" : "emerald"} /></div>
                <span className="tabular w-9 text-right text-xs font-semibold text-slate-700">{r.onTimeRate}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Grid de clientes */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {rollups.map((r) => (
          <ClientCard key={r.client.id} rollup={r} onClick={() => setOpenClient(r.client.id)} />
        ))}
      </div>

      {/* Drawer detalle */}
      <Drawer
        open={!!activeRollup}
        onClose={() => setOpenClient(null)}
        title={activeRollup?.client.name}
        subtitle={activeRollup ? SEGMENT_LABEL[activeRollup.client.segment] : undefined}
        width="max-w-lg"
      >
        {activeRollup && (
          <div className="space-y-5 p-5">
            {/* Contacto */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
              <p className="mb-2 text-xs font-semibold uppercase text-slate-400">Contacto principal</p>
              <div className="flex items-center gap-2.5">
                <Avatar name={activeRollup.client.contactName} size={40} />
                <div>
                  <p className="text-sm font-semibold text-slate-800">{activeRollup.client.contactName}</p>
                  <p className="text-xs text-slate-500">{activeRollup.client.contactRole}</p>
                </div>
              </div>
              <div className="mt-3 space-y-1.5">
                <a href={`mailto:${activeRollup.client.contactEmail}`} className="flex items-center gap-2 text-sm text-brand-700 hover:underline">
                  <Mail className="size-4" /> {activeRollup.client.contactEmail}
                </a>
                <p className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone className="size-4 text-slate-400" /> {activeRollup.client.contactPhone}
                </p>
              </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              <MiniKpi label="Proyectos" value={activeRollup.projects} />
              <MiniKpi label="Sitios" value={activeRollup.sites} />
              <MiniKpi label="Avance" value={`${activeRollup.avgProgress}%`} />
              <MiniKpi label="Atrasos" value={activeRollup.overdue} danger={activeRollup.overdue > 0} />
            </div>

            <DefRow label="Ingresos cartera" icon={<Wallet className="size-3.5" />}>
              <Money value={activeRollup.revenue} />
            </DefRow>
            <DefRow label="Facturado">
              <Money value={activeRollup.billed} />
            </DefRow>
            <DefRow label="Cumplimiento SLA">
              <span className={cn(activeRollup.onTimeRate < 70 && "text-red-600")}>
                {activeRollup.onTimeRate}%
              </span>
            </DefRow>

            {/* Proyectos */}
            <div>
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase text-slate-400">
                <FolderKanban className="size-3.5" /> Proyectos
              </p>
              <div className="space-y-1.5">
                {clientProjects.map((p) => (
                  <Link
                    key={p.id}
                    href={`/proyectos/${p.id}`}
                    className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 px-3 py-2 hover:border-brand-300"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.code}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="tabular text-xs font-medium text-slate-500">
                        {projectProgress(p, sites)}%
                      </span>
                      <ProjectStatusBadge status={p.status} />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}

function ClientCard({ rollup, onClick }: { rollup: ClientRollup; onClick: () => void }) {
  const { client } = rollup;
  return (
    <button
      onClick={onClick}
      className="flex flex-col rounded-xl border border-slate-200 bg-white p-4 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className="grid size-10 shrink-0 place-items-center rounded-lg font-bold text-white"
            style={{ background: client.color }}
          >
            {client.shortName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-slate-800">{client.shortName}</h3>
            <Badge tone="slate">{SEGMENT_LABEL[client.segment]}</Badge>
          </div>
        </div>
        <ChevronRight className="size-4 shrink-0 text-slate-300" />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="tabular text-base font-bold text-slate-800">{rollup.sites}</p>
          <p className="text-[10px] text-slate-400">Sitios</p>
        </div>
        <div>
          <p className="tabular text-base font-bold text-slate-800">{rollup.projects}</p>
          <p className="text-[10px] text-slate-400">Proyectos</p>
        </div>
        <div>
          <p className={cn("tabular text-base font-bold", rollup.overdue ? "text-red-600" : "text-slate-800")}>
            {rollup.overdue}
          </p>
          <p className="text-[10px] text-slate-400">Atrasos</p>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
        <div className="flex items-center gap-1 text-xs text-slate-500">
          <RadioTower className="size-3.5" />
          {rollup.avgProgress}% avance
        </div>
        <span className="tabular text-sm font-semibold text-slate-800">
          <Money value={rollup.revenue} compact />
        </span>
      </div>
    </button>
  );
}

function MiniKpi({ label, value, danger }: { label: string; value: React.ReactNode; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-slate-50 px-2 py-2 text-center">
      <p className={cn("tabular text-lg font-bold", danger ? "text-red-600" : "text-slate-800")}>{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}
