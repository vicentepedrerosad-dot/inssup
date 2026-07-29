import type { Site, SiteStatus, WorkType } from "./types";

export interface SiteFilter {
  search: string;
  clientId: string; // "" = todos
  region: string;
  projectId: string;
  status: SiteStatus | "";
  crewId: string;
  workType: WorkType | "";
  dateFrom: string; // ISO date (scheduledDate >=)
  dateTo: string;
}

export const EMPTY_FILTER: SiteFilter = {
  search: "",
  clientId: "",
  region: "",
  projectId: "",
  status: "",
  crewId: "",
  workType: "",
  dateFrom: "",
  dateTo: "",
};

export function applySiteFilter(sites: Site[], f: SiteFilter): Site[] {
  const q = f.search.trim().toLowerCase();
  return sites.filter((s) => {
    if (f.clientId && s.clientId !== f.clientId) return false;
    if (f.region && s.region !== f.region) return false;
    if (f.projectId && s.projectId !== f.projectId) return false;
    if (f.status && s.status !== f.status) return false;
    if (f.crewId && s.crewId !== f.crewId) return false;
    if (f.workType && s.workType !== f.workType) return false;
    if (f.dateFrom && s.scheduledDate < f.dateFrom) return false;
    if (f.dateTo && s.scheduledDate > f.dateTo) return false;
    if (q) {
      const hay = `${s.id} ${s.name} ${s.comuna} ${s.region} ${s.supervisor}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}

export function activeFilterCount(f: SiteFilter): number {
  let n = 0;
  if (f.clientId) n++;
  if (f.region) n++;
  if (f.projectId) n++;
  if (f.status) n++;
  if (f.crewId) n++;
  if (f.workType) n++;
  if (f.dateFrom) n++;
  if (f.dateTo) n++;
  return n;
}
