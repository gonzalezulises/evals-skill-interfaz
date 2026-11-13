import { ChevronRight } from "lucide-react";
import { INDICADORES, alertas, indicador, type ClaveIndicador, type Proyecto } from "@/lib/proyectos";
import { IconoEstado, InsigniaRiesgo } from "@/components/ui";

export type ClaveRanking = ClaveIndicador | "alertas";

interface Props {
  proyectos: Proyecto[];
  /** Cartera completa: fija la escala de las barras para que no cambie al filtrar. */
  cartera: Proyecto[];
  clave: ClaveRanking;
  onAbrir: (p: Proyecto, origen: HTMLElement) => void;
}

/** Lista comparativa por un indicador: la forma que se lee en un celular. */
export function Ranking({ proyectos, cartera, clave, onAbrir }: Props) {
  const ind = clave === "alertas" ? null : indicador(clave);
  const valores = ind ? cartera.map(ind.valor) : [];
  const lo = Math.min(0, ...valores);
  const hi = Math.max(0, ...valores);
  const pos = (v: number) => ((v - lo) / (hi - lo || 1)) * 100;

  return (
    <ol className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface" aria-label="Proyectos comparados">
      {proyectos.map((p, i) => {
        const a = alertas(p);
        return (
          <li key={p.id}>
            <button
              type="button"
              onClick={(e) => onAbrir(p, e.currentTarget)}
              className="flex min-h-14 w-full cursor-pointer items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-surface-2 sm:px-4"
              aria-label={`${p.nombre}: ver los 12 indicadores`}
            >
              <span className="w-6 shrink-0 text-right text-xs tabular-nums text-ink-3">{i + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{p.nombre}</span>
                  {ind && ind.clave !== "riesgo" && (
                    <span className="flex shrink-0 items-center gap-1 text-sm font-semibold tabular-nums">
                      {ind.estado(p) !== "ok" && <IconoEstado estado={ind.estado(p)} className="size-3.5" />}
                      {ind.texto(p)}
                    </span>
                  )}
                </span>
                <span className="mt-0.5 block truncate text-xs text-ink-3">
                  {p.id} · {p.gerente}
                </span>

                {ind && ind.clave !== "riesgo" && (
                  <span className="relative mt-2 block h-1.5 rounded-full bg-surface-2" aria-hidden="true">
                    {lo < 0 && <span className="absolute inset-y-[-3px] w-px bg-ink-3" style={{ left: `${pos(0)}%` }} />}
                    <span
                      className={
                        "absolute inset-y-0 rounded-full " +
                        (ind.estado(p) === "critico" ? "bg-crit" : ind.estado(p) === "alerta" ? "bg-warn" : "bg-accent")
                      }
                      style={{
                        left: `${Math.min(pos(0), pos(ind.valor(p)))}%`,
                        width: `${Math.max(Math.abs(pos(ind.valor(p)) - pos(0)), 1)}%`,
                      }}
                    />
                  </span>
                )}

                {(clave === "alertas" || clave === "riesgo") && (
                  <span className="mt-2 flex flex-wrap items-center gap-1.5">
                    <InsigniaRiesgo riesgo={p.riesgo} />
                    {clave === "alertas" && <ResumenAlertas p={p} critico={a.critico} alerta={a.alerta} />}
                  </span>
                )}
              </span>
              <ChevronRight className="size-4 shrink-0 text-ink-3" aria-hidden="true" />
            </button>
          </li>
        );
      })}
    </ol>
  );
}

function ResumenAlertas({ p, critico, alerta }: { p: Proyecto; critico: number; alerta: number }) {
  if (!critico && !alerta) return <span className="text-xs text-ok-ink">Sin alertas</span>;
  const criticos = INDICADORES.filter((i) => i.clave !== "riesgo" && i.estado(p) === "critico").map((i) => i.etiqueta);
  return (
    <span className="text-xs text-ink-2">
      {critico > 0 && <strong className="font-semibold text-crit-ink">{critico} crít.</strong>}
      {critico > 0 && alerta > 0 && " · "}
      {alerta > 0 && <span>{alerta} alerta{alerta > 1 ? "s" : ""}</span>}
      {criticos.length > 0 && <span className="text-ink-3"> — {criticos.slice(0, 2).join(", ").toLowerCase()}</span>}
    </span>
  );
}
