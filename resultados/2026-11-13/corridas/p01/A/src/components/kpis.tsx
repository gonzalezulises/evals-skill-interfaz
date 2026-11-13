import { AlertTriangle, ArrowRight, Clock, Truck } from "lucide-react";
import { cn } from "@/lib/utils";
import { fmt, type resumen } from "@/lib/ordenes";
import { focusRing } from "./ui";

type Resumen = ReturnType<typeof resumen>;

/** Columnas mensuales (patrón Sparkline / KPI Tile de 21st, en SVG propio). */
function Columnas({ datos }: { datos: [string, number][] }) {
  const max = Math.max(...datos.map(([, v]) => v), 1);
  return (
    <figure className="mt-4">
      <div className="flex h-14 items-end gap-1.5" role="img" aria-label={`Comprometido por mes de emisión: ${datos.map(([m, v]) => `${fmt.mes(m)} ${fmt.usdCompacto(v)}`).join(", ")}`}>
        {datos.map(([mes, v]) => (
          <div key={mes} className="flex flex-1 flex-col items-center gap-1" title={`${fmt.mes(mes)}: ${fmt.usd(v)}`}>
            <div className="w-full rounded-t-[4px] bg-[var(--bar)] opacity-80" style={{ height: `${Math.max(4, (v / max) * 48)}px` }} />
          </div>
        ))}
      </div>
      <div aria-hidden="true" className="mt-1 flex gap-1.5">
        {datos.map(([mes]) => (
          <span key={mes} className="flex-1 text-center text-xs text-soft capitalize">{fmt.mes(mes)}</span>
        ))}
      </div>
      <figcaption className="mt-1 text-xs text-soft">Por mes de emisión de la orden</figcaption>
    </figure>
  );
}

export function Kpis({ r, onVerAtrasadas }: { r: Resumen; onVerAtrasadas: () => void }) {
  const pctAtrasado = r.comprometido ? r.montoAtrasado / r.comprometido : 0;
  const pctATiempo = r.recibidas ? r.aTiempo / r.recibidas : 0;
  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
      {/* Protagonista: dinero comprometido */}
      <article className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] sm:p-5 md:col-span-2 xl:col-span-1 xl:row-span-2">
        <h2 className="text-sm font-medium text-muted">Dinero comprometido</h2>
        <p className="mt-2 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{fmt.usd(r.comprometido)}</p>
        <p className="mt-1 text-sm text-muted">
          <span className="font-medium text-ink tabular-nums">{r.abiertas}</span> órdenes aprobadas, enviadas o recibidas en parte
        </p>
        <div className="mt-4">
          <div className="flex h-2.5 overflow-hidden rounded-full bg-[var(--bar-track)]" role="img" aria-label={`${fmt.pct(pctAtrasado)} del monto comprometido está atrasado`}>
            <div className="h-full bg-danger" style={{ width: `${pctAtrasado * 100}%` }} />
          </div>
          <p className="mt-1.5 flex flex-wrap justify-between gap-x-3 text-xs text-muted">
            <span><span className="mr-1 inline-block size-2 rounded-full bg-danger" aria-hidden="true" />Atrasado {fmt.usdCompacto(r.montoAtrasado)} ({fmt.pct(pctAtrasado)})</span>
            <span><span className="mr-1 inline-block size-2 rounded-full bg-[var(--bar-track)] ring-1 ring-line-strong" aria-hidden="true" />En plazo {fmt.usdCompacto(r.comprometido - r.montoAtrasado)}</span>
          </p>
        </div>
        <Columnas datos={r.porMes} />
      </article>

      {/* Atrasadas: abre la tabla filtrada */}
      <button
        type="button"
        onClick={onVerAtrasadas}
        className={cn("group flex cursor-pointer flex-col rounded-2xl border border-danger/30 bg-danger-soft p-4 text-left transition-colors hover:border-danger/60 sm:p-5", focusRing)}
        aria-label={`Órdenes atrasadas: ${r.atrasadas} por ${fmt.usd(r.montoAtrasado)}. Ver en la tabla`}
      >
        <span className="flex items-center gap-1.5 text-sm font-medium text-danger">
          <AlertTriangle aria-hidden="true" className="size-4" /> Órdenes atrasadas
        </span>
        <span className="mt-2 text-4xl font-semibold tracking-tight text-ink tabular-nums">{r.atrasadas}</span>
        <span className="mt-1 text-sm text-muted">
          de {r.abiertas} abiertas · {fmt.usdCompacto(r.montoAtrasado)}
        </span>
        <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-medium text-danger">
          Ver atrasadas <ArrowRight aria-hidden="true" className="size-4 transition-transform group-hover:translate-x-0.5" />
        </span>
      </button>

      <article className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] sm:p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted"><Clock aria-hidden="true" className="size-4" /> Atraso promedio</h2>
        <p className="mt-2 text-3xl font-semibold tracking-tight tabular-nums">
          {Math.round(r.atrasoPromedio)} <span className="text-base font-medium text-muted">días</span>
        </p>
        <p className="mt-1 text-sm text-muted">desde la fecha de entrega prometida</p>
      </article>

      <article className="rounded-2xl border border-line bg-surface p-4 shadow-[var(--shadow)] sm:p-5 md:col-span-2 xl:col-span-2">
        <h2 className="flex items-center gap-1.5 text-sm font-medium text-muted"><Truck aria-hidden="true" className="size-4" /> Entregas a tiempo</h2>
        <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-1">
          <p className="text-3xl font-semibold tracking-tight tabular-nums">{fmt.pct(pctATiempo)}</p>
          <p className="pb-1 text-sm text-muted">
            {r.aTiempo} de {r.recibidas} recepciones llegaron en o antes de la fecha prometida
          </p>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--bar-track)]" aria-hidden="true">
          <div className="h-full rounded-full bg-ok" style={{ width: `${pctATiempo * 100}%` }} />
        </div>
      </article>
    </div>
  );
}

/** Lista de barras horizontales clicables: cada barra filtra la tabla. */
export function BarList({ items, activo, onSelect, etiqueta }: {
  items: { id: string; label: string; valor: number; detalle: string }[];
  activo: string | null;
  onSelect: (id: string | null) => void;
  etiqueta: string;
}) {
  const max = Math.max(...items.map((i) => i.valor), 1);
  return (
    <ul className="space-y-1 px-2 pb-3 pt-2 sm:px-3">
      {items.map((i) => {
        const on = activo === i.id;
        return (
          <li key={i.id}>
            <button
              type="button"
              aria-pressed={on}
              onClick={() => onSelect(on ? null : i.id)}
              aria-label={`${i.label}: ${i.detalle}. ${on ? "Quitar filtro" : `Filtrar la tabla por ${etiqueta}`}`}
              className={cn(
                "block min-h-11 w-full cursor-pointer rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-surface-hover",
                on && "bg-surface-active ring-1 ring-line-strong",
                focusRing,
              )}
            >
              <span className="flex items-baseline justify-between gap-2 text-sm">
                <span className="truncate text-ink">{i.label}</span>
                <span className="shrink-0 text-xs text-muted tabular-nums">{i.detalle}</span>
              </span>
              <span className="mt-1 block h-2 overflow-hidden rounded-full bg-[var(--bar-track)]" aria-hidden="true">
                <span className="block h-full rounded-full bg-[var(--bar)]" style={{ width: `${(i.valor / max) * 100}%` }} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
