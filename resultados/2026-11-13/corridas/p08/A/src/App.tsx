import { useEffect, useMemo, useState } from "react";
import { RefreshCw, Search, Warehouse } from "lucide-react";
import type { Articulo } from "@/lib/api";
import { BODEGAS, ESTADO_META, estadoDe, fmt, useInventario, type Estado } from "@/lib/inventario";
import { cn } from "@/lib/utils";
import { DetalleArticulo, TablaArticulos } from "@/components/articulos";
import {
  AvisoLento,
  EsqueletoFilas,
  EsqueletoKpis,
  EstadoBodegaVacia,
  EstadoError,
  EstadoSinCoincidencias,
  botonPrimario,
} from "@/components/estados";

type FiltroEstado = "todos" | "reponer" | Estado;
const TODAS = "todas";
const PASO = 30;

function bodegaInicial(): string {
  const b = new URLSearchParams(window.location.search).get("bodega");
  return b && (BODEGAS as readonly string[]).includes(b) ? b : TODAS;
}

export default function App() {
  const [bodega, setBodega] = useState(bodegaInicial);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [visibles, setVisibles] = useState(PASO);
  const [abierto, setAbierto] = useState<Articulo | null>(null);
  const { carga, lento, reintentar } = useInventario(bodega === TODAS ? undefined : bodega);
  const nombreBodega = bodega === TODAS ? "todas las bodegas" : bodega;

  // La bodega elegida queda en la URL para poder compartirla o recargar sin perderla.
  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    if (bodega === TODAS) p.delete("bodega");
    else p.set("bodega", bodega);
    const q = p.toString();
    window.history.replaceState(null, "", q ? `?${q}` : window.location.pathname);
  }, [bodega]);

  useEffect(() => setVisibles(PASO), [bodega, busqueda, filtro]);

  const articulos = carga.tipo === "listo" ? carga.articulos : [];

  const resumen = useMemo(() => {
    const cuenta: Record<Estado, number> = { agotado: 0, bajo: 0, ok: 0 };
    let valor = 0;
    let reponer = 0;
    for (const a of articulos) {
      cuenta[estadoDe(a)]++;
      valor += a.existencia * a.costoUnitario;
      reponer += Math.max(0, a.minimo - a.existencia) * a.costoUnitario;
    }
    return { cuenta, valor, reponer, total: articulos.length, criticos: cuenta.agotado + cuenta.bajo };
  }, [articulos]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLocaleLowerCase("es");
    return articulos
      .filter((a) => filtro === "todos" || estadoDe(a) === filtro || (filtro === "reponer" && estadoDe(a) !== "ok"))
      .filter((a) => !q || a.descripcion.toLocaleLowerCase("es").includes(q) || a.sku.toLocaleLowerCase("es").includes(q))
      .sort(
        (x, y) =>
          ESTADO_META[estadoDe(x)].orden - ESTADO_META[estadoDe(y)].orden ||
          x.existencia / x.minimo - y.existencia / y.minimo,
      );
  }, [articulos, busqueda, filtro]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltro("todos");
  };

  const anuncio =
    carga.tipo === "cargando"
      ? `Cargando inventario de ${nombreBodega}`
      : carga.tipo === "error"
        ? `Error al cargar el inventario de ${nombreBodega}`
        : `${filtrados.length} artículos de ${nombreBodega}`;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 antialiased">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-end justify-between gap-x-6 gap-y-3 px-4 py-5 sm:px-6">
          <div>
            <p className="flex items-center gap-1.5 text-sm font-medium text-teal-800">
              <Warehouse aria-hidden="true" className="size-4" /> Andes Logística
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">Inventario por bodega</h1>
          </div>
          <div className="flex items-center gap-3 text-sm text-slate-600">
            <span aria-live="off">
              {carga.tipo === "listo" ? `Datos de las ${fmt.hora(carga.cargadoEn)}` : carga.tipo === "cargando" ? "Consultando…" : "Sin datos"}
            </span>
            <button
              type="button"
              onClick={reintentar}
              disabled={carga.tipo === "cargando"}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3.5 font-medium text-slate-800 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-wait disabled:opacity-60"
            >
              <RefreshCw aria-hidden="true" className={cn("size-4", carga.tipo === "cargando" && "animate-spin motion-reduce:animate-none")} />
              Actualizar
            </button>
          </div>
        </div>

        <nav aria-label="Bodegas" className="mx-auto max-w-6xl">
          <ul className="flex gap-1 overflow-x-auto px-4 sm:px-6">
            {[TODAS, ...BODEGAS].map((b) => {
              const activa = b === bodega;
              return (
                <li key={b} className="shrink-0">
                  <button
                    type="button"
                    aria-pressed={activa}
                    onClick={() => setBodega(b)}
                    className={cn(
                      "min-h-11 border-b-2 px-3 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700",
                      activa ? "border-teal-700 text-teal-800" : "border-transparent text-slate-600 hover:text-slate-900",
                    )}
                  >
                    {b === TODAS ? "Todas" : b}
                  </button>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <p className="sr-only" aria-live="polite">
          {anuncio}
        </p>

        {/* Cifras: una protagonista (lo que hay que reponer) y tres de contexto. */}
        {carga.tipo === "cargando" && <EsqueletoKpis />}
        {carga.tipo === "listo" && resumen.total > 0 && (
          <section aria-label="Resumen" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <article className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 lg:row-span-2">
              <h2 className="text-sm font-medium text-slate-600">Artículos por reponer</h2>
              <p className="mt-2 flex items-baseline gap-2">
                <span className={cn("text-5xl font-semibold tabular-nums", resumen.criticos ? "text-amber-800" : "text-emerald-800")}>
                  {fmt.numero(resumen.criticos)}
                </span>
                <span className="text-sm text-slate-600">
                  de {fmt.numero(resumen.total)} ({Math.round((resumen.criticos / resumen.total) * 100)} %)
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-700">
                {resumen.cuenta.agotado} {resumen.cuenta.agotado === 1 ? "agotado" : "agotados"} · {resumen.cuenta.bajo} bajo el mínimo
              </p>
              {/* Proporción por estado */}
              <div className="mt-4 flex h-2 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
                {(["agotado", "bajo", "ok"] as const).map((e) => (
                  <span key={e} className={ESTADO_META[e].barra} style={{ width: `${(resumen.cuenta[e] / resumen.total) * 100}%` }} />
                ))}
              </div>
              {resumen.criticos > 0 && (
                <div className="mt-auto pt-5">
                  <button
                    type="button"
                    className={botonPrimario}
                    onClick={() => {
                      setFiltro("reponer");
                      document.getElementById("articulos")?.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                  >
                    Ver los que faltan
                  </button>
                </div>
              )}
            </article>
            <Kpi etiqueta="Valor del inventario" valor={fmt.dinero(resumen.valor)} />
            <Kpi etiqueta="Artículos (SKU)" valor={fmt.numero(resumen.total)} />
            <Kpi
              etiqueta="Costo de reponer al mínimo"
              valor={fmt.dinero(resumen.reponer)}
              nota={resumen.reponer ? "Compra necesaria para llevar cada artículo a su mínimo" : "Todo está en su mínimo o por encima"}
              alerta={resumen.reponer > 0}
              className="sm:col-span-2"
            />
          </section>
        )}

        <section id="articulos" aria-labelledby="articulos-titulo" className="scroll-mt-4 overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 px-4 py-4">
            <h2 id="articulos-titulo" className="text-base font-semibold">
              Artículos · <span className="font-normal text-slate-600">{bodega === TODAS ? "Todas las bodegas" : bodega}</span>
            </h2>
            {carga.tipo === "listo" && resumen.total > 0 && (
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-end">
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Buscar</span>
                  <span className="relative block">
                    <Search aria-hidden="true" className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="search"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Descripción o SKU"
                      className="min-h-11 w-full rounded-lg border border-slate-300 bg-white pr-3 pl-9 text-base sm:w-56 sm:text-sm focus-visible:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700/30"
                    />
                  </span>
                </label>
                <label className="block text-sm">
                  <span className="mb-1 block font-medium text-slate-700">Estado</span>
                  <select
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as FiltroEstado)}
                    className="min-h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-base sm:w-48 sm:text-sm focus-visible:border-teal-700 focus-visible:outline-2 focus-visible:outline-teal-700/30"
                  >
                    <option value="todos">Todos ({resumen.total})</option>
                    <option value="reponer">Por reponer ({resumen.criticos})</option>
                    <option value="agotado">Agotados ({resumen.cuenta.agotado})</option>
                    <option value="bajo">Bajo mínimo ({resumen.cuenta.bajo})</option>
                    <option value="ok">En nivel ({resumen.cuenta.ok})</option>
                  </select>
                </label>
              </div>
            )}
          </div>

          <div aria-busy={carga.tipo === "cargando"}>
            {carga.tipo === "cargando" && (
              <>
                {lento && <AvisoLento />}
                <EsqueletoFilas />
              </>
            )}
            {carga.tipo === "error" && <EstadoError bodega={nombreBodega} detalle={carga.mensaje} onReintentar={reintentar} />}
            {carga.tipo === "listo" && resumen.total === 0 && (
              <EstadoBodegaVacia
                bodega={bodega === TODAS ? "Ninguna bodega" : bodega}
                onReintentar={reintentar}
                onVerTodas={bodega === TODAS ? undefined : () => setBodega(TODAS)}
              />
            )}
            {carga.tipo === "listo" && resumen.total > 0 && filtrados.length === 0 && <EstadoSinCoincidencias onLimpiar={limpiarFiltros} />}
            {carga.tipo === "listo" && filtrados.length > 0 && (
              <>
                <TablaArticulos articulos={filtrados.slice(0, visibles)} mostrarBodega={bodega === TODAS} onAbrir={setAbierto} />
                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm text-slate-600">
                  <span>
                    Mostrando {Math.min(visibles, filtrados.length)} de {filtrados.length}
                  </span>
                  {visibles < filtrados.length && (
                    <button
                      type="button"
                      onClick={() => setVisibles((v) => v + PASO)}
                      className="min-h-11 rounded-lg px-3 font-medium text-teal-800 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-700"
                    >
                      Mostrar {Math.min(PASO, filtrados.length - visibles)} más
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </section>
      </main>

      <DetalleArticulo articulo={abierto} onCerrar={() => setAbierto(null)} />
    </div>
  );
}

function Kpi({
  etiqueta,
  valor,
  nota,
  alerta,
  className,
}: {
  etiqueta: string;
  valor: string;
  nota?: string;
  alerta?: boolean;
  className?: string;
}) {
  return (
    <article className={cn("rounded-xl border border-slate-200 bg-white p-5", className)}>
      <h2 className="text-sm font-medium text-slate-600">{etiqueta}</h2>
      <p className={cn("mt-1 text-2xl font-semibold tabular-nums", alerta ? "text-rose-800" : "text-slate-900")}>{valor}</p>
      {nota && <p className="mt-0.5 text-sm text-slate-600">{nota}</p>}
    </article>
  );
}
