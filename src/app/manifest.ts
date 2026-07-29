import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "INSSUP · Control Operacional",
    short_name: "INSSUP",
    description:
      "Plataforma operacional para gestión de sitios de telecomunicaciones en Chile: instalaciones, mantenimiento, MMOO y emergencias 24/7.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0b2933",
    theme_color: "#0b2933",
    lang: "es-CL",
    categories: ["business", "productivity", "utilities"],
    icons: [
      {
        src: "/icons/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icons/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
