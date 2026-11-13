/*
 * Tarjeta KPI y sparkline. Adaptadas de 21st.dev «Charts & KPI Cards» de uvain (demo id 33507,
 * https://21st.dev/@uvain/components/revenue-charts-kpi): delta que sabe si subir es bueno,
 * sparkline de 2 px sin animación, texto en tokens de tinta (nunca en el color de la serie).
 * Cambios: la tarjeta entera es un botón que abre el detalle, y el delta va en puntos o en horas.
 */
import type { ReactNode } from "react";
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, YAxis } from "recharts";
import { cn } from "@/lib/utils";

export function Sparkline({ data, label }: { data: number[]; label: string }) {
  const rows = data.map((v, i) => ({ i, v }));
  return (
    <div role="img" aria-label={label} className="h-10 w-28 shrink-0">
      <div aria-hidden className="h-full w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
            <YAxis hide domain={[0, 100]} />
            <Line type="monotone" dataKey="v" stroke="var(--accent)" strokeWidth={2} dot={false} isAnimationActive={false} strokeLinecap="round" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

type KpiProps = {
  label: string;
  value: ReactNode;
  unit?: string;
  /** Cambio frente al período anterior, ya en la unidad que se muestra. */
  delta?: { value: number; text: string; good: "up" | "down"; period: string };
  trend?: ReactNode;
  onOpen: () => void;
  openLabel: string;
  className?: string;
};

export function KpiCard({ label, value, unit, delta, trend, onOpen, openLabel, className }: KpiProps) {
  const up = (delta?.value ?? 0) > 0;
  const flat = delta?.value === 0;
  const positive = delta && !flat ? (up && delta.good === "up") || (!up && delta.good === "down") : null;
  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={openLabel}
      className={cn(
        "group grid cursor-pointer content-between gap-3 rounded-2xl border border-line bg-surface p-4 text-left transition-colors hover:border-ink-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus",
        className,
      )}
    >
      <span className="flex items-center justify-between gap-2 text-sm font-medium text-ink-2">
        {label}
        <ChevronRight className="size-4 text-ink-3 transition-transform group-hover:translate-x-0.5" aria-hidden />
      </span>
      <span className="flex items-end justify-between gap-3">
        <span className="text-3xl leading-none font-semibold tracking-tight tabular-nums text-ink">
          {value}
          {unit && <span className="ml-1 text-base font-medium text-ink-2">{unit}</span>}
        </span>
        {trend}
      </span>
      {delta && (
        <span className="flex flex-wrap items-center gap-x-1.5 text-xs text-ink-2">
          <span
            className={cn(
              "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold tabular-nums",
              positive === null ? "bg-surface-2 text-ink-2" : positive ? "bg-ok/12 text-ink" : "bg-bad/12 text-ink",
            )}
          >
            {!flat && (up ? <ArrowUpRight className={cn("size-3.5", positive ? "text-ok" : "text-bad")} aria-hidden /> : <ArrowDownRight className={cn("size-3.5", positive ? "text-ok" : "text-bad")} aria-hidden />)}
            <span className="sr-only">{flat ? "Sin cambio" : positive ? "Mejora" : "Empeora"}: </span>
            {delta.text}
          </span>
          {delta.period}
        </span>
      )}
    </button>
  );
}
