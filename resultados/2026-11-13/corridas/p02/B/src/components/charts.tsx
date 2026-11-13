/* Adaptado de "Charts & KPI Cards" (Layro System) de 21st.dev:
   https://21st.dev/@uvain/components/revenue-charts-kpi (demo id 33507).
   Se conserva su criterio: un solo eje Y, barras delgadas, el texto no usa el color
   de la serie, leyenda con 2+ series y tabla oculta para lectores de pantalla. */
import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export interface Series {
  key: string;
  label: string;
  color: string;
}

const AXIS = { fill: "var(--muted-foreground)", fontSize: 11 };

export function ChartCard({
  title,
  subtitle,
  actions,
  className,
  children,
  id,
}: {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn("grid min-w-0 content-start gap-4 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-border sm:p-5", className)}
    >
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid min-w-0 gap-0.5">
          <h2 id={id} className="text-[15px] font-semibold tracking-[-0.01em]">
            {title}
          </h2>
          {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Legend({ series }: { series: Series[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden>
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
  extra,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ dataKey?: unknown; value?: unknown }>;
  label?: unknown;
  series: Series[];
  format: (v: number) => string;
  extra?: (label: string) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-[10px] bg-popover px-3 py-2 text-[12px] text-popover-foreground shadow-lg ring-1 ring-border">
      <p className="mb-1.5 font-medium">{String(label)}</p>
      <ul className="grid gap-1">
        {payload.map((p) => {
          const s = series.find((x) => x.key === p.dataKey);
          if (!s) return null;
          return (
            <li key={s.key} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <span className="h-2 w-2 rounded-[3px]" style={{ background: s.color }} />
                {s.label}
              </span>
              <span className="font-medium tabular-nums">{format(Number(p.value))}</span>
            </li>
          );
        })}
      </ul>
      {extra?.(String(label))}
    </div>
  );
}

export function BarCompare<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  format,
  axisFormat,
  description,
  height = 240,
  tooltipExtra,
}: {
  data: T[];
  xKey: keyof T & string;
  series: Series[];
  format: (v: number) => string;
  axisFormat: (v: number) => string;
  description: string;
  height?: number;
  tooltipExtra?: (label: string) => React.ReactNode;
}) {
  return (
    <div className="grid min-w-0 gap-3">
      <Legend series={series} />
      <div role="img" aria-label={description} style={{ height }} className="min-w-0">
        <div aria-hidden className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barGap={3} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey={xKey as string} tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} interval={0} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={axisFormat} width={56} />
              <RTooltip
                cursor={{ fill: "var(--accent)", opacity: 0.7 }}
                content={(p) => <ChartTooltip active={p.active} payload={p.payload} label={p.label} series={series} format={format} extra={tooltipExtra} />}
              />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={22} radius={[4, 4, 0, 0]} isAnimationActive={false} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="sr-only">
        <table>
          <caption>{description}</caption>
          <thead>
            <tr>
              <th scope="col">Mes</th>
              {series.map((s) => (
                <th key={s.key} scope="col">
                  {s.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <th scope="row">{String(row[xKey])}</th>
                {series.map((s) => (
                  <td key={s.key}>{format(Number(row[s.key]))}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  deltaLabel,
  good = "up",
  tone,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Cambio en puntos o fracción, ya formateado por deltaLabel. */
  delta?: number;
  deltaLabel?: string;
  good?: "up" | "down";
  tone?: "danger";
}) {
  const up = (delta ?? 0) >= 0;
  const positive = delta === undefined ? null : (up && good === "up") || (!up && good === "down");
  return (
    <div className="grid min-w-0 content-start gap-2 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-border">
      <p className="text-[12.5px] font-medium text-muted-foreground">{label}</p>
      <p className={cn("text-[26px] leading-none font-semibold tracking-[-0.02em] tabular-nums", tone === "danger" && "text-danger")}>
        {value}
      </p>
      {(hint || delta !== undefined) && (
        <p className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-[12.5px] text-muted-foreground">
          {delta !== undefined && (
            <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", positive ? "text-good" : "text-danger")}>
              {up ? <ArrowUpRight className="size-3.5" aria-hidden /> : <ArrowDownRight className="size-3.5" aria-hidden />}
              <span className="sr-only">{up ? "Sube" : "Baja"} </span>
              {deltaLabel}
            </span>
          )}
          {hint}
        </p>
      )}
    </div>
  );
}
