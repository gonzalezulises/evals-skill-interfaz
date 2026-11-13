import { AlertTriangle, CalendarClock, ChevronRight } from "lucide-react";
import type { Factura } from "@/lib/api";
import { dinero, fecha, resumen, type Estado } from "@/lib/facturas";

type Props = {
  facturas: Factura[];
  onFiltrar: (e: Estado) => void;
  onAbrir: (numero: string) => void;
};

/** Patrón de 21st «Invoice History Table» (id 22187 / 25152): cifra de saldo pendiente arriba del listado. */
export function Resumen({ facturas, onFiltrar, onAbrir }: Props) {
  const r = resumen(facturas);
  const saldo = r.vencido + r.porVencer;
  const pctVencido = saldo ? (r.vencido / saldo) * 100 : 0;

  return (
    <section aria-label="Resumen de tu cuenta" className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
      {/* Protagonista: lo que el cliente debe hoy */}
      <div className="rounded-2xl border border-linea bg-superficie p-5 sm:p-6">
        <p className="text-sm font-medium text-tenue">Saldo por pagar</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight tabular-nums sm:text-5xl">{dinero(saldo)}</p>
        <p className="mt-1 text-sm text-tenue">
          {r.nVencidas + r.nPendientes} facturas abiertas
        </p>
        {saldo > 0 && (
          <>
            <div className="mt-5 flex h-2.5 overflow-hidden rounded-full bg-linea" aria-hidden="true">
              <div className="bg-vencida" style={{ width: `${pctVencido}%` }} />
              <div className="bg-[#d97706]" style={{ width: `${100 - pctVencido}%` }} />
            </div>
            <div className="mt-2 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => onFiltrar("vencida")}
                className="flex min-h-11 cursor-pointer flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-fondo"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-tenue">
                  <span className="size-2 rounded-full bg-vencida" aria-hidden="true" /> Vencido
                </span>
                <span className="text-sm font-semibold tabular-nums">{dinero(r.vencido)}</span>
              </button>
              <button
                type="button"
                onClick={() => onFiltrar("pendiente")}
                className="flex min-h-11 cursor-pointer flex-col items-start rounded-lg px-2 py-1.5 text-left hover:bg-fondo"
              >
                <span className="flex items-center gap-1.5 text-xs font-medium text-tenue">
                  <span className="size-2 rounded-full bg-[#d97706]" aria-hidden="true" /> Pendiente
                </span>
                <span className="text-sm font-semibold tabular-nums">{dinero(r.porVencer)}</span>
              </button>
            </div>
          </>
        )}
      </div>

      {/* Alerta: lo vencido, con acción directa */}
      <button
        type="button"
        onClick={() => onFiltrar("vencida")}
        disabled={!r.nVencidas}
        className="group flex cursor-pointer flex-col rounded-2xl border border-vencida/25 bg-vencida-suave/60 p-5 text-left transition-colors hover:border-vencida/50 disabled:cursor-default disabled:border-linea disabled:bg-superficie"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-vencida">
          <AlertTriangle className="size-4" aria-hidden="true" /> Vencido
        </span>
        <span className="mt-1 text-2xl font-semibold tabular-nums">{dinero(r.vencido)}</span>
        <span className="mt-1 text-sm text-tenue">
          {r.nVencidas
            ? `${r.nVencidas} ${r.nVencidas === 1 ? "factura" : "facturas"} · la más antigua venció el ${fecha(r.masAntigua!.vencimiento)}`
            : "No tienes facturas vencidas."}
        </span>
        {r.nVencidas > 0 && (
          <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-vencida">
            Ver vencidas <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        )}
      </button>

      {/* La pendiente que vence primero (los datos pueden traer pendientes con fecha ya pasada) */}
      {r.proxima ? (
        <button
          type="button"
          onClick={() => onAbrir(r.proxima!.numero)}
          className="group flex cursor-pointer flex-col rounded-2xl border border-linea bg-superficie p-5 text-left transition-colors hover:border-marca/40"
        >
          <span className="flex items-center gap-2 text-sm font-medium text-tenue">
            <CalendarClock className="size-4" aria-hidden="true" /> Pendiente que vence primero
          </span>
          <span className="mt-1 text-2xl font-semibold">{fecha(r.proxima.vencimiento)}</span>
          <span className="mt-1 text-sm text-tenue tabular-nums">
            {r.proxima.numero} · {dinero(r.proxima.total)}
          </span>
          <span className="mt-auto flex items-center gap-1 pt-3 text-sm font-semibold text-marca">
            Ver factura <ChevronRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </span>
        </button>
      ) : (
        <div className="flex flex-col rounded-2xl border border-linea bg-superficie p-5">
          <span className="flex items-center gap-2 text-sm font-medium text-tenue">
            <CalendarClock className="size-4" aria-hidden="true" /> Pendiente que vence primero
          </span>
          <span className="mt-1 text-sm text-tenue">No tienes facturas pendientes por vencer.</span>
        </div>
      )}
    </section>
  );
}
