import { cn } from "@/lib/utils";

/**
 * Wordmark de INSSUP LTDA. recreado en vector.
 * - theme "dark": para fondos oscuros (sidebar) → INS azul claro, SUP blanco.
 * - theme "light": para fondos claros (topbar) → INS azul, SUP negro (como el original).
 */
export function InssupLogo({
  theme = "dark",
  showTagline = true,
  size = "md",
  className,
}: {
  theme?: "dark" | "light";
  showTagline?: boolean;
  size?: "sm" | "md";
  className?: string;
}) {
  const ins = theme === "dark" ? "text-brand-400" : "text-[#1e56b3]";
  const sup = theme === "dark" ? "text-white" : "text-slate-900";
  const ltda = theme === "dark" ? "text-slate-400" : "text-slate-500";
  const tag = theme === "dark" ? "text-slate-400" : "text-slate-500";

  const wordSize = size === "sm" ? "text-lg" : "text-2xl";
  const ltdaSize = size === "sm" ? "text-[7px]" : "text-[8px]";

  return (
    <div className={cn("select-none leading-none", className)}>
      <div className="flex items-start gap-1">
        <span
          className={cn(
            "font-black italic tracking-tighter leading-none",
            wordSize,
          )}
        >
          <span className={ins}>INS</span>
          <span className={sup}>SUP</span>
        </span>
        <span className={cn("mt-0.5 font-bold tracking-wide", ltdaSize, ltda)}>
          LTDA.
        </span>
      </div>
      {showTagline && (
        <p className={cn("mt-1 text-[8.5px] font-medium leading-tight", tag)}>
          Instalaciones y Supervisión
          <br />
          en Telecomunicaciones
        </p>
      )}
    </div>
  );
}
