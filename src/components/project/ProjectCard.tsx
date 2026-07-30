"use client";

import Link from "next/link";
import type { Project, Site } from "@/lib/types";
import { useClientMap } from "@/lib/store";
import { projectProgress } from "@/lib/kpi";
import { ProjectStatusBadge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { formatCLP, formatDate, daysUntil, cn } from "@/lib/utils";
import { PriceGate } from "@/components/Money";
import { CalendarClock, RadioTower, User, AlertTriangle } from "lucide-react";

export function ProjectCard({
  project,
  sites,
  compact = false,
}: {
  project: Project;
  sites: Site[];
  compact?: boolean;
}) {
  const clientMap = useClientMap();
  const client = clientMap.get(project.clientId);
  const projSites = sites.filter((s) => s.projectId === project.id);
  const progress = projectProgress(project, sites);
  const margin = project.expectedRevenue - project.estimatedCost;
  const marginPct = project.expectedRevenue
    ? Math.round((margin / project.expectedRevenue) * 100)
    : 0;
  const overBudget = project.estimatedCost > project.budget;
  const daysLeft = daysUntil(project.commitmentDate);
  const late = daysLeft < 0 && project.status !== "completado";

  return (
    <Link
      href={`/proyectos/${project.id}`}
      className="block rounded-xl border border-slate-200 bg-white p-3.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all hover:border-brand-300 hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: client?.color }}
            />
            <span className="font-mono text-xs font-medium text-slate-400">
              {project.code}
            </span>
          </div>
          <h3 className="mt-1 truncate text-sm font-semibold text-slate-800">
            {project.name}
          </h3>
          <p className="text-xs text-slate-500">{client?.shortName}</p>
        </div>
        {!compact && <ProjectStatusBadge status={project.status} />}
      </div>

      <div className="mt-3">
        <Progress value={progress} showLabel size="sm" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
        <span className="inline-flex items-center gap-1">
          <RadioTower className="size-3.5 text-slate-400" />
          {projSites.length} sitios
        </span>
        <span
          className={cn(
            "inline-flex items-center gap-1",
            late && "font-medium text-red-600",
          )}
        >
          <CalendarClock className="size-3.5 text-slate-400" />
          {late ? (
            <>
              <AlertTriangle className="size-3" /> {formatDate(project.commitmentDate)}
            </>
          ) : (
            formatDate(project.commitmentDate)
          )}
        </span>
        {!compact && (
          <span className="inline-flex items-center gap-1">
            <User className="size-3.5 text-slate-400" />
            {project.supervisor}
          </span>
        )}
      </div>

      <PriceGate>
        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2.5">
          <div>
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Ingreso</p>
            <p className="tabular text-sm font-semibold text-slate-800">
              {formatCLP(project.expectedRevenue, { compact: true })}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[10px] uppercase tracking-wide text-slate-400">Margen</p>
            <p
              className={cn(
                "tabular text-sm font-semibold",
                overBudget ? "text-red-600" : "text-emerald-600",
              )}
            >
              {marginPct}%
            </p>
          </div>
        </div>
      </PriceGate>
    </Link>
  );
}
