"use client";

import { useMemo, useState } from "react";
import { useStore, useClientMap } from "@/lib/store";
import { ROLE, WORK_TYPE } from "@/lib/status";
import { formatCLP, cn } from "@/lib/utils";
import type { Client, Site, Project, Crew } from "@/lib/types";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Field";
import { Badge, SiteStatusBadge, ProjectStatusBadge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/misc";
import { Table, THead, TBody, TR, TD, TH } from "@/components/ui/Table";
import { ClientFormModal } from "@/components/admin/ClientFormModal";
import { SiteFormModal } from "@/components/admin/SiteFormModal";
import { CrewFormModal } from "@/components/admin/CrewFormModal";
import { ProjectFormModal } from "@/components/project/ProjectFormModal";
import { BitacoraView } from "@/components/admin/BitacoraView";
import {
  ShieldCheck,
  ShieldX,
  Building2,
  RadioTower,
  FolderKanban,
  Users,
  History,
  Plus,
  Pencil,
  Trash2,
  Search,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";

type Tab = "empresas" | "sitios" | "proyectos" | "cuadrillas" | "bitacora";
type DelTarget = { kind: Tab; id: string; name: string } | null;

export default function AdminPage() {
  const store = useStore();
  const { canAdmin, currentUser, clients, sites, projects, crews, auditLog } = store;
  const clientMap = useClientMap();
  const [tab, setTab] = useState<Tab>("empresas");
  const [search, setSearch] = useState("");

  // Modales
  const [clientEdit, setClientEdit] = useState<{ open: boolean; item?: Client }>({ open: false });
  const [siteEdit, setSiteEdit] = useState<{ open: boolean; item?: Site }>({ open: false });
  const [projectEdit, setProjectEdit] = useState<{ open: boolean; item?: Project }>({ open: false });
  const [crewEdit, setCrewEdit] = useState<{ open: boolean; item?: Crew }>({ open: false });
  const [del, setDel] = useState<DelTarget>(null);

  const filteredSites = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return sites;
    return sites.filter((s) => `${s.id} ${s.name} ${s.comuna}`.toLowerCase().includes(q));
  }, [sites, search]);

  if (!canAdmin) {
    return (
      <Card className="mx-auto max-w-lg">
        <EmptyState
          icon={<ShieldX className="size-6" />}
          title="Acceso restringido"
          description={`Tu rol (${ROLE[currentUser.role].label}) no tiene acceso al panel de administración. Cámbiate a Administrador o Gerente desde el selector de usuario.`}
        />
      </Card>
    );
  }

  const confirmDelete = () => {
    if (!del) return;
    if (del.kind === "empresas") store.deleteClient(del.id);
    if (del.kind === "sitios") store.deleteSite(del.id);
    if (del.kind === "proyectos") store.deleteProject(del.id);
    if (del.kind === "cuadrillas") store.deleteCrew(del.id);
    toast.success("Elemento eliminado", { description: del.name });
    setDel(null);
  };

  const handleReset = () => {
    store.resetData();
    toast.success("Datos restaurados", { description: "Se recargó el dataset base." });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Panel de Administración"
        description="Control total de empresas, sitios, proyectos y cuadrillas · con bitácora de auditoría."
        actions={
          <div className="flex items-center gap-2 rounded-lg bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 ring-1 ring-inset ring-brand-600/20">
            <ShieldCheck className="size-4" />
            {currentUser.name} · {ROLE[currentUser.role].label}
          </div>
        }
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Segmented<Tab>
          value={tab}
          onChange={(t) => { setTab(t); setSearch(""); }}
          size="sm"
          options={[
            { value: "empresas", label: "Empresas", icon: <Building2 className="size-4" /> },
            { value: "sitios", label: "Sitios", icon: <RadioTower className="size-4" /> },
            { value: "proyectos", label: "Proyectos", icon: <FolderKanban className="size-4" /> },
            { value: "cuadrillas", label: "Cuadrillas", icon: <Users className="size-4" /> },
            { value: "bitacora", label: `Bitácora (${auditLog.length})`, icon: <History className="size-4" /> },
          ]}
        />
        {tab !== "bitacora" && (
          <div className="flex items-center gap-2">
            {tab === "sitios" && (
              <div className="relative">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar sitio…" className="h-8 w-44 pl-8" />
              </div>
            )}
            <Button size="sm" onClick={() => {
              if (tab === "empresas") setClientEdit({ open: true });
              if (tab === "sitios") setSiteEdit({ open: true });
              if (tab === "proyectos") setProjectEdit({ open: true });
              if (tab === "cuadrillas") setCrewEdit({ open: true });
            }}>
              <Plus className="size-4" /> Nuevo
            </Button>
          </div>
        )}
      </div>

      {/* EMPRESAS */}
      {tab === "empresas" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Empresa</TH>
                <TH className="hidden sm:table-cell">Segmento</TH>
                <TH className="hidden md:table-cell">Contacto</TH>
                <TH align="right">Sitios</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {clients.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <div className="flex items-center gap-2">
                      <span className="grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-bold text-white" style={{ background: c.color }}>
                        {c.shortName.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="block truncate font-medium text-slate-800">{c.shortName}</span>
                        <span className="block truncate text-xs text-slate-400">{c.name}</span>
                      </div>
                    </div>
                  </TD>
                  <TD className="hidden sm:table-cell"><Badge tone="slate">{c.segment.replace("_", " ")}</Badge></TD>
                  <TD className="hidden md:table-cell text-slate-500">{c.contactName}</TD>
                  <TD align="right" className="tabular">{sites.filter((s) => s.clientId === c.id).length}</TD>
                  <TD align="right"><RowActions onEdit={() => setClientEdit({ open: true, item: c })} onDelete={() => setDel({ kind: "empresas", id: c.id, name: c.shortName })} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* SITIOS */}
      {tab === "sitios" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Código</TH>
                <TH>Sitio</TH>
                <TH className="hidden md:table-cell">Cliente</TH>
                <TH>Estado</TH>
                <TH align="right">Precio</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {filteredSites.slice(0, 200).map((s) => (
                <TR key={s.id}>
                  <TD className="font-mono text-xs text-slate-500">{s.id}</TD>
                  <TD className="max-w-[220px]"><span className="block truncate font-medium text-slate-800">{s.name}</span></TD>
                  <TD className="hidden md:table-cell text-slate-500">{clientMap.get(s.clientId)?.shortName}</TD>
                  <TD><SiteStatusBadge status={s.status} /></TD>
                  <TD align="right" className="tabular font-medium">{formatCLP(s.budget, { compact: true })}</TD>
                  <TD align="right"><RowActions onEdit={() => setSiteEdit({ open: true, item: s })} onDelete={() => setDel({ kind: "sitios", id: s.id, name: `${s.id} · ${s.name}` })} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* PROYECTOS */}
      {tab === "proyectos" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Código</TH>
                <TH>Proyecto</TH>
                <TH className="hidden md:table-cell">Cliente</TH>
                <TH>Estado</TH>
                <TH align="right" className="hidden sm:table-cell">Ingresos</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {projects.map((p) => (
                <TR key={p.id}>
                  <TD className="font-mono text-xs text-slate-500">{p.code}</TD>
                  <TD className="max-w-[220px]"><span className="block truncate font-medium text-slate-800">{p.name}</span></TD>
                  <TD className="hidden md:table-cell text-slate-500">{clientMap.get(p.clientId)?.shortName}</TD>
                  <TD><ProjectStatusBadge status={p.status} /></TD>
                  <TD align="right" className="tabular hidden sm:table-cell font-medium">{formatCLP(p.expectedRevenue, { compact: true })}</TD>
                  <TD align="right"><RowActions onEdit={() => setProjectEdit({ open: true, item: p })} onDelete={() => setDel({ kind: "proyectos", id: p.id, name: `${p.code} · ${p.name}` })} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* CUADRILLAS */}
      {tab === "cuadrillas" && (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <tr>
                <TH>Cuadrilla</TH>
                <TH className="hidden sm:table-cell">Base</TH>
                <TH className="hidden md:table-cell">Jefe</TH>
                <TH align="right">Técnicos</TH>
                <TH align="center">Estado</TH>
                <TH align="right">Acciones</TH>
              </tr>
            </THead>
            <TBody>
              {crews.map((c) => (
                <TR key={c.id}>
                  <TD>
                    <span className="block font-medium text-slate-800">{c.name}</span>
                    <span className="block text-xs text-slate-400">
                      {c.specialties.slice(0, 3).map((s) => WORK_TYPE[s].short).join(" · ")}
                    </span>
                  </TD>
                  <TD className="hidden sm:table-cell text-slate-500">{c.base}</TD>
                  <TD className="hidden md:table-cell text-slate-500">{c.lead}</TD>
                  <TD align="right" className="tabular">{c.members.length}</TD>
                  <TD align="center">{c.active ? <Badge tone="emerald">Activa</Badge> : <Badge tone="slate">Inactiva</Badge>}</TD>
                  <TD align="right"><RowActions onEdit={() => setCrewEdit({ open: true, item: c })} onDelete={() => setDel({ kind: "cuadrillas", id: c.id, name: c.name })} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>
      )}

      {/* BITÁCORA */}
      {tab === "bitacora" && <BitacoraView />}

      {/* Zona de datos */}
      {tab !== "bitacora" && (
        <div className="flex items-center justify-between rounded-xl border border-slate-200 bg-white px-3.5 py-2.5">
          <p className="text-xs text-slate-500">
            Todos los cambios quedan registrados en la <b>Bitácora</b> con autor, fecha y hora.
          </p>
          <Button variant="outline" size="sm" onClick={handleReset} className="text-slate-500">
            <RotateCcw className="size-4" /> Restaurar datos base
          </Button>
        </div>
      )}

      {/* Modales */}
      {clientEdit.open && (
        <ClientFormModal open onClose={() => setClientEdit({ open: false })} client={clientEdit.item} />
      )}
      {siteEdit.open && (
        <SiteFormModal open onClose={() => setSiteEdit({ open: false })} site={siteEdit.item} />
      )}
      {projectEdit.open && (
        <ProjectFormModal open onClose={() => setProjectEdit({ open: false })} project={projectEdit.item} />
      )}
      {crewEdit.open && (
        <CrewFormModal open onClose={() => setCrewEdit({ open: false })} crew={crewEdit.item} />
      )}

      {/* Confirmación de borrado */}
      <Modal
        open={!!del}
        onClose={() => setDel(null)}
        title="Confirmar eliminación"
        size="max-w-md"
        footer={
          <>
            <Button variant="outline" size="sm" onClick={() => setDel(null)}>Cancelar</Button>
            <Button variant="danger" size="sm" onClick={confirmDelete}>Eliminar</Button>
          </>
        }
      >
        <p className="text-sm text-slate-600">
          ¿Eliminar <b className="text-slate-900">{del?.name}</b>? Esta acción quedará registrada en la bitácora con tu nombre, fecha y hora.
        </p>
      </Modal>
    </div>
  );
}

function RowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <div className="flex items-center justify-end gap-1">
      <button onClick={onEdit} className="grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-brand-700" aria-label="Editar">
        <Pencil className="size-4" />
      </button>
      <button onClick={onDelete} className={cn("grid size-8 place-items-center rounded-lg text-slate-500 hover:bg-red-50 hover:text-red-600")} aria-label="Eliminar">
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}
