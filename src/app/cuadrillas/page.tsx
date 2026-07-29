"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { computeCrewPerformance, type CrewPerformance } from "@/lib/kpi";
import { WORK_TYPE } from "@/lib/status";
import { formatCLP, formatNumber, cn } from "@/lib/utils";
import { PageHeader } from "@/components/PageHeader";
import { KpiCard } from "@/components/KpiCard";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress, ProgressRing } from "@/components/ui/Progress";
import { Avatar } from "@/components/ui/misc";
import { HBarChart } from "@/components/charts/Charts";
import { SiteDrawer } from "@/components/site/SiteDrawer";
import {
  Users,
  Zap,
  Trophy,
  TrendingDown,
  MapPin,
  Clock,
  CheckCircle2,
  Loader,
  CalendarCheck,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

export default function CuadrillasPage() {
  const { sites, crews } = useStore();
  const [openCrew, setOpenCrew] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<string | null>(null);

  const perf = useMemo(() => computeCrewPerformance(sites, crews), [sites, crews]);
  const active = perf.filter((p) => p.assigned > 0);

  const avgProd = active.length
    ? Math.round(active.reduce((a, p) => a + p.productivity, 0) / active.length)
    : 0;
  const best = active[0];
  const underperformers = active.filter((p) => p.productivity < 55).length;

  const rankingData = active.map((p) => ({
    name: p.crew.name.replace("Cuadrilla ", ""),
    value: p.productivity,
  }));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Cuadrillas y Productividad"
        description={`${active.length} cuadrillas activas · ${formatNumber(sites.filter((s) => s.crewId).length)} sitios asignados`}
      />

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <KpiCard label="Cuadrillas activas" value={active.length} icon={<Users className="size-4" />} tone="brand" accent />
        <KpiCard label="Productividad prom." value={`${avgProd}%`} icon={<Zap className="size-4" />} tone="amber" accent />
        <KpiCard label="Mejor cuadrilla" value={best ? `${best.productivity}%` : "—"} icon={<Trophy className="size-4" />} tone="emerald" accent hint={best?.crew.name.replace("Cuadrilla ", "")} />
        <KpiCard label="Bajo rendimiento" value={underperformers} icon={<TrendingDown className="size-4" />} tone={underperformers ? "red" : "slate"} accent hint="Productividad < 55%" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader title="Ranking de productividad" subtitle="Índice compuesto: avance, cumplimiento y sitios completados" icon={<Trophy className="size-4" />} />
          <CardBody>
            <HBarChart
              data={rankingData}
              color="#0e7490"
              domainMax={100}
              valueFormatter={(v) => `${v}`}
              height={Math.max(200, rankingData.length * 34)}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Requiere atención" icon={<AlertTriangle className="size-4" />} />
          <CardBody className="space-y-2">
            {active.filter((p) => p.productivity < 55 || p.onTimeRate < 70).length ? (
              active
                .filter((p) => p.productivity < 55 || p.onTimeRate < 70)
                .map((p) => (
                  <div key={p.crew.id} className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 ring-1 ring-inset ring-red-500/15">
                    <TrendingDown className="size-4 shrink-0 text-red-500" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{p.crew.name}</p>
                      <p className="text-xs text-slate-500">
                        Prod. {p.productivity}% · Cumpl. {p.onTimeRate}%
                      </p>
                    </div>
                  </div>
                ))
            ) : (
              <p className="py-6 text-center text-sm text-slate-400">
                Todas las cuadrillas dentro de rango.
              </p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Grid de cuadrillas */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {perf.map((p) => (
          <CrewCard
            key={p.crew.id}
            perf={p}
            expanded={openCrew === p.crew.id}
            onToggle={() =>
              setOpenCrew((c) => (c === p.crew.id ? null : p.crew.id))
            }
            sites={sites}
            onSelectSite={setSelectedSite}
          />
        ))}
      </div>

      <SiteDrawer siteId={selectedSite} onClose={() => setSelectedSite(null)} />
    </div>
  );
}

function CrewCard({
  perf,
  expanded,
  onToggle,
  sites,
  onSelectSite,
}: {
  perf: CrewPerformance;
  expanded: boolean;
  onToggle: () => void;
  sites: import("@/lib/types").Site[];
  onSelectSite: (id: string) => void;
}) {
  const { crew } = perf;
  const crewSites = sites.filter((s) => s.crewId === crew.id);
  const under = perf.productivity < 55;

  return (
    <Card className="overflow-hidden">
      <div className="flex items-start gap-3 p-3.5">
        <ProgressRing value={perf.productivity} size={52} label={`${perf.productivity}`} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-semibold text-slate-800">
              {crew.name}
            </h3>
            {under && <Badge tone="red">Bajo</Badge>}
            {!crew.active && <Badge tone="slate">Inactiva</Badge>}
          </div>
          <p className="flex items-center gap-1 text-xs text-slate-500">
            <MapPin className="size-3" /> {crew.base}
          </p>
          <div className="mt-1.5 flex items-center gap-1">
            <Avatar name={crew.lead} size={20} />
            <span className="text-xs text-slate-500">Jefe: {crew.lead.split(" ")[0]} {crew.lead.split(" ")[1]}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-px border-y border-slate-100 bg-slate-100">
        <Metric icon={<Users className="size-3.5" />} value={perf.assigned} label="Sitios" />
        <Metric icon={<CheckCircle2 className="size-3.5 text-emerald-500" />} value={perf.completed} label="Listos" />
        <Metric icon={<Loader className="size-3.5 text-amber-500" />} value={perf.inProgress} label="En curso" />
        <Metric icon={<Clock className="size-3.5" />} value={formatNumber(perf.hours)} label="Horas" />
      </div>

      <div className="space-y-2 p-3.5">
        <MiniBar label="Avance promedio" value={perf.avgProgress} />
        <MiniBar label="Cumplimiento de fechas" value={perf.onTimeRate} tone={perf.onTimeRate < 70 ? "red" : "emerald"} />
        <div className="flex items-center justify-between pt-1 text-xs text-slate-500">
          <span className="inline-flex items-center gap-1">
            <CalendarCheck className="size-3.5" />
            Ingresos: {formatCLP(perf.revenue, { compact: true })}
          </span>
          <span>{crew.members.length} técnicos</span>
        </div>

        <button
          onClick={onToggle}
          className="mt-1 flex w-full items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100"
        >
          {expanded ? "Ocultar detalle" : "Ver técnicos y sitios"}
          <ChevronRight className={cn("size-4 transition-transform", expanded && "rotate-90")} />
        </button>

        {expanded && (
          <div className="space-y-3 pt-1">
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Técnicos</p>
              <div className="flex flex-wrap gap-1.5">
                {crew.members.map((m) => (
                  <span key={m} className="inline-flex items-center gap-1 rounded-full bg-slate-100 py-0.5 pl-0.5 pr-2 text-xs text-slate-600">
                    <Avatar name={m} size={18} />
                    {m}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Especialidades</p>
              <div className="flex flex-wrap gap-1">
                {crew.specialties.map((sp) => (
                  <Badge key={sp} tone="brand">{WORK_TYPE[sp].short}</Badge>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[11px] font-semibold uppercase text-slate-400">Sitios asignados</p>
              <div className="space-y-1">
                {crewSites.slice(0, 6).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => onSelectSite(s.id)}
                    className="flex w-full items-center justify-between gap-2 rounded-md border border-slate-200 px-2 py-1.5 text-left text-xs hover:border-brand-300"
                  >
                    <span className="truncate text-slate-700">{s.name}</span>
                    <span className="tabular shrink-0 font-medium text-slate-400">{s.progress}%</span>
                  </button>
                ))}
                {!crewSites.length && (
                  <p className="text-xs text-slate-400">Sin sitios asignados.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function Metric({ icon, value, label }: { icon: React.ReactNode; value: React.ReactNode; label: string }) {
  return (
    <div className="bg-white px-2 py-2 text-center">
      <div className="flex items-center justify-center gap-1 text-slate-400">{icon}</div>
      <p className="tabular mt-0.5 text-sm font-semibold text-slate-800">{value}</p>
      <p className="text-[10px] text-slate-400">{label}</p>
    </div>
  );
}

function MiniBar({ label, value, tone }: { label: string; value: number; tone?: "emerald" | "red" }) {
  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between text-xs">
        <span className="text-slate-500">{label}</span>
        <span className="tabular font-medium text-slate-700">{value}%</span>
      </div>
      <Progress value={value} size="sm" tone={tone ?? "auto"} />
    </div>
  );
}
