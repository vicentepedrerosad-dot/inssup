import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INSSUP · Control Operacional",
    short_name: "INSSUP",
    description:
      "Plataforma operacional para gestión de sitios de telecomunicaciones en Chile: instalaciones, mantenimiento, MMOO y emergencias 24/7.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    display_override: ["standalone", "minimal-ui"],
    orientation: "portrait",
    background_color: "#0b1120",
    theme_color: "#0b1120",
    lang: "es-CL",
    dir: "ltr",
    categories: ["business", "productivity", "utilities"],
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icons/maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    shortcuts: [
      { name: "Dashboard", short_name: "Dashboard", url: "/" },
      { name: "Sitios", short_name: "Sitios", url: "/sitios" },
      { name: "Terreno", short_name: "Terreno", url: "/terreno" },
      { name: "Administración", short_name: "Admin", url: "/admin" },
    ],
  };
}
