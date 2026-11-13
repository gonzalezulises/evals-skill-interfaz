import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { INDICADORES, alertas, mediana, type Proyecto } from "@/lib/proyectos";
import { IconoEstado, InsigniaRiesgo, fondoEstado } from "@/components/ui";
import { cn } from "@/lib/utils";

/** Indicadores que se cuentan en enteros: su mediana se redondea para leerse igual que el valor. */
const ENTEROS = new Set(["avanceFisicoPct", "avanceFinancieroPct", "diasAtraso", "hitosCumplidos", "incidentesSeguridad", "personalAsignado"]);

interface Props {
  proyecto: Proyecto | null;
  cartera: Proyecto[];
  onCerrar: () => void;
}

/**
 * Detalle de un proyecto: hoja inferior en el celular, panel lateral desde 768 px.
 * Patrón: «Drawer» de 21st.dev (wensity/drawer, id 31360) — hoja con asa en móvil, lateral en pantallas grandes.
 */
export function Detalle({ proyecto: p, cartera, onCerrar }: Props) {
  const cerrar = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!p) return;
    cerrar.current?.focus();
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("button, [tabindex='0']");
        const primero = f[0];
        const ultimo = f[f.length - 1];
        if (e.shiftKey && document.activeElement === primero) {
          e.preventDefault();
          ultimo.focus();
        } else if (!e.shiftKey && document.activeElement === ultimo) {
          e.preventDefault();
          primero.focus();
        }
      }
    };
    document.addEventListener("keydown", tecla);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tecla);
      document.body.style.overflow = overflow;
    };
  }, [p, onCerrar]);

  if (!p) return null;
  const a = alertas(p);

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="absolute inset-x-0 bottom-0 flex max-h-[88vh] flex-col rounded-t-2xl bg-surface shadow-2xl motion-safe:animate-[subir_200ms_ease-out] md:inset-y-0 md:right-0 md:left-auto md:max-h-none md:w-[440px] md:rounded-none md:rounded-l-2xl"
      >
        <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-line md:hidden" aria-hidden="true" />
        <header className="flex items-start gap-3 border-b border-line px-4 pt-3 pb-4">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-ink-3">
              {p.id} · Gerente: {p.gerente}
            </p>
            <h2 id="detalle-titulo" className="mt-0.5 text-lg leading-snug font-semibold">
              {p.nombre}
            </h2>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <InsigniaRiesgo riesgo={p.riesgo} />
              <span className="text-xs text-ink-2">
                {a.critico + a.alerta === 0
                  ? "Todos los indicadores en rango"
                  : `${a.critico} crítico${a.critico === 1 ? "" : "s"} · ${a.alerta} en alerta`}
              </span>
            </div>
          </div>
          <button
            ref={cerrar}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="-mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-full text-ink-2 hover:bg-surface-2"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="overflow-y-auto px-4 pb-6" tabIndex={0} aria-label="Indicadores del proyecto">
          <p className="mt-3 mb-1 text-xs text-ink-3">Cada indicador frente a la mediana de los 40 proyectos.</p>
          <dl className="divide-y divide-line">
            {INDICADORES.filter((i) => i.clave !== "riesgo").map((i) => {
              const e = i.estado(p);
              const valores = cartera.map(i.valor);
              const lo = Math.min(...valores);
              const hi = Math.max(...valores);
              const pos = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;
              const med = mediana(valores);
              const medValor = i.clave === "hitosCumplidos" ? med * p.hitosTotales : med;
              const medTexto = i.texto({ ...p, [i.clave]: ENTEROS.has(i.clave) ? Math.round(medValor) : medValor });
              return (
                <div key={i.clave} className={cn("-mx-2 rounded-lg px-2 py-3", fondoEstado(e))}>
                  <div className="flex items-baseline justify-between gap-3">
                    <dt className="text-sm text-ink-2">{i.etiqueta}</dt>
                    <dd className="flex items-center gap-1.5 text-base font-semibold tabular-nums">
                      {e !== "ok" && <IconoEstado estado={e} />}
                      {i.texto(p)}
                    </dd>
                  </div>
                  <div className="relative mt-2 h-1.5 rounded-full bg-surface-2" aria-hidden="true">
                    <span className="absolute -top-1 h-3.5 w-0.5 bg-ink-3" style={{ left: `${pos(med)}%` }} />
                    <span
                      className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-surface bg-accent"
                      style={{ left: `${pos(i.valor(p))}%` }}
                    />
                  </div>
                  <p className="mt-1.5 text-xs text-ink-3">
                    Mediana: {medTexto}
                    {e !== "ok" && i.criterio ? ` · ${i.criterio}` : ""}
                  </p>
                </div>
              );
            })}
          </dl>
        </div>
      </div>
    </div>
  );
}
