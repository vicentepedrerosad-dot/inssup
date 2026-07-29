import type {
  Project,
  Site,
  SiteStatus,
  Priority,
  WorkType,
  ChecklistItem,
  Evidence,
  ActivityLog,
} from "../types";
import { CHILE_LOCATIONS, type GeoPoint } from "./geo";
import { CREWS, CLIENTS } from "./entities";

/* --------------------------- RNG determinístico --------------------------- */
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = mulberry32(20260727);
const pick = <T>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const range = (min: number, max: number) => min + rnd() * (max - min);
const rangeInt = (min: number, max: number) => Math.floor(range(min, max + 1));
const chance = (p: number) => rnd() < p;

/* ------------------------------- Fechas ----------------------------------- */
const TODAY = new Date("2026-07-27T12:00:00");
function isoOffset(days: number, jitterHours = 0): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  d.setHours(8 + rangeInt(0, 9), rangeInt(0, 59) + jitterHours, 0, 0);
  return d.toISOString();
}
function dateOnly(days: number): string {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/* --------------------------- Pools descriptivos --------------------------- */
const SITE_DESCRIPTORS = [
  "Cerro Radar",
  "Mall Plaza",
  "Hospital Regional",
  "Terminal de Buses",
  "Ruta 5 km",
  "Estadio Municipal",
  "Puerto Terminal",
  "Cerro Alto",
  "Zona Industrial",
  "Costanera Centro",
  "Aeropuerto",
  "Universidad Campus",
  "Barrio Cívico",
  "Parque Industrial",
  "Edificio Corporativo",
  "Rotonda Norte",
  "Sector Minero",
  "Caleta Pesquera",
  "Villa El Sol",
  "Autopista Central km",
];

const OBSERVATIONS = [
  "Acceso al sitio requiere coordinación con guardia de la comunidad.",
  "Torre en buen estado estructural. Se recomienda pintura anticorrosiva próximo ciclo.",
  "Cliente solicita ventana de trabajo nocturna por tránsito.",
  "Energía respaldada con banco de baterías operativo al 100%.",
  "Se detecta interferencia menor en sector 2, en observación.",
  "Sitio de alta prioridad por cobertura hospitalaria.",
  "Materiales entregados en bodega regional, listos para despacho.",
  "Requiere permiso municipal para izaje con grúa.",
  "",
];

const BLOCKERS = [
  "Falta autorización municipal para trabajos en altura.",
  "Retraso en despacho de antenas desde bodega central.",
  "Condiciones climáticas adversas impiden izaje.",
  "Corte de suministro eléctrico en el sector, pendiente reposición.",
  "Acceso bloqueado por manifestación en la comunidad.",
  "Espera de aprobación de diseño RF por parte del cliente.",
];

const CHECKLIST_BY_TYPE: Record<WorkType, string[]> = {
  instalacion: [
    "Inspección estructural de torre",
    "Montaje de antenas y RRU",
    "Tendido y conexión de feeders/fibra",
    "Instalación de sistema de energía",
    "Puesta a tierra y pararrayos",
    "Etiquetado y ordenamiento de cables",
    "Registro fotográfico completo",
  ],
  puesta_en_marcha: [
    "Verificación de energización",
    "Integración a OSS/BSS",
    "Pruebas de throughput 4G/5G",
    "Ajuste de tilt y azimut",
    "Validación de KPIs con NOC",
  ],
  site_survey: [
    "Levantamiento topográfico",
    "Registro de coordenadas GPS",
    "Fotografías 360° del emplazamiento",
    "Medición de altura disponible",
    "Evaluación de línea de vista",
  ],
  mmoo: [
    "Alineación de antenas microondas",
    "Medición de RSL",
    "Configuración de radios",
    "Pruebas de BER",
    "Certificación del enlace",
  ],
  mantenimiento_preventivo: [
    "Revisión de sistema de energía",
    "Ajuste de conectores",
    "Limpieza de gabinetes",
    "Prueba de alarmas",
    "Informe de estado general",
  ],
  mantenimiento_correctivo: [
    "Diagnóstico de falla",
    "Reemplazo de componente",
    "Prueba funcional post-reparación",
    "Cierre de ticket con NOC",
  ],
  emergencia_24_7: [
    "Confirmación de causa raíz",
    "Restablecimiento de servicio",
    "Verificación de KPIs",
    "Reporte de incidente",
  ],
  readecuacion: [
    "Retiro de equipamiento obsoleto",
    "Refuerzo estructural",
    "Instalación de nuevo hardware",
    "Reintegración a la red",
    "Certificación final",
  ],
};

/* ---------------------------- Definición proyectos ------------------------ */
interface ProjTemplate {
  code: string;
  name: string;
  clientId: string;
  status: Project["status"];
  region: string;
  regionsPool: string[]; // regiones donde se distribuyen los sitios
  workTypes: WorkType[];
  supervisor: string;
  startOffset: number;
  commitOffset: number;
  siteCount: number;
  description: string;
}

const TEMPLATES: ProjTemplate[] = [
  {
    code: "ENT-5G-RM2",
    name: "Densificación 5G RM · Fase 2",
    clientId: "cl-entel",
    status: "en_curso",
    region: "Metropolitana",
    regionsPool: ["Metropolitana"],
    workTypes: ["instalacion", "puesta_en_marcha", "readecuacion"],
    supervisor: "Rodrigo Fuentes",
    startOffset: -95,
    commitOffset: 40,
    siteCount: 8,
    description:
      "Densificación de red 5G NR en la Región Metropolitana: nuevos sitios small-cell y upgrade de macro existentes para capacidad en zonas de alto tráfico.",
  },
  {
    code: "ENT-SS-N5",
    name: "Site Survey Ruta 5 Norte",
    clientId: "cl-entel",
    status: "en_curso",
    region: "Coquimbo",
    regionsPool: ["Atacama", "Coquimbo"],
    workTypes: ["site_survey"],
    supervisor: "Carolina Espinoza",
    startOffset: -40,
    commitOffset: 25,
    siteCount: 5,
    description:
      "Levantamiento de sitios candidatos a lo largo de la Ruta 5 Norte para cierre de brechas de cobertura en corredor logístico.",
  },
  {
    code: "MOV-LTE-BB",
    name: "Modernización LTE Biobío",
    clientId: "cl-movistar",
    status: "en_riesgo",
    region: "Biobío",
    regionsPool: ["Biobío", "Ñuble"],
    workTypes: ["instalacion", "puesta_en_marcha", "readecuacion"],
    supervisor: "Marcelo Bravo",
    startOffset: -80,
    commitOffset: -5,
    siteCount: 7,
    description:
      "Swap y modernización de equipamiento LTE en la macrozona Biobío-Ñuble. Proyecto con hitos comprometidos vencidos en curso de recuperación.",
  },
  {
    code: "MOV-MW-ARC",
    name: "Enlaces MMOO Araucanía",
    clientId: "cl-movistar",
    status: "en_curso",
    region: "Araucanía",
    regionsPool: ["Araucanía", "Los Ríos"],
    workTypes: ["mmoo", "instalacion"],
    supervisor: "Francisca Tapia",
    startOffset: -55,
    commitOffset: 30,
    siteCount: 5,
    description:
      "Despliegue de enlaces de microondas para backhaul de sitios rurales en la Araucanía y Los Ríos.",
  },
  {
    code: "WOM-4G-NG",
    name: "Expansión 4G Norte Grande",
    clientId: "cl-wom",
    status: "en_curso",
    region: "Antofagasta",
    regionsPool: ["Antofagasta", "Tarapacá", "Arica y Parinacota"],
    workTypes: ["instalacion", "puesta_en_marcha", "mmoo"],
    supervisor: "Andrés Villalobos",
    startOffset: -70,
    commitOffset: 35,
    siteCount: 7,
    description:
      "Expansión de cobertura 4G en el Norte Grande, priorizando ciudades intermedias y corredores mineros.",
  },
  {
    code: "WOM-RD-VAP",
    name: "Readecuación Sitios Valparaíso",
    clientId: "cl-wom",
    status: "planificacion",
    region: "Valparaíso",
    regionsPool: ["Valparaíso"],
    workTypes: ["readecuacion", "site_survey"],
    supervisor: "Carolina Espinoza",
    startOffset: -8,
    commitOffset: 55,
    siteCount: 4,
    description:
      "Readecuación estructural y de energía en sitios de la región de Valparaíso previa a upgrade de capacidad.",
  },
  {
    code: "CVT-MP-RM",
    name: "Mantenimiento Preventivo Anual RM",
    clientId: "cl-clarovtr",
    status: "en_curso",
    region: "Metropolitana",
    regionsPool: ["Metropolitana", "O'Higgins"],
    workTypes: ["mantenimiento_preventivo", "mantenimiento_correctivo"],
    supervisor: "Rodrigo Fuentes",
    startOffset: -120,
    commitOffset: 60,
    siteCount: 6,
    description:
      "Programa anual de mantenimiento preventivo de la red ClaroVTR en la macrozona central, con atención correctiva asociada.",
  },
  {
    code: "CVT-PEM-LL",
    name: "Puesta en Marcha Los Lagos",
    clientId: "cl-clarovtr",
    status: "en_riesgo",
    region: "Los Lagos",
    regionsPool: ["Los Lagos"],
    workTypes: ["puesta_en_marcha", "instalacion"],
    supervisor: "Francisca Tapia",
    startOffset: -50,
    commitOffset: -3,
    siteCount: 4,
    description:
      "Integración y puesta en servicio de nuevos sitios en Los Lagos. Afectado por logística austral y clima.",
  },
  {
    code: "TCH-INS-CS",
    name: "Instalación Torres Centro-Sur",
    clientId: "cl-torres",
    status: "en_curso",
    region: "Maule",
    regionsPool: ["Maule", "Ñuble", "O'Higgins"],
    workTypes: ["instalacion", "mmoo"],
    supervisor: "Marcelo Bravo",
    startOffset: -60,
    commitOffset: 45,
    siteCount: 5,
    description:
      "Construcción e instalación de nuevas torres de infraestructura compartida en la macrozona centro-sur.",
  },
  {
    code: "ATC-COL-CQ",
    name: "Colocation Upgrade Coquimbo",
    clientId: "cl-atc",
    status: "completado",
    region: "Coquimbo",
    regionsPool: ["Coquimbo"],
    workTypes: ["readecuacion", "instalacion"],
    supervisor: "Carolina Espinoza",
    startOffset: -140,
    commitOffset: -20,
    siteCount: 4,
    description:
      "Adecuación de sitios para nuevos colocation en la región de Coquimbo. Proyecto cerrado y recepcionado.",
  },
  {
    code: "COD-FAE-N",
    name: "Telecom Faena Norte",
    clientId: "cl-codelco",
    status: "en_curso",
    region: "Antofagasta",
    regionsPool: ["Antofagasta"],
    workTypes: ["instalacion", "mmoo", "mantenimiento_correctivo"],
    supervisor: "Andrés Villalobos",
    startOffset: -75,
    commitOffset: 50,
    siteCount: 4,
    description:
      "Infraestructura de telecomunicaciones críticas para operación de faena minera: enlaces privados y redundancia.",
  },
  {
    code: "ENT-E247",
    name: "Emergencias 24/7 Nacional",
    clientId: "cl-entel",
    status: "en_curso",
    region: "Metropolitana",
    regionsPool: ["Metropolitana", "Valparaíso", "Biobío", "Los Lagos"],
    workTypes: ["emergencia_24_7", "mantenimiento_correctivo"],
    supervisor: "Rodrigo Fuentes",
    startOffset: -180,
    commitOffset: 120,
    siteCount: 5,
    description:
      "Contrato de respuesta ante fallas críticas 24/7 a nivel nacional con SLA de restablecimiento agresivo.",
  },
];

/* --------------------------- Rangos por tipo de trabajo ------------------- */
const WT_ECON: Record<WorkType, { bMin: number; bMax: number; hMin: number; hMax: number }> = {
  instalacion: { bMin: 6_000_000, bMax: 14_000_000, hMin: 40, hMax: 90 },
  puesta_en_marcha: { bMin: 3_000_000, bMax: 7_000_000, hMin: 20, hMax: 45 },
  site_survey: { bMin: 1_200_000, bMax: 2_800_000, hMin: 8, hMax: 20 },
  mmoo: { bMin: 8_000_000, bMax: 20_000_000, hMin: 60, hMax: 140 },
  mantenimiento_preventivo: { bMin: 900_000, bMax: 2_200_000, hMin: 6, hMax: 16 },
  mantenimiento_correctivo: { bMin: 1_500_000, bMax: 4_000_000, hMin: 10, hMax: 28 },
  emergencia_24_7: { bMin: 2_000_000, bMax: 6_000_000, hMin: 8, hMax: 30 },
  readecuacion: { bMin: 4_000_000, bMax: 9_000_000, hMin: 30, hMax: 60 },
};

const PRIORITIES: Priority[] = ["baja", "media", "alta", "critica"];

function crewForRegion(region: string, workType: WorkType): string {
  if (workType === "emergencia_24_7") return "cw-emergencia";
  const match = CREWS.find(
    (c) => c.region === region && c.specialties.includes(workType),
  );
  if (match) return match.id;
  const regionMatch = CREWS.find((c) => c.region === region);
  if (regionMatch) return regionMatch.id;
  return pick(CREWS.filter((c) => c.id !== "cw-emergencia")).id;
}

function makeChecklist(workType: WorkType, progress: number): ChecklistItem[] {
  const items = CHECKLIST_BY_TYPE[workType];
  const doneCount = Math.round((progress / 100) * items.length);
  return items.map((label, i) => ({
    id: `chk-${i}`,
    label,
    done: i < doneCount,
  }));
}

function makeEvidence(
  workType: WorkType,
  progress: number,
  author: string,
): Evidence[] {
  const n = Math.min(6, Math.round((progress / 100) * 5) + (progress > 0 ? 1 : 0));
  const labels = [
    "Vista general del sitio",
    "Montaje de antenas",
    "Sistema de energía",
    "Puesta a tierra",
    "Tendido de cables",
    "Certificación final",
  ];
  const out: Evidence[] = [];
  for (let i = 0; i < n; i++) {
    out.push({
      id: `ev-${i}`,
      label: labels[i] ?? `Evidencia ${i + 1}`,
      type: i === n - 1 && progress === 100 ? "documento" : "foto",
      hue: rangeInt(150, 210),
      uploadedAt: isoOffset(-rangeInt(1, 20)),
      uploadedBy: author,
    });
  }
  return out;
}

let siteSeq = 100;
let projSites: Site[] = [];

function makeSite(t: ProjTemplate, statusHint: SiteStatus): Site {
  const region = pick(t.regionsPool);
  const locPool = CHILE_LOCATIONS.filter((l) => l.region === region);
  const loc: GeoPoint = locPool.length ? pick(locPool) : pick(CHILE_LOCATIONS);
  const workType = pick(t.workTypes);
  const status = statusHint;
  const crewId = status === "pendiente" && chance(0.5)
    ? null
    : crewForRegion(loc.region, workType);
  const crew = CREWS.find((c) => c.id === crewId);
  const author = crew?.lead ?? t.supervisor;

  const econ = WT_ECON[workType];
  const budget = Math.round(range(econ.bMin, econ.bMax) / 100_000) * 100_000;
  const cost = Math.round((budget * range(0.55, 0.74)) / 100_000) * 100_000;

  let progress = 0;
  let scheduled = 0;
  let sla = 0;
  let actualStart: string | null = null;
  let actualEnd: string | null = null;
  let hoursWorked = 0;
  let blocker: string | null = null;
  let lastUpdateOffset = 0;
  let billed = false;

  switch (status) {
    case "terminado": {
      scheduled = -rangeInt(20, 75);
      sla = scheduled + rangeInt(10, 25);
      actualStart = isoOffset(scheduled + rangeInt(0, 3));
      actualEnd = isoOffset(scheduled + rangeInt(6, 22));
      progress = 100;
      hoursWorked = Math.round(range(econ.hMin, econ.hMax));
      lastUpdateOffset = scheduled + rangeInt(6, 22);
      billed = chance(0.6);
      break;
    }
    case "ejecucion": {
      scheduled = -rangeInt(4, 22);
      sla = rangeInt(3, 22);
      actualStart = isoOffset(scheduled + rangeInt(0, 3));
      progress = rangeInt(30, 85);
      hoursWorked = Math.round(range(econ.hMin * 0.4, econ.hMax * 0.8));
      lastUpdateOffset = -rangeInt(0, 4);
      break;
    }
    case "atrasado": {
      scheduled = -rangeInt(18, 45);
      sla = -rangeInt(2, 22); // compromiso vencido
      actualStart = isoOffset(scheduled + rangeInt(0, 5));
      progress = rangeInt(20, 78);
      hoursWorked = Math.round(range(econ.hMin * 0.3, econ.hMax * 0.7));
      if (chance(0.7)) blocker = pick(BLOCKERS);
      lastUpdateOffset = -rangeInt(3, 14); // suele estar más desactualizado
      break;
    }
    case "programado": {
      scheduled = rangeInt(3, 45);
      sla = scheduled + rangeInt(10, 30);
      progress = 0;
      lastUpdateOffset = -rangeInt(1, 8);
      break;
    }
    case "pendiente":
    default: {
      scheduled = rangeInt(5, 60);
      sla = scheduled + rangeInt(15, 40);
      progress = 0;
      lastUpdateOffset = -rangeInt(2, 15);
      break;
    }
  }

  siteSeq += 1;
  const code = `${loc.prefix}-${String(siteSeq).padStart(4, "0")}`;
  const priority: Priority =
    status === "atrasado"
      ? pick(["alta", "critica", "critica"])
      : workType === "emergencia_24_7"
        ? "critica"
        : pick(PRIORITIES);

  const activity: ActivityLog[] = buildActivity({
    status,
    author,
    supervisor: t.supervisor,
    progress,
    scheduled,
    lastUpdateOffset,
    blocker,
    workType,
  });

  return {
    id: code,
    name: `${loc.comuna} · ${pick(SITE_DESCRIPTORS)}${
      chance(0.4) ? " " + rangeInt(2, 88) : ""
    }`,
    clientId: t.clientId,
    projectId: t.code,
    region: loc.region,
    comuna: loc.comuna,
    lat: loc.lat + range(-0.05, 0.05),
    lng: loc.lng + range(-0.05, 0.05),
    workType,
    status,
    priority,
    scheduledDate: dateOnly(scheduled),
    slaDate: dateOnly(sla),
    actualStart,
    actualEnd,
    progress,
    crewId,
    supervisor: t.supervisor,
    hoursWorked,
    budget,
    cost,
    billed,
    checklist: makeChecklist(workType, progress),
    evidence: makeEvidence(workType, progress, author),
    observations: pick(OBSERVATIONS),
    blocker,
    lastUpdate: isoOffset(lastUpdateOffset),
    activity,
  };
}

function buildActivity(o: {
  status: SiteStatus;
  author: string;
  supervisor: string;
  progress: number;
  scheduled: number;
  lastUpdateOffset: number;
  blocker: string | null;
  workType: WorkType;
}): ActivityLog[] {
  const logs: ActivityLog[] = [];
  let seq = 0;
  const add = (
    offset: number,
    author: string,
    role: ActivityLog["role"],
    message: string,
    kind: ActivityLog["kind"],
  ) => {
    seq += 1;
    logs.push({ id: `act-${seq}`, at: isoOffset(offset), author, role, message, kind });
  };

  add(o.scheduled - rangeInt(1, 5), o.supervisor, "supervisor", "Sitio creado y asignado a cuadrilla.", "creacion");
  if (o.status !== "pendiente" && o.status !== "programado") {
    add(o.scheduled, o.author, "jefe_cuadrilla", "Cuadrilla en sitio. Inicio de faena.", "estado");
    add(o.scheduled + rangeInt(1, 3), o.author, "tecnico", `Avance registrado: ${Math.min(o.progress, 45)}%.`, "avance");
  }
  if (o.blocker) {
    add(o.lastUpdateOffset, o.author, "jefe_cuadrilla", `Bloqueo reportado: ${o.blocker}`, "bloqueo");
  }
  if (o.status === "ejecucion") {
    add(o.lastUpdateOffset, o.author, "tecnico", `Avance actualizado a ${o.progress}%.`, "avance");
  }
  if (o.status === "terminado") {
    add(o.lastUpdateOffset, o.author, "jefe_cuadrilla", "Trabajo finalizado. Evidencias cargadas y checklist completo.", "estado");
  }
  return logs.reverse();
}

/* ------------------------- Distribución de estados ------------------------ */
function statusesFor(t: ProjTemplate): SiteStatus[] {
  const n = t.siteCount;
  const out: SiteStatus[] = [];
  if (t.status === "completado") {
    for (let i = 0; i < n; i++) out.push("terminado");
    return out;
  }
  if (t.status === "planificacion") {
    for (let i = 0; i < n; i++) out.push(i < n - 1 ? "programado" : "pendiente");
    return out;
  }
  // en_curso / en_riesgo: mezcla ponderada
  const riesgo = t.status === "en_riesgo";
  const weights: [SiteStatus, number][] = riesgo
    ? [
        ["terminado", 0.2],
        ["ejecucion", 0.28],
        ["atrasado", 0.34],
        ["programado", 0.1],
        ["pendiente", 0.08],
      ]
    : [
        ["terminado", 0.34],
        ["ejecucion", 0.3],
        ["atrasado", 0.12],
        ["programado", 0.14],
        ["pendiente", 0.1],
      ];
  for (let i = 0; i < n; i++) {
    const r = rnd();
    let acc = 0;
    let chosen: SiteStatus = "ejecucion";
    for (const [s, w] of weights) {
      acc += w;
      if (r <= acc) {
        chosen = s;
        break;
      }
    }
    out.push(chosen);
  }
  // garantizar al menos 1 atrasado en proyectos en riesgo
  if (riesgo && !out.includes("atrasado")) out[0] = "atrasado";
  return out;
}

/* ------------------------------ Construcción ------------------------------ */
function build(): { projects: Project[]; sites: Site[] } {
  siteSeq = 100;
  projSites = [];
  const projects: Project[] = [];

  for (const t of TEMPLATES) {
    const statuses = statusesFor(t);
    const sites = statuses.map((s) => makeSite(t, s));
    projSites.push(...sites);

    const expectedRevenue = sites.reduce((a, s) => a + s.budget, 0);
    const estimatedCost = sites.reduce((a, s) => a + s.cost, 0);
    const budget = Math.round(expectedRevenue * range(1.02, 1.12));

    projects.push({
      id: t.code,
      code: t.code,
      name: t.name,
      clientId: t.clientId,
      status: t.status,
      startDate: dateOnly(t.startOffset),
      commitmentDate: dateOnly(t.commitOffset),
      budget,
      expectedRevenue,
      estimatedCost,
      supervisor: t.supervisor,
      region: t.region,
      description: t.description,
      activity: [
        {
          id: "pa-1",
          at: isoOffset(t.startOffset - 2),
          author: t.supervisor,
          role: "supervisor",
          message: "Proyecto creado y planificación inicial cargada.",
          kind: "creacion",
        },
        {
          id: "pa-2",
          at: isoOffset(t.startOffset),
          author: t.supervisor,
          role: "supervisor",
          message: `Kickoff con ${CLIENTS.find((c) => c.id === t.clientId)?.shortName}. Cronograma confirmado.`,
          kind: "nota",
        },
      ],
    });
  }

  return { projects, sites: projSites };
}

const built = build();
export const SEED_PROJECTS: Project[] = built.projects;
export const SEED_SITES: Site[] = built.sites;
