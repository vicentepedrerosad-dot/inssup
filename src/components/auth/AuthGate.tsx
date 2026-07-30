"use client";

import { useState, type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { LoginScreen } from "./LoginScreen";
import { ChangePasswordModal } from "./ChangePasswordModal";
import { RadioTower } from "lucide-react";

export function AuthGate({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const [dismissed, setDismissed] = useState(false);

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center bg-panel">
        <div className="flex flex-col items-center gap-3">
          <div className="grid size-12 animate-pulse place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white">
            <RadioTower className="size-6" />
          </div>
          <p className="text-sm text-slate-400">Cargando plataforma…</p>
        </div>
      </div>
    );
  }

  if (status === "anon" || !user) {
    return <LoginScreen />;
  }

  return (
    <>
      {children}
      <ChangePasswordModal
        open={user.mustChangePassword && !dismissed}
        forced
        onClose={() => setDismissed(true)}
      />
    </>
  );
}
