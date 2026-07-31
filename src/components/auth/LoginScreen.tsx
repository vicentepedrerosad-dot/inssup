"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { InssupLogo } from "@/components/layout/InssupLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { Lock, User, Loader2, ShieldCheck, RadioTower, Download } from "lucide-react";

export function LoginScreen() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;
    setLoading(true);
    setError("");
    const res = await login(username, password);
    setLoading(false);
    if (res.error) setError(res.error);
  };

  return (
    <div className="flex min-h-dvh flex-col bg-panel lg:flex-row">
      {/* Panel de marca */}
      <div className="relative hidden flex-1 flex-col justify-between overflow-hidden bg-gradient-to-br from-brand-800 via-panel to-panel p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 30%, #67e8f9 0, transparent 40%), radial-gradient(circle at 80% 70%, #22d3ee 0, transparent 40%)",
          }}
        />
        <InssupLogo theme="dark" />
        <div className="relative">
          <h1 className="max-w-md text-3xl font-bold leading-tight text-white">
            Control operacional de telecomunicaciones
          </h1>
          <p className="mt-3 max-w-md text-sm text-slate-300">
            Plataforma para gestionar instalaciones, supervisión, mantenimiento y
            emergencias 24/7 de sitios celulares en todo Chile.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {["Sitios 2G/3G/4G/LTE", "Enlaces MMOO", "Emergencias 24/7"].map((t) => (
              <span key={t} className="rounded-full bg-white/10 px-3 py-1 text-xs text-brand-100 ring-1 ring-inset ring-white/10">
                {t}
              </span>
            ))}
          </div>
        </div>
        <p className="relative flex items-center gap-1.5 text-xs text-slate-400">
          <ShieldCheck className="size-3.5" /> Acceso restringido · sesión cifrada
        </p>
      </div>

      {/* Formulario */}
      <div className="flex flex-1 items-center justify-center p-6 pt-[max(1.5rem,env(safe-area-inset-top))] pb-[max(1.5rem,env(safe-area-inset-bottom))]">
        <div className="w-full max-w-sm">
          <div className="mb-6 flex items-center gap-2.5 lg:hidden">
            <div className="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
              <RadioTower className="size-5" />
            </div>
            <InssupLogo theme="dark" showTagline={false} />
          </div>

          <div className="rounded-2xl bg-white p-6 shadow-2xl sm:p-8">
            <h2 className="text-lg font-bold text-slate-900">Iniciar sesión</h2>
            <p className="mt-1 text-sm text-slate-500">
              Ingresa con tu usuario y contraseña.
            </p>

            <form onSubmit={submit} className="mt-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Usuario</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="tu.usuario"
                    autoCapitalize="none"
                    autoCorrect="off"
                    className="pl-8.5"
                    autoFocus
                  />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Contraseña</label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="pl-8.5"
                  />
                </div>
              </div>

              {error && (
                <div className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-inset ring-red-600/15">
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Lock className="size-4" />}
                {loading ? "Ingresando…" : "Ingresar"}
              </Button>
            </form>
          </div>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event("inssup:install"))}
            className="mx-auto mt-4 flex items-center gap-2 rounded-lg border border-white/15 bg-white/5 px-3.5 py-2 text-sm font-medium text-brand-100 transition-colors hover:bg-white/10"
          >
            <Download className="size-4" /> Instalar la app en tu teléfono
          </button>
          <p className="mt-3 text-center text-xs text-slate-400">
            ¿Problemas para entrar? Contacta a tu administrador INSSUP.
          </p>
        </div>
      </div>
    </div>
  );
}
