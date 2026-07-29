import type { Evidence } from "@/lib/types";
import { FileText, ImageIcon } from "lucide-react";
import { formatDate } from "@/lib/utils";

export function EvidenceThumb({ ev }: { ev: Evidence }) {
  const isDoc = ev.type === "documento";
  return (
    <div className="group overflow-hidden rounded-lg border border-slate-200 bg-white">
      <div
        className="relative flex h-20 items-center justify-center"
        style={{
          background: isDoc
            ? "linear-gradient(135deg,#f1f5f9,#e2e8f0)"
            : `linear-gradient(135deg, hsl(${ev.hue} 45% 82%), hsl(${ev.hue + 20} 40% 62%))`,
        }}
      >
        {isDoc ? (
          <FileText className="size-7 text-slate-500" />
        ) : (
          <ImageIcon className="size-7 text-white/85" />
        )}
        <span className="absolute right-1.5 top-1.5 rounded bg-black/25 px-1.5 py-0.5 text-[9px] font-medium uppercase text-white">
          {ev.type}
        </span>
      </div>
      <div className="px-2 py-1.5">
        <p className="truncate text-xs font-medium text-slate-700">{ev.label}</p>
        <p className="truncate text-[10px] text-slate-400">
          {formatDate(ev.uploadedAt)} · {ev.uploadedBy}
        </p>
      </div>
    </div>
  );
}
