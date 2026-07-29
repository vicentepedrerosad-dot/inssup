"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid,
  AreaChart,
  Area,
  PieChart,
  Pie,
  LabelList,
} from "recharts";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const AXIS = { fontSize: 11, fill: "#64748b" };
const GRID = "#eef2f6";

function ChartTooltip({
  active,
  payload,
  label,
  formatter,
}: {
  active?: boolean;
  payload?: Array<{ value: number; name?: string; payload?: Record<string, unknown> }>;
  label?: string | number;
  formatter?: (v: number, p?: Record<string, unknown>) => string;
}) {
  if (!active || !payload?.length) return null;
  const v = payload[0].value;
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-lg">
      {label !== undefined && (
        <p className="mb-0.5 font-medium text-slate-700">{label}</p>
      )}
      <p className="tabular font-semibold text-slate-900">
        {formatter ? formatter(v, payload[0].payload) : v}
      </p>
    </div>
  );
}

/** Barras horizontales (rankings, avance por categoría). */
export function HBarChart({
  data,
  height = 240,
  color = "#0e7490",
  colorKey,
  valueFormatter,
  domainMax,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  colorKey?: boolean;
  valueFormatter?: (v: number, p?: Record<string, unknown>) => string;
  domainMax?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 58, left: 4, bottom: 4 }}
        barCategoryGap={8}
      >
        <CartesianGrid horizontal={false} stroke={GRID} />
        <XAxis
          type="number"
          hide
          domain={[0, domainMax ?? ((dataMax: number) => Math.ceil(dataMax * 1.15))]}
        />
        <YAxis
          type="category"
          dataKey="name"
          width={110}
          tick={AXIS}
          axisLine={false}
          tickLine={false}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={<ChartTooltip formatter={valueFormatter} />}
        />
        <Bar dataKey="value" radius={[0, 5, 5, 0]} maxBarSize={22}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorKey ? d.color ?? color : color} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v: unknown) =>
              valueFormatter ? valueFormatter(Number(v)) : String(v)
            }
            className="tabular"
            fill="#475569"
            fontSize={11}
            fontWeight={600}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Barras verticales (ingresos por proyecto, etc). */
export function VBarChart({
  data,
  height = 240,
  color = "#0e7490",
  colorKey,
  valueFormatter,
}: {
  data: { name: string; value: number; color?: string }[];
  height?: number;
  color?: string;
  colorKey?: boolean;
  valueFormatter?: (v: number, p?: Record<string, unknown>) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis
          dataKey="name"
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          interval={0}
          angle={data.length > 6 ? -25 : 0}
          textAnchor={data.length > 6 ? "end" : "middle"}
          height={data.length > 6 ? 50 : 24}
        />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={40}
          tickFormatter={(v) => (valueFormatter ? valueFormatter(v) : String(v))}
        />
        <Tooltip
          cursor={{ fill: "#f1f5f9" }}
          content={<ChartTooltip formatter={valueFormatter} />}
        />
        <Bar dataKey="value" radius={[5, 5, 0, 0]} maxBarSize={44}>
          {data.map((d, i) => (
            <Cell key={i} fill={colorKey ? d.color ?? color : color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

/** Área de tendencia (horas por semana). */
export function AreaTrend({
  data,
  height = 220,
  dataKey = "value",
  xKey = "name",
  color = "#0e7490",
  valueFormatter,
}: {
  data: Record<string, string | number>[];
  height?: number;
  dataKey?: string;
  xKey?: string;
  color?: string;
  valueFormatter?: (v: number) => string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 4 }}>
        <defs>
          <linearGradient id={`grad-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.28} />
            <stop offset="100%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke={GRID} />
        <XAxis dataKey={xKey} tick={AXIS} axisLine={false} tickLine={false} />
        <YAxis
          tick={AXIS}
          axisLine={false}
          tickLine={false}
          width={38}
          tickFormatter={(v) => (valueFormatter ? valueFormatter(v) : String(v))}
        />
        <Tooltip content={<ChartTooltip formatter={valueFormatter} />} />
        <Area
          type="monotone"
          dataKey={dataKey}
          stroke={color}
          strokeWidth={2}
          fill={`url(#grad-${color})`}
          dot={{ r: 2.5, fill: color, strokeWidth: 0 }}
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/** Donut de distribución con leyenda. */
export function DonutChart({
  data,
  height = 220,
  centerLabel,
  centerValue,
}: {
  data: { name: string; value: number; color: string }[];
  height?: number;
  centerLabel?: string;
  centerValue?: ReactNode;
}) {
  const total = data.reduce((a, d) => a + d.value, 0);
  return (
    <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-center">
      <div className="relative shrink-0" style={{ width: height, height }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="62%"
              outerRadius="90%"
              paddingAngle={2}
              stroke="none"
            >
              {data.map((d, i) => (
                <Cell key={i} fill={d.color} />
              ))}
            </Pie>
            <Tooltip
              content={<ChartTooltip formatter={(v) => `${v} (${Math.round((v / total) * 100)}%)`} />}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="text-center">
            <p className="tabular text-2xl font-bold text-slate-900">
              {centerValue ?? total}
            </p>
            {centerLabel && (
              <p className="text-[11px] text-slate-500">{centerLabel}</p>
            )}
          </div>
        </div>
      </div>
      <ul className="grid w-full grid-cols-2 gap-x-3 gap-y-1.5 sm:flex sm:flex-col">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="inline-block size-2.5 shrink-0 rounded-sm"
              style={{ background: d.color }}
            />
            <span className="flex-1 truncate text-slate-600">{d.name}</span>
            <span className="tabular font-semibold text-slate-800">{d.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function cnChart(...c: (string | undefined)[]) {
  return cn(...c);
}
