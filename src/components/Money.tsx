"use client";

import { type ReactNode } from "react";
import { useAuth } from "@/lib/auth";
import { formatCLP, cn } from "@/lib/utils";

/** ¿El usuario actual puede ver montos? */
export function useCanSeePrices() {
  return useAuth().canSeePrices;
}

/**
 * Renderiza un monto en CLP solo si el usuario tiene el acceso `ver_precios`.
 * En caso contrario muestra un placeholder enmascarado. Se usa en toda la app
 * para que los precios queden ocultos SIEMPRE para quien no tenga el permiso.
 */
export function Money({
  value,
  compact,
  className,
}: {
  value: number;
  compact?: boolean;
  className?: string;
}) {
  const can = useAuth().canSeePrices;
  if (!can) {
    return (
      <span
        className={cn("tracking-wider text-slate-400", className)}
        title="Sin acceso a montos"
      >
        •••••
      </span>
    );
  }
  return <span className={className}>{formatCLP(value, { compact })}</span>;
}

/** Muestra a sus hijos solo si el usuario puede ver precios; si no, nada. */
export function PriceGate({ children }: { children: ReactNode }) {
  const can = useAuth().canSeePrices;
  return can ? <>{children}</> : null;
}
