import { useEffect, useRef } from "react";
import { ChevronRight, X } from "lucide-react";
import type { Articulo } from "@/lib/api";
import { ESTADO_META, estadoDe, fmt, type Estado } from "@/lib/inventario";
import { cn } from "@/lib/utils";

// Barra de existencia con color por umbral y chip de estado: adaptados de 21st.dev
// «Inventory Table» (id 29962, @arihantcodes) y del primitivo «Table» (id 19768, @cnippet-dev).

export function ChipEstado({ estado }: { estado: Estado }) {
  const m = ESTADO_META[estado];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset", m.chip)}>
      <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
      {m.etiqueta}
    </span>
  );
}

/** La marca vertical es el mínimo; la barra llena hasta el doble del mínimo. */
function BarraExistencia({ a, className }: { a: Articulo; className?: string }) {
  const tope = Math.max(a.minimo * 2, 1);
  const ancho = Math.min(100, (a.existencia / tope) * 100);
  return (
    <span aria-hidden="true" className={cn("relative block h-1.5 overflow-hidden rounded-full bg-slate-100", className)}>
      <span className={cn("block h-full rounded-full", ESTADO_META[estadoDe(a)].barra)} style={{ width: `${ancho}%` }} />
      <span className="absolute inset-y-0 left-1/2 w-px bg-slate-500" />
    </span>
  );
}

export function TablaArticulos({
  articulos,
  mostrarBodega,
  onAbrir,
}: {
  articulos: Articulo[];
  mostrarBodega: boolean;
  onAbrir: (a: Articulo) => void;
}) {
  return (
    <>
      {/* ≥ 768 px: tabla */}
      <div className="hidden md:block">
        <table className="w-full table-fixed text-sm">
          <caption className="sr-only">Artículos de la bodega con existencia, mínimo de reposición y estado</caption>
          <thead className="border-b border-slate-200 bg-slate-50 text-left text-xs font-medium tracking-wide text-slate-600 uppercase">
            <tr>
              <th scope="col" className="w-[34%] px-4 py-3">Artículo</th>
              {mostrarBodega && <th scope="col" className="hidden w-[14%] px-3 py-3 lg:table-cell">Bodega</th>}
              <th scope="col" className="w-[22%] px-3 py-3 text-right">Existencia / mínimo</th>
              <th scope="col" className="w-[15%] px-3 py-3">Estado</th>
              <th scope="col" className="w-[13%] px-3 py-3 text-right">Valor</th>
              <th scope="col" className="hidden w-[13%] px-4 py-3 text-right lg:table-cell">Últ. movimiento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {articulos.map((a) => (
              <tr key={`${a.sku}-${a.bodega}`} className="cursor-pointer hover:bg-slate-50" onClick={() => onAbrir(a)}>
                <td className="px-4 py-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onAbrir(a);
                    }}
                    className="-mx-2 flex min-h-11 w-[calc(100%+1rem)] cursor-pointer flex-col justify-center rounded-md px-2 text-left focus-visible:outline-2 focus-visible:outline-teal-700"
                    aria-label={`Ver detalle de ${a.descripcion}, ${a.sku}`}
                  >
                    <span className="block truncate font-medium text-slate-900">{a.descripcion}</span>
                    <span className="block font-mono text-xs text-slate-500">{a.sku}</span>
                  </button>
                </td>
                {mostrarBodega && <td className="hidden truncate px-3 py-2 text-slate-700 lg:table-cell">{a.bodega}</td>}
                <td className="px-3 py-2 text-right">
                  <span className="tabular-nums text-slate-900">
                    <span className="font-semibold">{fmt.numero(a.existencia)}</span>
                    <span className="text-slate-500"> / {fmt.numero(a.minimo)} {a.unidad}</span>
                  </span>
                  <BarraExistencia a={a} className="mt-1.5 ml-auto w-full max-w-36" />
                </td>
                <td className="px-3 py-2">
                  <ChipEstado estado={estadoDe(a)} />
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-800">{fmt.dinero(a.existencia * a.costoUnitario)}</td>
                <td className="hidden px-4 py-2 text-right whitespace-nowrap text-slate-600 lg:table-cell">{fmt.fecha(a.ultimoMovimiento)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < 768 px: tarjetas */}
      <ul className="divide-y divide-slate-100 md:hidden">
        {articulos.map((a) => (
          <li key={`${a.sku}-${a.bodega}`}>
            <button
              type="button"
              onClick={() => onAbrir(a)}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left hover:bg-slate-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700"
              aria-label={`Ver detalle de ${a.descripcion}, ${a.sku}`}
            >
              <span className="min-w-0 flex-1">
                <span className="flex items-start justify-between gap-2">
                  <span className="min-w-0">
                    <span className="block truncate font-medium text-slate-900">{a.descripcion}</span>
                    <span className="block font-mono text-xs text-slate-500">
                      {a.sku}
                      {mostrarBodega && ` · ${a.bodega}`}
                    </span>
                  </span>
                  <ChipEstado estado={estadoDe(a)} />
                </span>
                <span className="mt-2.5 flex items-center gap-3 text-sm">
                  <span className="shrink-0 tabular-nums">
                    <span className="font-semibold text-slate-900">{fmt.numero(a.existencia)}</span>
                    <span className="text-slate-500"> / {fmt.numero(a.minimo)} {a.unidad}</span>
                  </span>
                  <BarraExistencia a={a} className="flex-1" />
                </span>
              </span>
              <ChevronRight aria-hidden="true" className="size-4 shrink-0 text-slate-400" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2.5">
      <dt className="text-sm text-slate-600">{etiqueta}</dt>
      <dd className={cn("text-right tabular-nums", destacado ? "font-semibold text-slate-900" : "text-slate-800")}>{valor}</dd>
    </div>
  );
}

export function DetalleArticulo({ articulo, onCerrar }: { articulo: Articulo | null; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (articulo && !d.open) d.showModal();
    if (!articulo && d.open) d.close();
  }, [articulo]);

  const a = articulo;
  const faltante = a ? Math.max(0, a.minimo - a.existencia) : 0;

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      aria-labelledby="detalle-titulo"
      className="m-0 mt-auto max-h-[85dvh] w-full max-w-none rounded-t-2xl bg-white p-0 shadow-xl backdrop:bg-slate-900/40 md:mt-0 md:ml-auto md:h-dvh md:max-h-none md:w-[26rem] md:rounded-none"
    >
      {a && (
        <div className="flex h-full flex-col">
          <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="min-w-0">
              <p className="font-mono text-xs text-slate-500">
                {a.sku} · {a.bodega}
              </p>
              <h2 id="detalle-titulo" className="mt-0.5 text-lg font-semibold text-slate-900">
                {a.descripcion}
              </h2>
              <div className="mt-2">
                <ChipEstado estado={estadoDe(a)} />
              </div>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              className="-mr-2 grid size-11 shrink-0 place-items-center rounded-lg text-slate-600 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-700"
              aria-label="Cerrar detalle"
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>
          <div className="overflow-y-auto px-5 py-4">
            <p className="text-sm text-slate-600">Existencia frente al mínimo de reposición</p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-slate-900">
              {fmt.numero(a.existencia)} <span className="text-base font-normal text-slate-500">/ {fmt.numero(a.minimo)} {a.unidad}</span>
            </p>
            <BarraExistencia a={a} className="mt-3 h-2" />
            <dl className="mt-4 divide-y divide-slate-100 border-t border-slate-100">
              <Dato etiqueta="Faltante para el mínimo" valor={faltante ? `${fmt.numero(faltante)} ${a.unidad}` : "Ninguno"} destacado={faltante > 0} />
              <Dato etiqueta="Costo de reponer al mínimo" valor={fmt.dineroCent(faltante * a.costoUnitario)} destacado={faltante > 0} />
              <Dato etiqueta="Costo unitario" valor={fmt.dineroCent(a.costoUnitario)} />
              <Dato etiqueta="Valor en existencia" valor={fmt.dineroCent(a.existencia * a.costoUnitario)} />
              <Dato etiqueta="Último movimiento" valor={fmt.fecha(a.ultimoMovimiento)} />
            </dl>
          </div>
        </div>
      )}
    </dialog>
  );
}
