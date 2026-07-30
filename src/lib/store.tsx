"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  useCallback,
  useRef,
  type ReactNode,
} from "react";
import type {
  Site,
  Project,
  Client,
  Crew,
  ActivityLog,
  UserProfile,
  AuditAction,
  AuditEntity,
} from "./types";
import { CLIENTS, CREWS, SEED_PROJECTS, SEED_SITES } from "./data";
import { isoNow, formatCLP } from "./utils";
import { WORK_TYPE, SITE_STATUS, PROJECT_STATUS } from "./status";
import { diffChanges, summarizeChanges, type FieldSpec } from "./audit";
import { useAuth } from "./auth";

const STORAGE_KEY = "inssup:data:v3";

interface PersistShape {
  sites: Site[];
  projects: Project[];
  clients: Client[];
  crews: Crew[];
}

type RecordInput = {
  action: AuditAction;
  entity: AuditEntity;
  entityId: string;
  entityName: string;
  summary: string;
  changes?: { field: string; before: string; after: string }[];
};

interface StoreValue {
  sites: Site[];
  projects: Project[];
  clients: Client[];
  crews: Crew[];
  currentUser: UserProfile;
  hydrated: boolean;
  canAdmin: boolean;
  updateSite: (id: string, patch: Partial<Site>, activity?: Omit<ActivityLog, "id" | "at">) => void;
  createSite: (s: Site) => void;
  deleteSite: (id: string) => void;
  addSiteActivity: (id: string, entry: Omit<ActivityLog, "id" | "at">) => void;
  createProject: (p: Project) => void;
  updateProject: (id: string, patch: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  createClient: (c: Client) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  createCrew: (c: Crew) => void;
  updateCrew: (id: string, patch: Partial<Crew>) => void;
  deleteCrew: (id: string) => void;
  resetData: () => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function freshSeed(): PersistShape {
  return {
    sites: structuredClone(SEED_SITES),
    projects: structuredClone(SEED_PROJECTS),
    clients: structuredClone(CLIENTS),
    crews: structuredClone(CREWS),
  };
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { user: authUser, logAudit, hasPermission } = useAuth();

  const seed = useMemo(() => freshSeed(), []);
  const [sites, setSites] = useState<Site[]>(seed.sites);
  const [projects, setProjects] = useState<Project[]>(seed.projects);
  const [clients, setClients] = useState<Client[]>(seed.clients);
  const [crews, setCrews] = useState<Crew[]>(seed.crews);
  const [hydrated, setHydrated] = useState(false);

  const currentUser = useMemo<UserProfile>(
    () =>
      authUser
        ? { id: authUser.id, name: authUser.name, role: authUser.role, title: authUser.title }
        : { id: "anon", name: "Invitado", role: "tecnico", title: "" },
    [authUser],
  );

  const sitesRef = useRef(sites);
  const projectsRef = useRef(projects);
  const clientsRef = useRef(clients);
  const crewsRef = useRef(crews);
  useEffect(() => {
    sitesRef.current = sites;
    projectsRef.current = projects;
    clientsRef.current = clients;
    crewsRef.current = crews;
  }, [sites, projects, clients, crews]);

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const p = JSON.parse(raw) as PersistShape;
        if (p.sites?.length) setSites(p.sites);
        if (p.projects?.length) setProjects(p.projects);
        if (p.clients?.length) setClients(p.clients);
        if (p.crews?.length) setCrews(p.crews);
      }
    } catch {
      /* noop */
    }
    setHydrated(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ sites, projects, clients, crews }));
    } catch {
      /* noop */
    }
  }, [sites, projects, clients, crews, hydrated]);

  /* ------------------------------ Auditoría (Supabase) ------------------- */
  const record = useCallback(
    (e: RecordInput) => {
      logAudit({
        action: e.action,
        entity: e.entity,
        entityId: e.entityId,
        entityName: e.entityName,
        summary: e.summary,
        changes: e.changes ?? null,
      });
    },
    [logAudit],
  );

  const clientLabel = useCallback(
    (id: unknown) => clientsRef.current.find((c) => c.id === id)?.shortName ?? String(id ?? "—"),
    [],
  );
  const projectLabel = useCallback(
    (id: unknown) => projectsRef.current.find((p) => p.id === id)?.code ?? String(id ?? "—"),
    [],
  );
  const crewLabel = useCallback(
    (id: unknown) => (id ? (crewsRef.current.find((c) => c.id === id)?.name ?? String(id)) : "Sin asignar"),
    [],
  );

  const siteSpecs = useCallback(
    (): FieldSpec[] => [
      { key: "name", label: "Nombre" },
      { key: "clientId", label: "Cliente", format: clientLabel },
      { key: "projectId", label: "Proyecto", format: projectLabel },
      { key: "region", label: "Región" },
      { key: "comuna", label: "Comuna" },
      { key: "workType", label: "Tipo", format: (v) => WORK_TYPE[v as keyof typeof WORK_TYPE]?.label ?? String(v) },
      { key: "status", label: "Estado", format: (v) => SITE_STATUS[v as keyof typeof SITE_STATUS]?.label ?? String(v) },
      { key: "priority", label: "Prioridad" },
      { key: "progress", label: "Avance", format: (v) => `${v}%` },
      { key: "budget", label: "Ingreso", format: (v) => formatCLP(Number(v)) },
      { key: "cost", label: "Costo", format: (v) => formatCLP(Number(v)) },
      { key: "billed", label: "Facturado", format: (v) => (v ? "Sí" : "No") },
      { key: "crewId", label: "Cuadrilla", format: crewLabel },
      { key: "supervisor", label: "Supervisor" },
      { key: "hoursWorked", label: "Horas", format: (v) => `${v}h` },
      { key: "scheduledDate", label: "Programada" },
      { key: "slaDate", label: "SLA" },
      { key: "blocker", label: "Bloqueo" },
    ],
    [clientLabel, projectLabel, crewLabel],
  );

  const projectSpecs = useCallback(
    (): FieldSpec[] => [
      { key: "name", label: "Nombre" },
      { key: "clientId", label: "Cliente", format: clientLabel },
      { key: "status", label: "Estado", format: (v) => PROJECT_STATUS[v as keyof typeof PROJECT_STATUS]?.label ?? String(v) },
      { key: "region", label: "Región" },
      { key: "supervisor", label: "Supervisor" },
      { key: "startDate", label: "Inicio" },
      { key: "commitmentDate", label: "Compromiso" },
      { key: "expectedRevenue", label: "Ingresos", format: (v) => formatCLP(Number(v)) },
      { key: "estimatedCost", label: "Costos", format: (v) => formatCLP(Number(v)) },
      { key: "budget", label: "Presupuesto", format: (v) => formatCLP(Number(v)) },
    ],
    [clientLabel],
  );

  const clientSpecs: FieldSpec[] = useMemo(
    () => [
      { key: "name", label: "Razón social" },
      { key: "shortName", label: "Nombre corto" },
      { key: "segment", label: "Segmento" },
      { key: "contactName", label: "Contacto" },
      { key: "contactRole", label: "Cargo" },
      { key: "contactEmail", label: "Email" },
      { key: "contactPhone", label: "Teléfono" },
    ],
    [],
  );

  const crewSpecs: FieldSpec[] = useMemo(
    () => [
      { key: "name", label: "Nombre" },
      { key: "base", label: "Base" },
      { key: "region", label: "Región" },
      { key: "lead", label: "Jefe" },
      { key: "active", label: "Activa", format: (v) => (v ? "Sí" : "No") },
    ],
    [],
  );

  /* ------------------------------- Sitios -------------------------------- */
  const updateSite = useCallback<StoreValue["updateSite"]>(
    (id, patch, activity) => {
      const before = sitesRef.current.find((s) => s.id === id);
      setSites((prev) =>
        prev.map((s) => {
          if (s.id !== id) return s;
          const next: Site = { ...s, ...patch, lastUpdate: isoNow() };
          if (activity) {
            next.activity = [{ ...activity, id: `act-${Date.now()}`, at: isoNow() }, ...s.activity];
          }
          return next;
        }),
      );
      if (before) {
        const changes = diffChanges(
          before as unknown as Record<string, unknown>,
          { ...before, ...patch } as unknown as Record<string, unknown>,
          siteSpecs(),
        );
        const action: AuditAction = patch.status ? "estado" : patch.progress != null ? "avance" : "editar";
        record({
          action,
          entity: "sitio",
          entityId: id,
          entityName: before.name,
          changes,
          summary: changes.length ? summarizeChanges(changes) : (activity?.message ?? "Actualización de sitio"),
        });
      }
    },
    [record, siteSpecs],
  );

  const createSite = useCallback<StoreValue["createSite"]>(
    (s) => {
      setSites((prev) => [s, ...prev]);
      record({ action: "crear", entity: "sitio", entityId: s.id, entityName: s.name, summary: `Sitio creado (${s.id}).` });
    },
    [record],
  );

  const deleteSite = useCallback<StoreValue["deleteSite"]>(
    (id) => {
      const s = sitesRef.current.find((x) => x.id === id);
      setSites((prev) => prev.filter((x) => x.id !== id));
      if (s) record({ action: "eliminar", entity: "sitio", entityId: id, entityName: s.name, summary: `Sitio eliminado (${id}).` });
    },
    [record],
  );

  const addSiteActivity = useCallback<StoreValue["addSiteActivity"]>((id, entry) => {
    setSites((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, lastUpdate: isoNow(), activity: [{ ...entry, id: `act-${Date.now()}`, at: isoNow() }, ...s.activity] }
          : s,
      ),
    );
  }, []);

  /* ------------------------------ Proyectos ------------------------------ */
  const createProject = useCallback<StoreValue["createProject"]>(
    (p) => {
      setProjects((prev) => [p, ...prev]);
      record({ action: "crear", entity: "proyecto", entityId: p.id, entityName: p.name, summary: `Proyecto creado (${p.code}).` });
    },
    [record],
  );

  const updateProject = useCallback<StoreValue["updateProject"]>(
    (id, patch) => {
      const before = projectsRef.current.find((p) => p.id === id);
      setProjects((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
      if (before) {
        const changes = diffChanges(
          before as unknown as Record<string, unknown>,
          { ...before, ...patch } as unknown as Record<string, unknown>,
          projectSpecs(),
        );
        record({
          action: "editar",
          entity: "proyecto",
          entityId: id,
          entityName: before.name,
          changes,
          summary: changes.length ? summarizeChanges(changes) : "Actualización de proyecto",
        });
      }
    },
    [record, projectSpecs],
  );

  const deleteProject = useCallback<StoreValue["deleteProject"]>(
    (id) => {
      const p = projectsRef.current.find((x) => x.id === id);
      setProjects((prev) => prev.filter((x) => x.id !== id));
      if (p) record({ action: "eliminar", entity: "proyecto", entityId: id, entityName: p.name, summary: `Proyecto eliminado (${p.code}).` });
    },
    [record],
  );

  /* ------------------------------- Clientes ------------------------------ */
  const createClient = useCallback<StoreValue["createClient"]>(
    (c) => {
      setClients((prev) => [...prev, c]);
      record({ action: "crear", entity: "cliente", entityId: c.id, entityName: c.name, summary: `Cliente creado (${c.shortName}).` });
    },
    [record],
  );

  const updateClient = useCallback<StoreValue["updateClient"]>(
    (id, patch) => {
      const before = clientsRef.current.find((c) => c.id === id);
      setClients((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      if (before) {
        const changes = diffChanges(
          before as unknown as Record<string, unknown>,
          { ...before, ...patch } as unknown as Record<string, unknown>,
          clientSpecs,
        );
        record({
          action: "editar",
          entity: "cliente",
          entityId: id,
          entityName: before.name,
          changes,
          summary: changes.length ? summarizeChanges(changes) : "Actualización de cliente",
        });
      }
    },
    [record, clientSpecs],
  );

  const deleteClient = useCallback<StoreValue["deleteClient"]>(
    (id) => {
      const c = clientsRef.current.find((x) => x.id === id);
      setClients((prev) => prev.filter((x) => x.id !== id));
      if (c) record({ action: "eliminar", entity: "cliente", entityId: id, entityName: c.name, summary: `Cliente eliminado (${c.shortName}).` });
    },
    [record],
  );

  /* ------------------------------ Cuadrillas ----------------------------- */
  const createCrew = useCallback<StoreValue["createCrew"]>(
    (c) => {
      setCrews((prev) => [...prev, c]);
      record({ action: "crear", entity: "cuadrilla", entityId: c.id, entityName: c.name, summary: `Cuadrilla creada (${c.name}).` });
    },
    [record],
  );

  const updateCrew = useCallback<StoreValue["updateCrew"]>(
    (id, patch) => {
      const before = crewsRef.current.find((c) => c.id === id);
      setCrews((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));
      if (before) {
        const changes = diffChanges(
          before as unknown as Record<string, unknown>,
          { ...before, ...patch } as unknown as Record<string, unknown>,
          crewSpecs,
        );
        record({
          action: "editar",
          entity: "cuadrilla",
          entityId: id,
          entityName: before.name,
          changes,
          summary: changes.length ? summarizeChanges(changes) : "Actualización de cuadrilla",
        });
      }
    },
    [record, crewSpecs],
  );

  const deleteCrew = useCallback<StoreValue["deleteCrew"]>(
    (id) => {
      const c = crewsRef.current.find((x) => x.id === id);
      setCrews((prev) => prev.filter((x) => x.id !== id));
      if (c) record({ action: "eliminar", entity: "cuadrilla", entityId: id, entityName: c.name, summary: `Cuadrilla eliminada (${c.name}).` });
    },
    [record],
  );

  const resetData = useCallback(() => {
    const s = freshSeed();
    setSites(s.sites);
    setProjects(s.projects);
    setClients(s.clients);
    setCrews(s.crews);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* noop */
    }
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      sites,
      projects,
      clients,
      crews,
      currentUser,
      hydrated,
      canAdmin: hasPermission("gestionar_usuarios"),
      updateSite,
      createSite,
      deleteSite,
      addSiteActivity,
      createProject,
      updateProject,
      deleteProject,
      createClient,
      updateClient,
      deleteClient,
      createCrew,
      updateCrew,
      deleteCrew,
      resetData,
    }),
    [
      sites, projects, clients, crews, currentUser, hydrated, hasPermission,
      updateSite, createSite, deleteSite, addSiteActivity,
      createProject, updateProject, deleteProject,
      createClient, updateClient, deleteClient,
      createCrew, updateCrew, deleteCrew, resetData,
    ],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore debe usarse dentro de <StoreProvider>");
  return ctx;
}

export function useClientMap() {
  const { clients } = useStore();
  return useMemo(() => new Map(clients.map((c) => [c.id, c])), [clients]);
}

export function useCrewMap() {
  const { crews } = useStore();
  return useMemo(() => new Map(crews.map((c) => [c.id, c])), [crews]);
}

export function useProjectMap() {
  const { projects } = useStore();
  return useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
}
