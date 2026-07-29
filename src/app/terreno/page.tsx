"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { isOverdue } from "@/lib/kpi";
import { relativeDays, cn } from "@/lib/utils";
import type { Site } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Drawer } from "@/components/ui/Drawer";
import {
  SiteStatusBadge,
  PriorityBadge,
  WorkTypeBadge,
} from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { EmptyState } from "@/components/ui/misc";
import { FieldUpdateForm } from "@/components/field/FieldUpdateForm";
import {
  HardHat,
  MapPin,
  ChevronRight,
  AlertTriangle,
  CalendarClock,
  Smartphone,
} from "lucide-react";

export default function TerrenoPage() {
  const { sites, crews, currentUser } = useStore();
  const [openSite, setOpenSite] = useState<string | null>(null);

  // Determinar la cuadrilla del usuario actual
  const myCrew = useMemo(
    () =>
      crews.find(
        (c) => c.lead === currentUser.name || c.members.includes(currentUser.name),
      ),
    [crews, currentUser.name],
  );

  const mySites = useMemo(() => {
    let base: Site[];
    if (myCrew) {
      base = sites.filter((s) => s.crewId === myCrew.id);
    } else if (currentUser.role === "supervisor") {
      base = sites.filter((s) => s.supervisor === currentUser.name);
    } else {
      base = sites;
    }
    // priorizar: atrasado > ejecución > programado > pendiente > terminado
    const order = { atrasado: 0, ejecucion: 1, programado: 2, pendiente: 3, terminado: 4 };
    return [...base].sort((a, b) => {
      if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
      return a.slaDate.localeCompare(b.slaDate);
    });
  }, [sites, myCrew, currentUser]);

  const activeSite = openSite ? sites.find((s) => s.id === openSite) : null;
  const pending = mySites.filter((s) => s.status !== "terminado");
  const done = mySites.filter((s) => s.status === "terminado");

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <PageHeader
        title="Registro en Terreno"
        description={
          myCrew
            ? `${myCrew.name} · ${myCrew.base}`
            : "Vista de terreno · todos los sitios"
        }
      />

      {/* Banner del técnico */}
      <Card className="flex items-center gap-3 bg-gradient-to-r from-brand-700 to-brand-900 p-4 text-white">
        <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-white/15">
          <HardHat className="size-6" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{currentUser.name}</p>
          <p className="text-xs text-brand-100">
            {currentUser.title} · {pending.length} sitios activos
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 text-xs">
          <Smartphone className="size-3.5" /> Terreno
        </div>
      </Card>

      {mySites.length === 0 ? (
        <Card>
          <EmptyState
            icon={<HardHat className="size-6" />}
            title="Sin sitios asignados"
            description="No tienes sitios asignados en este momento."
          />
        </Card>
      ) : (
        <>
          <div>
            <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              Por trabajar ({pending.length})
            </p>
            <div className="space-y-2">
              {pending.map((s) => (
                <FieldSiteCard key={s.id} site={s} onClick={() => setOpenSite(s.id)} />
              ))}
            </div>
          </div>

          {done.length > 0 && (
            <div>
              <p className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Terminados ({done.length})
              </p>
              <div className="space-y-2">
                {done.map((s) => (
                  <FieldSiteCard key={s.id} site={s} onClick={() => setOpenSite(s.id)} />
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <Drawer
        open={!!activeSite}
        onClose={() => setOpenSite(null)}
        title={activeSite?.name}
        subtitle={activeSite ? `${activeSite.id} · Registrar avance` : undefined}
        width="max-w-lg"
      >
        {activeSite && (
          <FieldUpdateForm site={activeSite} onDone={() => setOpenSite(null)} />
        )}
      </Drawer>
    </div>
  );
}

function FieldSiteCard({ site, onClick }: { site: Site; onClick: () => void }) {
  const overdue = isOverdue(site);
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border bg-white p-3.5 text-left shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-all active:scale-[0.99]",
        overdue ? "border-red-200" : "border-slate-200",
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-slate-400">{site.id}</span>
          <WorkTypeBadge type={site.workType} />
          {site.priority === "critica" && <PriorityBadge priority={site.priority} />}
        </div>
        <p className="mt-0.5 truncate text-sm font-semibold text-slate-800">{site.name}</p>
        <p className="flex items-center gap-1 text-xs text-slate-500">
          <MapPin className="size-3" /> {site.comuna}, {site.region}
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex-1">
            <Progress value={site.progress} showLabel size="sm" />
          </div>
          <span
            className={cn(
              "inline-flex shrink-0 items-center gap-1 text-xs",
              overdue ? "font-semibold text-red-600" : "text-slate-500",
            )}
          >
            {overdue ? <AlertTriangle className="size-3.5" /> : <CalendarClock className="size-3.5" />}
            {overdue ? "Atrasado" : relativeDays(site.slaDate)}
          </span>
        </div>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <SiteStatusBadge status={site.status} />
        <ChevronRight className="size-4 text-slate-300" />
      </div>
    </button>
  );
}
