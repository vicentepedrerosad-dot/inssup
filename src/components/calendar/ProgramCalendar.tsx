"use client";

import { useMemo, useState } from "react";
import type { Site } from "@/lib/types";
import { SITE_STATUS } from "@/lib/status";
import { cn, TODAY } from "@/lib/utils";
import { ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { SiteStatusBadge, WorkTypeBadge } from "@/components/ui/Badge";

const DOW = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export function ProgramCalendar({
  sites,
  onSelect,
}: {
  sites: Site[];
  onSelect: (id: string) => void;
}) {
  const anchor = new Date(TODAY);
  const [cursor, setCursor] = useState({ y: anchor.getFullYear(), m: anchor.getMonth() });
  const [selectedDay, setSelectedDay] = useState<string | null>(TODAY);

  const byDate = useMemo(() => {
    const map = new Map<string, Site[]>();
    for (const s of sites) {
      const arr = map.get(s.scheduledDate) ?? [];
      arr.push(s);
      map.set(s.scheduledDate, arr);
    }
    return map;
  }, [sites]);

  const grid = useMemo(() => {
    const first = new Date(cursor.y, cursor.m, 1);
    const startDow = (first.getDay() + 6) % 7; // lunes = 0
    const daysInMonth = new Date(cursor.y, cursor.m + 1, 0).getDate();
    const cells: (string | null)[] = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const iso = `${cursor.y}-${String(cursor.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push(iso);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [cursor]);

  const move = (delta: number) => {
    setCursor((c) => {
      const nm = c.m + delta;
      return { y: c.y + Math.floor(nm / 12), m: ((nm % 12) + 12) % 12 };
    });
  };

  const dayForList = selectedDay;
  const listSites = dayForList ? byDate.get(dayForList) ?? [] : [];

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      {/* Calendario */}
      <div className="lg:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">
            {MONTHS[cursor.m]} {cursor.y}
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={() => move(-1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <ChevronLeft className="size-4" />
            </button>
            <button
              onClick={() => setCursor({ y: anchor.getFullYear(), m: anchor.getMonth() })}
              className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Hoy
            </button>
            <button
              onClick={() => move(1)}
              className="grid size-8 place-items-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {DOW.map((d) => (
            <div
              key={d}
              className="pb-1 text-center text-[11px] font-semibold uppercase text-slate-400"
            >
              {d}
            </div>
          ))}
          {grid.map((iso, i) => {
            if (!iso) return <div key={i} className="aspect-square" />;
            const day = Number(iso.slice(-2));
            const daySites = byDate.get(iso) ?? [];
            const isToday = iso === TODAY;
            const isSelected = iso === selectedDay;
            // hasta 3 puntos por estado dominante
            const dots = daySites.slice(0, 4);
            return (
              <button
                key={iso}
                onClick={() => setSelectedDay(iso)}
                className={cn(
                  "flex aspect-square flex-col items-center rounded-lg border p-1 text-xs transition-colors",
                  isSelected
                    ? "border-brand-500 bg-brand-50"
                    : "border-slate-100 hover:border-slate-200 hover:bg-slate-50",
                )}
              >
                <span
                  className={cn(
                    "grid size-6 place-items-center rounded-full text-xs font-medium",
                    isToday ? "bg-brand-600 text-white" : "text-slate-600",
                  )}
                >
                  {day}
                </span>
                <div className="mt-auto flex flex-wrap items-center justify-center gap-0.5">
                  {dots.map((s) => (
                    <span
                      key={s.id}
                      className="size-1.5 rounded-full"
                      style={{ background: SITE_STATUS[s.status].hex }}
                    />
                  ))}
                  {daySites.length > 4 && (
                    <span className="text-[8px] text-slate-400">+{daySites.length - 4}</span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista del día */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
        <div className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <CalendarDays className="size-4 text-brand-600" />
          {dayForList
            ? new Date(dayForList).toLocaleDateString("es-CL", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })
            : "Selecciona un día"}
        </div>
        {listSites.length ? (
          <ul className="space-y-1.5">
            {listSites.map((s) => (
              <li key={s.id}>
                <button
                  onClick={() => onSelect(s.id)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2.5 text-left hover:border-brand-300"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-slate-800">
                      {s.name}
                    </span>
                    <WorkTypeBadge type={s.workType} />
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span className="text-xs text-slate-500">{s.id}</span>
                    <SiteStatusBadge status={s.status} />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="py-6 text-center text-sm text-slate-400">
            Sin sitios programados este día.
          </p>
        )}
      </div>
    </div>
  );
}
