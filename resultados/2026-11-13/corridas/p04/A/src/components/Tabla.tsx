import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";
import { INDICADORES, type ClaveIndicador, type Proyecto } from "@/lib/proyectos";
import { IconoEstado, InsigniaRiesgo, fondoEstado } from "@/components/ui";
import { cn } from "@/lib/utils";

interface Props {
  proyectos: Proyecto[];
  orden: { clave: ClaveIndicador | "nombre"; dir: 1 | -1 } | null;
  onOrdenar: (clave: ClaveIndicador | "nombre") => void;
  onAbrir: (p: Proyecto, origen: HTMLElement) => void;
}

/**
 * Matriz 40 × 12 con cabecera y primera columna fijas; el scroll horizontal queda dentro del
 * contenedor, nunca en la página. Patrón base: «Records Table» de 21st.dev (id 23604).
 */
export function Tabla({ proyectos, orden, onOrdenar, onAbrir }: Props) {
  const Flecha = ({ clave }: { clave: ClaveIndicador | "nombre" }) =>
    orden?.clave === clave ? (
      orden.dir === 1 ? <ArrowUp className="size-3.5" aria-hidden="true" /> : <ArrowDown className="size-3.5" aria-hidden="true" />
    ) : (
      <ArrowUpDown className="size-3.5 opacity-40" aria-hidden="true" />
    );
  const ariaSort = (clave: ClaveIndicador | "nombre") =>
    orden?.clave === clave ? (orden.dir === 1 ? "ascending" : "descending") : undefined;

  return (
    <div
      className="max-h-[72vh] overflow-auto rounded-xl border border-line bg-surface"
      tabIndex={0}
      role="region"
      aria-label="Tabla de proyectos. Desliza en horizontal para ver los 12 indicadores."
    >
      <table className="w-max min-w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Proyectos activos y sus 12 indicadores</caption>
        <thead>
          <tr>
            <th
              scope="col"
              aria-sort={ariaSort("nombre")}
              className="sticky top-0 left-0 z-30 border-r border-b border-line bg-surface-2 p-0 text-left"
            >
              <button
                type="button"
                onClick={() => onOrdenar("nombre")}
                className="flex h-11 w-44 cursor-pointer items-center gap-1 px-3 text-xs font-semibold text-ink-2 sm:w-64"
              >
                Proyecto <Flecha clave="nombre" />
              </button>
            </th>
            {INDICADORES.map((i) => (
              <th
                key={i.clave}
                scope="col"
                aria-sort={ariaSort(i.clave)}
                className="sticky top-0 z-20 border-b border-line bg-surface-2 p-0 text-right"
              >
                <button
                  type="button"
                  title={`Ordenar por ${i.etiqueta.toLowerCase()}`}
                  onClick={() => onOrdenar(i.clave)}
                  className="flex h-11 w-full cursor-pointer items-center justify-end gap-1 px-3 text-xs font-semibold whitespace-nowrap text-ink-2"
                >
                  {i.corta} <Flecha clave={i.clave} />
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {proyectos.map((p) => (
            <tr key={p.id} className="group">
              <th
                scope="row"
                className="sticky left-0 z-10 border-r border-b border-line bg-surface p-0 text-left font-normal group-hover:bg-surface-2"
              >
                <button
                  type="button"
                  onClick={(e) => onAbrir(p, e.currentTarget)}
                  className="block min-h-11 w-44 cursor-pointer px-3 py-1.5 text-left sm:w-64"
                  aria-label={`${p.nombre}: ver detalle`}
                >
                  <span className="line-clamp-2 text-sm leading-snug font-medium text-accent-ink underline-offset-2 group-hover:underline">
                    {p.nombre}
                  </span>
                  <span className="block truncate text-xs text-ink-3">
                    {p.id} · {p.gerente}
                  </span>
                </button>
              </th>
              {INDICADORES.map((i) => {
                const e = i.estado(p);
                return (
                  <td
                    key={i.clave}
                    className={cn(
                      "border-b border-line px-3 text-right whitespace-nowrap tabular-nums group-hover:brightness-95",
                      i.clave !== "riesgo" && fondoEstado(e),
                    )}
                  >
                    {i.clave === "riesgo" ? (
                      <InsigniaRiesgo riesgo={p.riesgo} />
                    ) : (
                      <span className="inline-flex items-center gap-1">
                        {e !== "ok" && <IconoEstado estado={e} className="size-3.5" />}
                        {i.texto(p)}
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
