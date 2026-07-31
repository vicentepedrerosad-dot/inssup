"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Site } from "@/lib/types";
import { SITE_STATUS, WORK_TYPE } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Layers } from "lucide-react";
import type { Map as LeafletMap, CircleMarker, LayerGroup, TileLayer } from "leaflet";

const SAT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const STREETS_URL =
  "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

export function SitesMap({
  sites,
  onSelect,
  className,
  height = 460,
}: {
  sites: Site[];
  onSelect?: (site: Site) => void;
  className?: string;
  height?: number | string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const layerRef = useRef<LayerGroup | null>(null);
  const baseRef = useRef<TileLayer | null>(null);
  const labelsRef = useRef<TileLayer | null>(null);
  const selectRef = useRef(onSelect);
  const sitesRef = useRef(sites);
  const [base, setBase] = useState<"mapa" | "satelite">("mapa");
  useEffect(() => {
    selectRef.current = onSelect;
    sitesRef.current = sites;
  }, [onSelect, sites]);

  const renderMarkers = useCallback(async () => {
    const L = (await import("leaflet")).default;
    const layer = layerRef.current;
    if (!layer) return;
    layer.clearLayers();

    for (const site of sitesRef.current) {
      const meta = SITE_STATUS[site.status];
      const marker: CircleMarker = L.circleMarker([site.lat, site.lng], {
        radius: site.priority === "critica" ? 8 : 6,
        fillColor: meta.hex,
        color: "#ffffff",
        weight: 2,
        fillOpacity: 0.92,
      });

      marker.bindPopup(
        `<div style="min-width:180px">
          <div style="font-weight:600;font-size:13px;color:#0f172a">${escapeHtml(site.name)}</div>
          <div style="font-size:11px;color:#64748b;margin-bottom:6px">${site.id} · ${escapeHtml(site.comuna)}, ${escapeHtml(site.region)}</div>
          <div style="display:flex;align-items:center;gap:6px;font-size:12px">
            <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${meta.hex}"></span>
            <span style="color:#334155">${meta.label}</span>
            <span style="color:#94a3b8">·</span>
            <span style="color:#334155">${site.progress}%</span>
          </div>
          <div style="font-size:11px;color:#64748b;margin-top:2px">${WORK_TYPE[site.workType].label}</div>
        </div>`,
        { closeButton: false },
      );

      marker.on("mouseover", () => marker.openPopup());
      marker.on("click", () => selectRef.current?.(site));
      marker.addTo(layer);
    }
  }, []);

  // Inicializar el mapa una sola vez (carga diferida de Leaflet).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [-35.6, -71.5],
        zoom: 4,
        zoomControl: true,
        scrollWheelZoom: false,
        attributionControl: true,
        minZoom: 3,
        maxZoom: 18,
      });

      baseRef.current = L.tileLayer(STREETS_URL, {
        attribution: '&copy; <a href="https://carto.com/">CARTO</a> · &copy; OpenStreetMap',
        subdomains: "abcd",
        maxZoom: 18,
        className: "lite-tiles",
      }).addTo(map);

      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      map.getContainer().style.background = "#e2e8f0";
      setTimeout(() => map.invalidateSize(), 100);
      renderMarkers();
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
    };
  }, [renderMarkers]);

  // Redibujar marcadores cuando cambian los sitios.
  useEffect(() => {
    renderMarkers();
  }, [sites, renderMarkers]);

  const switchBase = useCallback(async (next: "mapa" | "satelite") => {
    const L = (await import("leaflet")).default;
    const map = mapRef.current;
    if (!map || !baseRef.current) return;
    map.removeLayer(baseRef.current);
    if (labelsRef.current) {
      map.removeLayer(labelsRef.current);
      labelsRef.current = null;
    }
    if (next === "satelite") {
      baseRef.current = L.tileLayer(SAT_URL, {
        attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 18,
      }).addTo(map);
      labelsRef.current = L.tileLayer(LABELS_URL, { maxZoom: 18 }).addTo(map);
    } else {
      baseRef.current = L.tileLayer(STREETS_URL, {
        attribution: "&copy; CARTO · OpenStreetMap",
        subdomains: "abcd",
        maxZoom: 18,
        className: "lite-tiles",
      }).addTo(map);
    }
    baseRef.current.bringToBack();
    setBase(next);
  }, []);

  return (
    <div className="relative" style={{ height, width: "100%" }}>
      <div
        ref={containerRef}
        className={className}
        style={{ height: "100%", width: "100%" }}
        role="application"
        aria-label="Mapa de sitios de telecomunicaciones en Chile"
      />
      <div className="absolute right-2.5 top-2.5 z-[500] flex overflow-hidden rounded-lg border border-white/50 shadow-md">
        <button
          type="button"
          onClick={() => switchBase("mapa")}
          className={cn(
            "px-2.5 py-1.5 text-xs font-medium transition-colors",
            base === "mapa" ? "bg-brand-600 text-white" : "bg-white/90 text-slate-700 hover:bg-white",
          )}
        >
          Mapa
        </button>
        <button
          type="button"
          onClick={() => switchBase("satelite")}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium transition-colors",
            base === "satelite" ? "bg-brand-600 text-white" : "bg-white/90 text-slate-700 hover:bg-white",
          )}
        >
          <Layers className="size-3.5" /> Satélite
        </button>
      </div>
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
