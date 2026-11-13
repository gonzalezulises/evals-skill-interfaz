/* Adaptado de 21st.dev «Charts & KPI Cards» (id 33507, @uvain/revenue-charts-kpi, Layro System):
   ChartCard, BarCompare, Sparkline y KpiCard, con textos en español, delta en puntos porcentuales y
   sin el corner-shape experimental. */
import * as React from "react";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip as RTooltip, XAxis, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export interface Series {
  key: string;
  label: string;
  color: string;
}

const AXIS = { fill: "var(--muted-foreground)", fontSize: 12 };

export function ChartCard({
  title,
  subtitle,
  actions,
  className,
  children,
  ...rest
}: Omit<React.HTMLAttributes<HTMLElement>, "title"> & { title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <section className={cn("grid min-w-0 content-start gap-4 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-border sm:p-5", className)} {...rest}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="grid gap-0.5">
          <h2 className="text-[15px] font-semibold tracking-[-0.01em]">{title}</h2>
          {subtitle && <p className="text-[13px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </header>
      {children}
    </section>
  );
}

export function Legend({ series }: { series: Series[] }) {
  if (series.length < 2) return null;
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-hidden>
      {series.map((s) => (
        <li key={s.key} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
          <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: s.color }} />
          {s.label}
        </li>
      ))}
    </ul>
  );
}

type TipEntry = { dataKey?: unknown; value?: unknown; payload?: Record<string, unknown> };

function ChartTooltip({
  active,
  payload,
  label,
  series,
  format,
  labelFormat,
  extra,
}: {
  active?: boolean;
  payload?: TipEntry[];
  label?: unknown;
  series: Series[];
  format: (v: number) => string;
  labelFormat?: (l: string) => string;
  extra?: (row: Record<string, unknown>) => React.ReactNode;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[180px] rounded-[10px] bg-popover px-3 py-2 text-[12px] text-popover-foreground shadow-lg ring-1 ring-border">
      {label !== undefined && <p className="mb-1.5 font-medium">{labelFormat ? labelFormat(String(label)) : String(label)}</p>}
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
      {extra && payload[0]?.payload && <div className="mt-1.5 border-t border-border pt-1.5">{extra(payload[0].payload)}</div>}
    </div>
  );
}

export function BarCompare<T extends Record<string, unknown>>({
  data,
  xKey,
  series,
  format,
  axisFormat,
  xFormat,
  height = 240,
  description,
  tooltipExtra,
  tableExtra,
}: {
  data: T[];
  xKey: keyof T & string;
  series: Series[];
  format: (v: number) => string;
  axisFormat?: (v: number) => string;
  xFormat?: (v: string) => string;
  height?: number;
  description: string;
  tooltipExtra?: (row: Record<string, unknown>) => React.ReactNode;
  tableExtra?: { label: string; value: (row: T) => string };
}) {
  return (
    <div className="grid min-w-0 gap-3">
      <Legend series={series} />
      <div role="img" aria-label={description} style={{ height }}>
        <div aria-hidden className="h-full w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 6, right: 4, bottom: 0, left: 0 }} barGap={2} barCategoryGap="24%">
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis dataKey={xKey as string} tickLine={false} axisLine={false} tick={AXIS} tickMargin={8} tickFormatter={xFormat} />
              <YAxis tickLine={false} axisLine={false} tick={AXIS} tickFormatter={axisFormat ?? format} width={56} />
              <RTooltip
                cursor={{ fill: "var(--accent)", opacity: 0.6 }}
                content={(p) => (
                  <ChartTooltip
                    active={p.active}
                    payload={p.payload as unknown as TipEntry[] | undefined}
                    label={p.label}
                    series={series}
                    format={format}
                    labelFormat={xFormat}
                    extra={tooltipExtra}
                  />
                )}
              />
              {series.map((s) => (
                <Bar key={s.key} dataKey={s.key} name={s.label} fill={s.color} maxBarSize={24} radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
              {tableExtra && <th scope="col">{tableExtra.label}</th>}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                <th scope="row">{xFormat ? xFormat(String(row[xKey])) : String(row[xKey])}</th>
                {series.map((s) => (
                  <td key={s.key}>{format(Number(row[s.key]))}</td>
                ))}
                {tableExtra && <td>{tableExtra.value(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function Sparkline({ data, color = "var(--chart-1)", height = 36, className }: { data: number[]; color?: string; height?: number; className?: string }) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div aria-hidden className={className} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Line type="monotone" dataKey="v" stroke={color} strokeWidth={2} dot={false} isAnimationActive={false} strokeLinecap="round" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function KpiCard({
  label,
  value,
  hint,
  delta,
  deltaText,
  good = "up",
  period,
  trend,
  hero = false,
  children,
  className,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  /** Variación ya calculada (signo importa); `deltaText` es cómo se muestra. */
  delta?: number;
  deltaText?: string;
  good?: "up" | "down";
  period?: string;
  trend?: number[];
  hero?: boolean;
  children?: React.ReactNode;
  className?: string;
}) {
  const up = (delta ?? 0) >= 0;
  const positive = delta === undefined ? null : (up && good === "up") || (!up && good === "down");
  return (
    <div className={cn("grid content-start gap-2 rounded-2xl bg-card p-4 text-card-foreground ring-1 ring-border sm:p-5", className)}>
      <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-3">
        <p className={cn("leading-none font-semibold tracking-[-0.02em] tabular-nums", hero ? "text-[34px] sm:text-[40px]" : "text-[26px]")}>{value}</p>
        {trend && <Sparkline data={trend} className="w-24 shrink-0" height={32} />}
      </div>
      {hint && <p className="text-[13px] text-muted-foreground">{hint}</p>}
      {delta !== undefined && (
        <p className="flex flex-wrap items-center gap-1 text-[13px]">
          <span className={cn("inline-flex items-center gap-0.5 font-medium tabular-nums", positive ? "text-good-text" : "text-critical-text")}>
            {up ? <ArrowUpRight className="size-4" aria-hidden /> : <ArrowDownRight className="size-4" aria-hidden />}
            <span className="sr-only">{up ? "Sube" : "Baja"} </span>
            {deltaText}
          </span>
          {period && <span className="text-muted-foreground">{period}</span>}
        </p>
      )}
      {children}
    </div>
  );
}
