/** Ubicaciones reales aproximadas de Chile para georreferenciar sitios. */
export interface GeoPoint {
  region: string;
  comuna: string;
  lat: number;
  lng: number;
  prefix: string; // prefijo de código de sitio
}

export const CHILE_LOCATIONS: GeoPoint[] = [
  { region: "Arica y Parinacota", comuna: "Arica", lat: -18.4783, lng: -70.3126, prefix: "ARI" },
  { region: "Tarapacá", comuna: "Iquique", lat: -20.2307, lng: -70.1357, prefix: "IQQ" },
  { region: "Tarapacá", comuna: "Alto Hospicio", lat: -20.2508, lng: -70.1108, prefix: "IQQ" },
  { region: "Antofagasta", comuna: "Antofagasta", lat: -23.6509, lng: -70.3975, prefix: "ANF" },
  { region: "Antofagasta", comuna: "Calama", lat: -22.4547, lng: -68.9294, prefix: "CJC" },
  { region: "Antofagasta", comuna: "Mejillones", lat: -23.0989, lng: -70.4497, prefix: "ANF" },
  { region: "Atacama", comuna: "Copiapó", lat: -27.3668, lng: -70.3323, prefix: "CPO" },
  { region: "Atacama", comuna: "Vallenar", lat: -28.5708, lng: -70.7597, prefix: "CPO" },
  { region: "Coquimbo", comuna: "La Serena", lat: -29.9027, lng: -71.2519, prefix: "LSC" },
  { region: "Coquimbo", comuna: "Coquimbo", lat: -29.9533, lng: -71.3436, prefix: "LSC" },
  { region: "Coquimbo", comuna: "Ovalle", lat: -30.6015, lng: -71.1998, prefix: "OVL" },
  { region: "Valparaíso", comuna: "Valparaíso", lat: -33.0472, lng: -71.6127, prefix: "VAP" },
  { region: "Valparaíso", comuna: "Viña del Mar", lat: -33.0245, lng: -71.5518, prefix: "VAP" },
  { region: "Valparaíso", comuna: "Quilpué", lat: -33.0472, lng: -71.4429, prefix: "VAP" },
  { region: "Valparaíso", comuna: "San Antonio", lat: -33.5928, lng: -71.6062, prefix: "SAI" },
  { region: "Metropolitana", comuna: "Santiago Centro", lat: -33.4489, lng: -70.6693, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Providencia", lat: -33.4262, lng: -70.6112, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Las Condes", lat: -33.4085, lng: -70.5674, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Maipú", lat: -33.511, lng: -70.758, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Puente Alto", lat: -33.6118, lng: -70.5756, prefix: "STGO" },
  { region: "Metropolitana", comuna: "La Florida", lat: -33.5227, lng: -70.5985, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Quilicura", lat: -33.3667, lng: -70.7333, prefix: "STGO" },
  { region: "Metropolitana", comuna: "Melipilla", lat: -33.6883, lng: -71.2156, prefix: "STGO" },
  { region: "O'Higgins", comuna: "Rancagua", lat: -34.1708, lng: -70.7444, prefix: "RGA" },
  { region: "O'Higgins", comuna: "San Fernando", lat: -34.5833, lng: -70.9889, prefix: "RGA" },
  { region: "Maule", comuna: "Talca", lat: -35.4264, lng: -71.6554, prefix: "TLC" },
  { region: "Maule", comuna: "Curicó", lat: -34.9854, lng: -71.2394, prefix: "CUR" },
  { region: "Maule", comuna: "Linares", lat: -35.8464, lng: -71.5931, prefix: "TLC" },
  { region: "Ñuble", comuna: "Chillán", lat: -36.6066, lng: -72.1034, prefix: "CHN" },
  { region: "Biobío", comuna: "Concepción", lat: -36.8201, lng: -73.0444, prefix: "CCP" },
  { region: "Biobío", comuna: "Talcahuano", lat: -36.7167, lng: -73.1167, prefix: "CCP" },
  { region: "Biobío", comuna: "Los Ángeles", lat: -37.4697, lng: -72.3537, prefix: "LSA" },
  { region: "Araucanía", comuna: "Temuco", lat: -38.7359, lng: -72.5904, prefix: "ZCO" },
  { region: "Araucanía", comuna: "Angol", lat: -37.7956, lng: -72.7161, prefix: "ZCO" },
  { region: "Los Ríos", comuna: "Valdivia", lat: -39.8142, lng: -73.2459, prefix: "ZAL" },
  { region: "Los Lagos", comuna: "Osorno", lat: -40.5738, lng: -73.1336, prefix: "ZOS" },
  { region: "Los Lagos", comuna: "Puerto Montt", lat: -41.4693, lng: -72.9424, prefix: "PMC" },
  { region: "Los Lagos", comuna: "Castro", lat: -42.4826, lng: -73.7625, prefix: "PMC" },
  { region: "Aysén", comuna: "Coyhaique", lat: -45.5712, lng: -72.0685, prefix: "GXQ" },
  { region: "Magallanes", comuna: "Punta Arenas", lat: -53.1638, lng: -70.9171, prefix: "PUQ" },
];

/** Regiones únicas en orden norte→sur para filtros. */
export const REGIONS: string[] = Array.from(
  new Set(CHILE_LOCATIONS.map((l) => l.region)),
);
