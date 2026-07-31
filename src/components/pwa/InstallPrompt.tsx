"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import {
  Download, X, Share, Plus, ChevronRight, Smartphone, Apple, MonitorSmartphone,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const DISMISS_KEY = "inssup:install-dismissed";

function detect() {
  if (typeof window === "undefined") return { ios: false, android: false, standalone: false };
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const android = /Android/.test(ua);
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error Safari iOS
    window.navigator.standalone === true;
  return { ios: iOS, android, standalone };
}

export function InstallPrompt() {
  const [mounted, setMounted] = useState(false);
  const [env, setEnv] = useState({ ios: false, android: false, standalone: false });
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  const triggerInstall = useCallback(async () => {
    const evt = (window as unknown as { __bip?: BIPEvent }).__bip ?? null;
    if (evt) {
      await evt.prompt();
      await evt.userChoice;
      (window as unknown as { __bip?: BIPEvent }).__bip = undefined;
      setDeferred(null);
    } else {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect */
    setMounted(true);
    setEnv(detect());
    try {
      setDismissed(localStorage.getItem(DISMISS_KEY) === "1");
    } catch {
      setDismissed(false);
    }
    const early = (window as unknown as { __bip?: BIPEvent }).__bip;
    if (early) setDeferred(early);
    /* eslint-enable react-hooks/set-state-in-effect */

    const onBip = (e: Event) => {
      e.preventDefault();
      (window as unknown as { __bip?: BIPEvent }).__bip = e as BIPEvent;
      setDeferred(e as BIPEvent);
    };
    const onInstalled = () => {
      setDeferred(null);
      setEnv((s) => ({ ...s, standalone: true }));
    };
    const onTrigger = () => triggerInstall();
    window.addEventListener("beforeinstallprompt", onBip);
    window.addEventListener("appinstalled", onInstalled);
    window.addEventListener("inssup:install", onTrigger);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBip);
      window.removeEventListener("appinstalled", onInstalled);
      window.removeEventListener("inssup:install", onTrigger);
    };
  }, [triggerInstall]);

  const closePill = () => {
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* noop */
    }
  };

  if (!mounted || env.standalone) return null;

  const canNativeInstall = !!deferred || !!(typeof window !== "undefined" && (window as unknown as { __bip?: BIPEvent }).__bip);
  const showPill = !dismissed && (canNativeInstall || env.ios);

  return (
    <>
      {showPill && (
        <div className="fixed inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom))] z-[900] flex justify-center px-3 sm:left-auto sm:right-4 sm:justify-end sm:px-0">
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white p-2 pl-3 shadow-xl dark:border-slate-700">
            <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/icons/icon-192.png" alt="INSSUP" className="size-9" />
            </div>
            <div className="mr-1 min-w-0">
              <p className="text-sm font-semibold text-slate-800">Instalar INSSUP</p>
              <p className="truncate text-xs text-slate-500">
                {env.ios ? "Añádela a tu pantalla de inicio" : "Instálala como app"}
              </p>
            </div>
            <Button size="sm" onClick={() => (env.ios ? setOpen(true) : triggerInstall())}>
              <Download className="size-4" /> Instalar
            </Button>
            <button
              onClick={closePill}
              className="grid size-7 shrink-0 place-items-center rounded-lg text-slate-400 hover:bg-slate-100"
              aria-label="Cerrar"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Instalar INSSUP en tu teléfono"
        subtitle="Funciona como una app: pantalla completa, ícono propio y acceso rápido."
        size="max-w-md"
        footer={
          <Button size="sm" onClick={() => setOpen(false)}>Entendido</Button>
        }
      >
        <InstallGuide env={env} onNative={canNativeInstall ? triggerInstall : undefined} />
      </Modal>
    </>
  );
}

function InstallGuide({
  env,
  onNative,
}: {
  env: { ios: boolean; android: boolean };
  onNative?: () => void;
}) {
  if (env.ios) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
          <Apple className="size-4 shrink-0" />
          En iPhone/iPad se instala desde <b className="mx-1">Safari</b> (no funciona en Chrome iOS).
        </div>
        <Step n={1} icon={<Smartphone className="size-4" />}>Abre <b>inssupp.vercel.app</b> en <b>Safari</b>.</Step>
        <Step n={2} icon={<Share className="size-4" />}>Toca el botón <b>Compartir</b> (el cuadro con la flecha hacia arriba).</Step>
        <Step n={3} icon={<Plus className="size-4" />}>Elige <b>«Agregar a pantalla de inicio»</b>.</Step>
        <Step n={4} icon={<ChevronRight className="size-4" />}>Pulsa <b>«Agregar»</b> arriba a la derecha.</Step>
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-800">
          Listo: aparecerá el ícono de INSSUP en tu pantalla de inicio y se abrirá en pantalla completa.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {onNative ? (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
            <Smartphone className="size-4 shrink-0" /> Tu navegador permite instalarla directamente.
          </div>
          <Button className="w-full" onClick={onNative}>
            <Download className="size-4" /> Instalar aplicación
          </Button>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-600">
            <MonitorSmartphone className="size-4 shrink-0" /> Instálala desde el menú del navegador.
          </div>
          <Step n={1} icon={<Smartphone className="size-4" />}>Abre <b>inssupp.vercel.app</b> en <b>Chrome</b> (Android) o Edge.</Step>
          <Step n={2} icon={<ChevronRight className="size-4" />}>Abre el menú <b>⋮</b> (arriba a la derecha).</Step>
          <Step n={3} icon={<Download className="size-4" />}>Toca <b>«Instalar aplicación»</b> o «Agregar a pantalla de inicio».</Step>
        </>
      )}
    </div>
  );
}

function Step({ n, icon, children }: { n: number; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <span className={cn("grid size-7 shrink-0 place-items-center rounded-full bg-brand-600 text-xs font-bold text-white")}>{n}</span>
      <div className="flex items-start gap-1.5 pt-0.5 text-sm text-slate-700">
        <span className="mt-0.5 text-slate-400">{icon}</span>
        <span>{children}</span>
      </div>
    </div>
  );
}
