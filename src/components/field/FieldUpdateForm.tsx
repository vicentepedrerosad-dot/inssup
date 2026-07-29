"use client";

import { useState } from "react";
import { useStore } from "@/lib/store";
import type { Site, SiteStatus, Evidence, ChecklistItem } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Textarea } from "@/components/ui/Field";
import { WorkTypeBadge } from "@/components/ui/Badge";
import { EvidenceThumb } from "@/components/site/EvidenceThumb";
import { isoNow } from "@/lib/utils";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  Circle,
  Camera,
  MapPin,
  Clock,
  Ban,
  Save,
  Gauge,
} from "lucide-react";
import { toast } from "sonner";

export function FieldUpdateForm({
  site,
  onDone,
}: {
  site: Site;
  onDone?: () => void;
}) {
  const { currentUser, updateSite } = useStore();
  const [status, setStatus] = useState<SiteStatus>(site.status);
  const [progress, setProgress] = useState(site.progress);
  const [addHours, setAddHours] = useState(0);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(site.checklist);
  const [evidence, setEvidence] = useState<Evidence[]>(site.evidence);
  const [observations, setObservations] = useState(site.observations);
  const [blocker, setBlocker] = useState(site.blocker ?? "");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);

  const toggleCheck = (id: string) => {
    setChecklist((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c));
      const done = next.filter((c) => c.done).length;
      setProgress(Math.round((done / next.length) * 100));
      return next;
    });
  };

  const captureGps = () => {
    const jitter = () => (Math.random() - 0.5) * 0.004;
    const loc = { lat: site.lat + jitter(), lng: site.lng + jitter() };
    setGps(loc);
    toast.success("Ubicación capturada", {
      description: `${loc.lat.toFixed(5)}, ${loc.lng.toFixed(5)} (GPS simulado)`,
    });
  };

  const addEvidence = () => {
    const n = evidence.length + 1;
    setEvidence((prev) => [
      {
        id: `ev-new-${Date.now()}`,
        label: `Foto de terreno ${n}`,
        type: "foto",
        hue: 150 + Math.floor(Math.random() * 60),
        uploadedAt: isoNow(),
        uploadedBy: currentUser.name,
      },
      ...prev,
    ]);
    toast.success("Evidencia agregada", { description: "Foto simulada cargada." });
  };

  const save = () => {
    const patch: Partial<Site> = {
      status,
      progress,
      checklist,
      evidence,
      observations,
      blocker: blocker.trim() || null,
      hoursWorked: site.hoursWorked + Number(addHours),
    };
    if (status === "ejecucion" && !site.actualStart) {
      patch.actualStart = isoNow();
    }
    if (status === "terminado") {
      patch.progress = 100;
      patch.actualEnd = isoNow();
    }
    updateSite(site.id, patch, {
      author: currentUser.name,
      role: currentUser.role,
      message: `Registro en terreno: estado ${status}, avance ${status === "terminado" ? 100 : progress}%${addHours ? `, +${addHours}h` : ""}${blocker.trim() ? ", bloqueo reportado" : ""}.`,
      kind: "avance",
    });
    toast.success("Actualización guardada", {
      description: `${site.id} sincronizado con la central.`,
    });
    onDone?.();
  };

  const doneChecks = checklist.filter((c) => c.done).length;

  return (
    <div className="space-y-5 p-4 sm:p-5">
      <div className="flex items-center gap-2">
        <WorkTypeBadge type={site.workType} />
        <span className="text-xs text-slate-500">
          {site.comuna}, {site.region}
        </span>
      </div>

      {/* Estado */}
      <Section icon={<Gauge className="size-4" />} title="Estado del sitio">
        <Segmented<SiteStatus>
          value={status}
          onChange={setStatus}
          className="flex-wrap"
          options={[
            { value: "programado", label: "Programado" },
            { value: "ejecucion", label: "En ejecución" },
            { value: "atrasado", label: "Atrasado" },
            { value: "terminado", label: "Terminado" },
          ]}
        />
      </Section>

      {/* Avance */}
      <Section icon={<Gauge className="size-4" />} title={`Avance: ${progress}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={progress}
          onChange={(e) => setProgress(Number(e.target.value))}
          className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-brand-600"
        />
        <div className="mt-1 flex justify-between text-[10px] text-slate-400">
          <span>0%</span><span>50%</span><span>100%</span>
        </div>
      </Section>

      {/* Horas */}
      <Section icon={<Clock className="size-4" />} title="Horas trabajadas en esta jornada">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setAddHours((h) => Math.max(0, h - 1))}>−</Button>
          <div className="flex-1 rounded-lg border border-slate-300 py-2 text-center">
            <span className="tabular text-lg font-semibold text-slate-800">{addHours}h</span>
          </div>
          <Button variant="outline" size="icon" onClick={() => setAddHours((h) => h + 1)}>+</Button>
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Acumulado actual: {site.hoursWorked}h → {site.hoursWorked + addHours}h
        </p>
      </Section>

      {/* Checklist */}
      <Section icon={<CheckCircle2 className="size-4" />} title={`Checklist técnico (${doneChecks}/${checklist.length})`}>
        <div className="space-y-1.5">
          {checklist.map((c) => (
            <button
              key={c.id}
              onClick={() => toggleCheck(c.id)}
              className="flex w-full items-center gap-2.5 rounded-lg border border-slate-200 px-3 py-2.5 text-left active:bg-slate-50"
            >
              {c.done ? (
                <CheckCircle2 className="size-5 shrink-0 text-emerald-500" />
              ) : (
                <Circle className="size-5 shrink-0 text-slate-300" />
              )}
              <span className={cn("text-sm", c.done ? "text-slate-400 line-through" : "text-slate-700")}>
                {c.label}
              </span>
            </button>
          ))}
        </div>
      </Section>

      {/* Evidencia */}
      <Section
        icon={<Camera className="size-4" />}
        title={`Evidencia fotográfica (${evidence.length})`}
        action={
          <Button variant="outline" size="sm" onClick={addEvidence}>
            <Camera className="size-4" /> Agregar
          </Button>
        }
      >
        <div className="grid grid-cols-3 gap-2">
          {evidence.slice(0, 6).map((ev) => (
            <EvidenceThumb key={ev.id} ev={ev} />
          ))}
        </div>
      </Section>

      {/* GPS */}
      <Section icon={<MapPin className="size-4" />} title="Ubicación GPS">
        <Button variant="outline" size="sm" onClick={captureGps} className="w-full">
          <MapPin className="size-4" />
          {gps ? "Ubicación capturada ✓" : "Capturar ubicación actual"}
        </Button>
        {gps && (
          <p className="tabular mt-1.5 text-center text-xs text-slate-500">
            {gps.lat.toFixed(5)}, {gps.lng.toFixed(5)}
          </p>
        )}
      </Section>

      {/* Observaciones */}
      <Section icon={<Camera className="size-4" />} title="Observaciones">
        <Textarea
          rows={2}
          value={observations}
          onChange={(e) => setObservations(e.target.value)}
          placeholder="Notas del avance, condiciones del sitio…"
        />
      </Section>

      {/* Bloqueo */}
      <Section icon={<Ban className="size-4" />} title="Reportar bloqueo (opcional)">
        <Textarea
          rows={2}
          value={blocker}
          onChange={(e) => setBlocker(e.target.value)}
          placeholder="Describe el impedimento que detiene el trabajo…"
          className={cn(blocker && "border-amber-300 bg-amber-50/50")}
        />
      </Section>

      <div className="sticky bottom-0 -mx-4 border-t border-slate-200 bg-white px-4 py-3 sm:-mx-5 sm:px-5">
        <Button onClick={save} className="w-full" size="md">
          <Save className="size-4" /> Guardar actualización
        </Button>
      </div>
    </div>
  );
}

function Section({
  icon,
  title,
  action,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-sm font-semibold text-slate-700">
          <span className="text-brand-600">{icon}</span>
          {title}
        </span>
        {action}
      </div>
      {children}
    </div>
  );
}
