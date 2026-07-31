"use client";

import "leaflet/dist/leaflet.css";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { cn } from "@/lib/utils";
import { Search, Crosshair, Layers, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";

/** Imagen satelital actual de Esri (World Imagery) — sin API key. */
const SAT_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}";
/** Etiquetas (calles, lugares) para sobreponer sobre el satélite. */
const LABELS_URL =
  "https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}";
const STREETS_URL =
  "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

const PIN_SVG = `<svg width="34" height="44" viewBox="0 0 34 44" xmlns="http://www.w3.org/2000/svg">
  <path d="M17 43C17 43 32 27 32 16A15 15 0 1 0 2 16C2 27 17 43 17 43Z" fill="#0e7490" stroke="#fff" stroke-width="2.5"/>
  <circle cx="17" cy="16" r="5.5" fill="#fff"/></svg>`;

export function LocationPicker({
  lat,
  lng,
  onChange,
  height = 320,
}: {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
  height?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const baseRef = useRef<TileLayer | null>(null);
  const labelsRef = useRef<TileLayer | null>(null);
  const onChangeRef = useRef(onChange);
  const [base, setBase] = useState<"satelite" | "mapa">("satelite");
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;

      const map = L.map(containerRef.current, {
        center: [lat, lng],
        zoom: 16,
        scrollWheelZoom: true,
        zoomControl: true,
      });
      mapRef.current = map;

      baseRef.current = L.tileLayer(SAT_URL, {
        attribution: "Imagery &copy; Esri, Maxar, Earthstar Geographics",
        maxZoom: 19,
      }).addTo(map);
      labelsRef.current = L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(map);

      const pin = L.divIcon({
        className: "",
        html: PIN_SVG,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
      });
      const marker = L.marker([lat, lng], { draggable: true, icon: pin }).addTo(map);
      markerRef.current = marker;

      marker.on("dragend", () => {
        const p = marker.getLatLng();
        onChangeRef.current(p.lat, p.lng);
      });
      map.on("click", (e) => {
        marker.setLatLng(e.latlng);
        onChangeRef.current(e.latlng.lat, e.latlng.lng);
      });

      setTimeout(() => map.invalidateSize(), 120);
    })();

    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sincronizar el pin cuando cambian las coords desde fuera (ej. cambio de región).
  useEffect(() => {
    const m = markerRef.current;
    const map = mapRef.current;
    if (!m || !map) return;
    const cur = m.getLatLng();
    if (Math.abs(cur.lat - lat) > 1e-6 || Math.abs(cur.lng - lng) > 1e-6) {
      m.setLatLng([lat, lng]);
      map.setView([lat, lng], map.getZoom() < 13 ? 15 : map.getZoom());
    }
  }, [lat, lng]);

  const switchBase = useCallback(async (next: "satelite" | "mapa") => {
    const L = (await import("leaflet")).default;
    const map = mapRef.current;
    if (!map || !baseRef.current) return;
    map.removeLayer(baseRef.current);
    if (labelsRef.current) map.removeLayer(labelsRef.current);
    if (next === "satelite") {
      baseRef.current = L.tileLayer(SAT_URL, { attribution: "Imagery &copy; Esri", maxZoom: 19 }).addTo(map);
      labelsRef.current = L.tileLayer(LABELS_URL, { maxZoom: 19 }).addTo(map);
    } else {
      baseRef.current = L.tileLayer(STREETS_URL, { attribution: "&copy; CARTO · OSM", subdomains: "abcd", maxZoom: 19 }).addTo(map);
      labelsRef.current = null;
    }
    setBase(next);
  }, []);

  const locateMe = () => {
    if (!navigator.geolocation) return toast.error("Geolocalización no disponible.");
    toast.loading("Obteniendo tu ubicación…", { id: "geo" });
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        toast.dismiss("geo");
        const { latitude, longitude } = pos.coords;
        markerRef.current?.setLatLng([latitude, longitude]);
        mapRef.current?.setView([latitude, longitude], 17);
        onChangeRef.current(latitude, longitude);
        toast.success("Ubicación GPS aplicada");
      },
      () => {
        toast.dismiss("geo");
        toast.error("No se pudo obtener la ubicación (permiso denegado).");
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=cl&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      const data = (await res.json()) as { lat: string; lon: string; display_name: string }[];
      if (!data.length) return toast.error("Sin resultados para esa dirección.");
      const { lat: la, lon: lo } = data[0];
      const nlat = parseFloat(la);
      const nlng = parseFloat(lo);
      markerRef.current?.setLatLng([nlat, nlng]);
      mapRef.current?.setView([nlat, nlng], 17);
      onChangeRef.current(nlat, nlng);
      toast.success("Ubicación encontrada", { description: data[0].display_name.slice(0, 60) });
    } catch {
      toast.error("No se pudo buscar la dirección.");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <form onSubmit={search} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar dirección o lugar en Chile…"
            className="pl-8.5"
          />
        </div>
        <Button type="submit" variant="outline" size="sm" disabled={searching}>
          {searching ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Buscar
        </Button>
      </form>

      <div className="relative overflow-hidden rounded-xl border border-slate-200">
        <div ref={containerRef} style={{ height, width: "100%" }} />

        {/* Controles superpuestos */}
        <div className="absolute right-2 top-2 z-[500] flex flex-col gap-1.5">
          <div className="flex overflow-hidden rounded-lg border border-white/40 shadow-md">
            <button
              type="button"
              onClick={() => switchBase("satelite")}
              className={cn("flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium", base === "satelite" ? "bg-brand-600 text-white" : "bg-white/90 text-slate-700")}
            >
              <Layers className="size-3.5" /> Satélite
            </button>
            <button
              type="button"
              onClick={() => switchBase("mapa")}
              className={cn("px-2.5 py-1.5 text-xs font-medium", base === "mapa" ? "bg-brand-600 text-white" : "bg-white/90 text-slate-700")}
            >
              Mapa
            </button>
          </div>
          <button
            type="button"
            onClick={locateMe}
            className="flex items-center justify-center gap-1 rounded-lg bg-white/90 px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-md hover:bg-white"
          >
            <Crosshair className="size-3.5" /> Mi ubicación
          </button>
        </div>

        <div className="pointer-events-none absolute bottom-2 left-2 z-[500] flex items-center gap-1.5 rounded-lg bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-white">
          <MapPin className="size-3.5 text-brand-300" />
          <span className="tabular">{lat.toFixed(5)}, {lng.toFixed(5)}</span>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Haz clic en el mapa o arrastra el pin para ubicar el sitio con precisión sobre la imagen satelital real.
      </p>
    </div>
  );
}
