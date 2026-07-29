"use client";

import { useMemo, useState } from "react";
import { useStore, useClientMap, useCrewMap } from "@/lib/store";
import { applySiteFilter, EMPTY_FILTER, type SiteFilter } from "@/lib/filters";
import { isOverdue, overdueDays } from "@/lib/kpi";
import { SITE_STATUS } from "@/lib/status";
import { formatDate, formatNumber, cn } from "@/lib/utils";
import type { Site } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { FilterBar } from "@/components/FilterBar";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import {
  SiteStatusBadge,
  PriorityBadge,
  WorkTypeBadge,
} from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/misc";
import {
  Table,
  THead,
  TBody,
  TR,
  TD,
  TH,
  useSort,
} from "@/components/ui/Table";
import { SitesMap } from "@/components/map/SitesMap";
import { SiteDrawer } from "@/components/site/SiteDrawer";
import { ProgramCalendar } from "@/components/calendar/ProgramCalendar";
import { exportCSV, toCSV } from "@/lib/export";
import {
  Table2,
  Map as MapIcon,
  CalendarRange,
  Download,
  AlertTriangle,
  SearchX,
} from "lucide-react";
import { toast } from "sonner";

type View = "tabla" | "mapa" | "calendario";

export default function SitiosPage() {
  const { sites } = useStore();
  const clientMap = useClientMap();
  const crewMap = useCrewMap();
  const [filter, setFilter] = useState<SiteFilter>(EMPTY_FILTER);
  const [view, setView] = useState<View>("tabla");
  const [selected, setSelected] = useState<string | null>(null);

  const filtered = useMemo(() => applySiteFilter(sites, filter), [sites, filter]);

  const accessor = (s: Site, key: string): string | number | null => {
    switch (key) {
      case "id": return s.id;
      case "name": return s.name;
      case "client": return clientMap.get(s.clientId)?.shortName ?? "";
      case "region": return s.region;
      case "status": return s.status;
      case "priority": return { baja: 0, media: 1, alta: 2, critica: 3 }[s.priority];
      case "progress": return s.progress;
      case "sla": return s.slaDate;
      case "hours": return s.hoursWorked;
      default: return null;
    }
  };
  const { sorted, sort, toggle } = useSort(filtered, accessor, {
    key: "sla",
    dir: "asc",
  });

  const handleExport = () => {
    const rows = filtered.map((s) => ({
      codigo: s.id,
      sitio: s.name,
      cliente: clientMap.get(s.clientId)?.shortName ?? "",
      proyecto: s.projectId,
      region: s.region,
      comuna: s.comuna,
      tipo: s.workType,
      estado: SITE_STATUS[s.status].label,
      prioridad: s.priority,
      avance: s.progress,
      cuadrilla: s.crewId ? crewMap.get(s.crewId)?.name ?? "" : "",
      horas: s.hoursWorked,
      programada: s.scheduledDate,
      sla: s.slaDate,
    }));
    exportCSV("inssup-sitios.csv", toCSV(rows));
    toast.success("Sitios exportados", { description: `${rows.length} registros en CSV.` });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Gestión de Sitios"
        description={`${filtered.length} de ${sites.length} sitios · vista consolidada de terreno`}
        actions={
          <>
            <Segmented<View>
              value={view}
              onChange={setView}
              options={[
                { value: "tabla", label: "Tabla", icon: <Table2 className="size-4" /> },
                { value: "mapa", label: "Mapa", icon: <MapIcon className="size-4" /> },
                { value: "calendario", label: "Programación", icon: <CalendarRange className="size-4" /> },
              ]}
            />
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="size-4" />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
          </>
        }
      />

      <FilterBar value={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<SearchX className="size-6" />}
            title="Sin sitios que coincidan"
            description="Ajusta o limpia los filtros para ver más resultados."
          />
        </Card>
      ) : view === "tabla" ? (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH sortKey="id" sort={sort} onSort={toggle}>Código</TH>
                <TH sortKey="name" sort={sort} onSort={toggle}>Sitio</TH>
                <TH sortKey="client" sort={sort} onSort={toggle} className="hidden md:table-cell">Cliente</TH>
                <TH className="hidden lg:table-cell">Tipo</TH>
                <TH sortKey="region" sort={sort} onSort={toggle} className="hidden xl:table-cell">Región</TH>
                <TH sortKey="status" sort={sort} onSort={toggle}>Estado</TH>
                <TH sortKey="priority" sort={sort} onSort={toggle} className="hidden sm:table-cell">Prior.</TH>
                <TH sortKey="progress" sort={sort} onSort={toggle} className="w-36">Avance</TH>
                <TH sortKey="sla" sort={sort} onSort={toggle} align="right">SLA</TH>
              </tr>
            </THead>
            <TBody>
              {sorted.map((s) => {
                const overdue = isOverdue(s);
                return (
                  <TR key={s.id} onClick={() => setSelected(s.id)}>
                    <TD className="font-mono text-xs font-medium text-slate-500">
                      {s.id}
                    </TD>
                    <TD className="max-w-[220px]">
                      <span className="block truncate font-medium text-slate-800">
                        {s.name}
                      </span>
                      <span className="text-xs text-slate-400 md:hidden">
                        {clientMap.get(s.clientId)?.shortName} · {s.comuna}
                      </span>
                    </TD>
                    <TD className="hidden md:table-cell">
                      {clientMap.get(s.clientId)?.shortName}
                    </TD>
                    <TD className="hidden lg:table-cell">
                      <WorkTypeBadge type={s.workType} />
                    </TD>
                    <TD className="hidden xl:table-cell text-slate-500">{s.region}</TD>
                    <TD><SiteStatusBadge status={s.status} /></TD>
                    <TD className="hidden sm:table-cell"><PriorityBadge priority={s.priority} /></TD>
                    <TD>
                      <Progress value={s.progress} showLabel size="sm" />
                    </TD>
                    <TD align="right">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1 text-xs",
                          overdue ? "font-semibold text-red-600" : "text-slate-500",
                        )}
                      >
                        {overdue && <AlertTriangle className="size-3.5" />}
                        {overdue ? `-${overdueDays(s)}d` : formatDate(s.slaDate)}
                      </span>
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </Card>
      ) : view === "mapa" ? (
        <Card className="overflow-hidden">
          <CardHeader
            title="Mapa de sitios"
            subtitle={`${filtered.length} sitios · clic en un marcador para ver la ficha`}
          />
          <SitesMap sites={filtered} onSelect={(s) => setSelected(s.id)} height={600} />
        </Card>
      ) : (
        <Card className="p-4">
          <ProgramCalendar sites={filtered} onSelect={setSelected} />
        </Card>
      )}

      {/* Resumen inferior */}
      {filtered.length > 0 && view === "tabla" && (
        <p className="px-1 text-xs text-slate-400">
          Mostrando {sorted.length} sitios · {formatNumber(
            filtered.reduce((a, s) => a + s.hoursWorked, 0),
          )}{" "}
          horas acumuladas · haz clic en cualquier fila para abrir la ficha.
        </p>
      )}

      <SiteDrawer siteId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
