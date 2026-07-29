"use client";

import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { useState, useMemo, type ReactNode } from "react";

export function Table({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full border-collapse text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-slate-200 bg-slate-50/80">{children}</thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function TR({
  children,
  className,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        onClick && "cursor-pointer",
        "transition-colors hover:bg-slate-50/70",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TD({
  children,
  className,
  align,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-slate-700",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function TH({
  children,
  className,
  align,
  sortKey,
  sort,
  onSort,
}: {
  children: ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
  sortKey?: string;
  sort?: SortState;
  onSort?: (key: string) => void;
}) {
  const sortable = !!sortKey && !!onSort;
  const active = sort?.key === sortKey;
  return (
    <th
      className={cn(
        "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-wide text-slate-500",
        align === "right" && "text-right",
        align === "center" && "text-center",
        sortable && "cursor-pointer select-none hover:text-slate-700",
        className,
      )}
      onClick={sortable ? () => onSort!(sortKey!) : undefined}
    >
      <span
        className={cn(
          "inline-flex items-center gap-1",
          align === "right" && "flex-row-reverse",
        )}
      >
        {children}
        {sortable &&
          (active ? (
            sort!.dir === "asc" ? (
              <ChevronUp className="size-3.5 text-brand-600" />
            ) : (
              <ChevronDown className="size-3.5 text-brand-600" />
            )
          ) : (
            <ChevronsUpDown className="size-3.5 text-slate-300" />
          ))}
      </span>
    </th>
  );
}

/* ------------------------------- Hook de orden ---------------------------- */
export interface SortState {
  key: string;
  dir: "asc" | "desc";
}

export function useSort<T>(
  data: T[],
  accessor: (item: T, key: string) => string | number | null,
  initial?: SortState,
) {
  const [sort, setSort] = useState<SortState | undefined>(initial);

  const sorted = useMemo(() => {
    if (!sort) return data;
    const arr = [...data];
    arr.sort((a, b) => {
      const av = accessor(a, sort.key);
      const bv = accessor(b, sort.key);
      if (av == null) return 1;
      if (bv == null) return -1;
      if (typeof av === "number" && typeof bv === "number") {
        return sort.dir === "asc" ? av - bv : bv - av;
      }
      const cmp = String(av).localeCompare(String(bv), "es");
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, sort]);

  const toggle = (key: string) =>
    setSort((prev) =>
      prev?.key === key
        ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
        : { key, dir: "asc" },
    );

  return { sorted, sort, toggle };
}
