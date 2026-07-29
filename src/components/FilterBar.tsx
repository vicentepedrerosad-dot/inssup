"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import { REGIONS } from "@/lib/data";
import { Select, Input } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import { SITE_STATUS_ORDER } from "@/lib/status";
import { SITE_STATUS, WORK_TYPE } from "@/lib/status";
import type { WorkType } from "@/lib/types";
import { type SiteFilter, activeFilterCount, EMPTY_FILTER } from "@/lib/filters";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

const WORK_TYPES = Object.keys(WORK_TYPE) as WorkType[];

export function FilterBar({
  value,
  onChange,
  hide = [],
}: {
  value: SiteFilter;
  onChange: (f: SiteFilter) => void;
  hide?: (keyof SiteFilter)[];
}) {
  const { clients, crews, projects } = useStore();
  const [expanded, setExpanded] = useState(false);
  const count = activeFilterCount(value);
  const set = (patch: Partial<SiteFilter>) => onChange({ ...value, ...patch });
  const show = (k: keyof SiteFilter) => !hide.includes(k);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-2.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center gap-2">
        {/* Búsqueda */}
        <div className="relative min-w-0 flex-1 basis-48">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={value.search}
            onChange={(e) => set({ search: e.target.value })}
            placeholder="Buscar sitio, comuna, código…"
            className="pl-8.5"
          />
        </div>

        {/* Selects rápidos siempre visibles en desktop */}
        {show("clientId") && (
          <Select
            value={value.clientId}
            onChange={(e) => set({ clientId: e.target.value })}
            className="hidden w-auto min-w-32 sm:block"
          >
            <option value="">Todos los clientes</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.shortName}
              </option>
            ))}
          </Select>
        )}
        {show("status") && (
          <Select
            value={value.status}
            onChange={(e) => set({ status: e.target.value as SiteFilter["status"] })}
            className="hidden w-auto min-w-32 sm:block"
          >
            <option value="">Todos los estados</option>
            {SITE_STATUS_ORDER.map((s) => (
              <option key={s} value={s}>
                {SITE_STATUS[s].label}
              </option>
            ))}
          </Select>
        )}

        <Button
          variant={expanded ? "primary" : "outline"}
          size="sm"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0"
        >
          <SlidersHorizontal className="size-4" />
          Filtros
          {count > 0 && (
            <span className="ml-0.5 grid size-4.5 place-items-center rounded-full bg-white/20 text-[10px] font-bold">
              {count}
            </span>
          )}
        </Button>

        {count > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChange({ ...EMPTY_FILTER })}
            className="shrink-0 text-slate-500"
          >
            <X className="size-4" />
            <span className="hidden sm:inline">Limpiar</span>
          </Button>
        )}
      </div>

      {/* Panel expandido */}
      {expanded && (
        <div className="mt-2.5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-2.5 sm:grid-cols-3 lg:grid-cols-6">
          {show("clientId") && (
            <FilterSelect
              label="Cliente"
              value={value.clientId}
              onChange={(v) => set({ clientId: v })}
              options={[
                { value: "", label: "Todos" },
                ...clients.map((c) => ({ value: c.id, label: c.shortName })),
              ]}
              className="sm:hidden"
            />
          )}
          {show("region") && (
            <FilterSelect
              label="Región"
              value={value.region}
              onChange={(v) => set({ region: v })}
              options={[
                { value: "", label: "Todas" },
                ...REGIONS.map((r) => ({ value: r, label: r })),
              ]}
            />
          )}
          {show("projectId") && (
            <FilterSelect
              label="Proyecto"
              value={value.projectId}
              onChange={(v) => set({ projectId: v })}
              options={[
                { value: "", label: "Todos" },
                ...projects.map((p) => ({ value: p.id, label: p.code })),
              ]}
            />
          )}
          {show("crewId") && (
            <FilterSelect
              label="Cuadrilla"
              value={value.crewId}
              onChange={(v) => set({ crewId: v })}
              options={[
                { value: "", label: "Todas" },
                ...crews.map((c) => ({ value: c.id, label: c.name })),
              ]}
            />
          )}
          {show("workType") && (
            <FilterSelect
              label="Tipo de trabajo"
              value={value.workType}
              onChange={(v) => set({ workType: v as SiteFilter["workType"] })}
              options={[
                { value: "", label: "Todos" },
                ...WORK_TYPES.map((w) => ({ value: w, label: WORK_TYPE[w].short })),
              ]}
            />
          )}
          {show("status") && (
            <FilterSelect
              label="Estado"
              value={value.status}
              onChange={(v) => set({ status: v as SiteFilter["status"] })}
              options={[
                { value: "", label: "Todos" },
                ...SITE_STATUS_ORDER.map((s) => ({ value: s, label: SITE_STATUS[s].label })),
              ]}
              className="sm:hidden"
            />
          )}
          {show("dateFrom") && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Desde</p>
              <Input
                type="date"
                value={value.dateFrom}
                onChange={(e) => set({ dateFrom: e.target.value })}
              />
            </div>
          )}
          {show("dateTo") && (
            <div>
              <p className="mb-1 text-[11px] font-medium text-slate-500">Hasta</p>
              <Input
                type="date"
                value={value.dateTo}
                onChange={(e) => set({ dateTo: e.target.value })}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <p className="mb-1 text-[11px] font-medium text-slate-500">{label}</p>
      <Select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    </div>
  );
}
