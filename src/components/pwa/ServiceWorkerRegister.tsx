"use client";

import { useEffect } from "react";

/** Registra el service worker (solo en producción/https) para habilitar la
    instalación PWA y el modo offline básico. */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // En localhost http no siempre aplica; el navegador lo permite en localhost.
    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* silencioso: la app funciona igual sin SW */
      });
    };
    if (document.readyState === "complete") onLoad();
    else window.addEventListener("load", onLoad, { once: true });
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}
