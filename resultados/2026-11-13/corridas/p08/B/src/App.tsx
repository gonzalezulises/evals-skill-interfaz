import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  PackageOpen,
  PackageX,
  RefreshCw,
  Search,
  SearchX,
  Warehouse,
  X,
} from "lucide-react";
import { fetchInventario, type Articulo } from "@/lib/api";
import { cn } from "@/lib/utils";

const BODEGAS = ["Panamá Pacífico", "Tocumen", "Colón", "David"] as const;
const TODAS = "Todas";
type Bodega = (typeof BODEGAS)[number] | typeof TODAS;

type Nivel = "agotado" | "bajo" | "ok";
type FiltroEstado = "todos" | "reponer" | "agotado";
type Orden = "prioridad" | "sku" | "existencia" | "valor";

const moneda = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD" });
const monedaCorta = new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});
const entero = new Intl.NumberFormat("es-PA");
const fechaCorta = new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", year: "numeric" });
const hora = new Intl.DateTimeFormat("es-PA", { hour: "2-digit", minute: "2-digit" });

function nivel(a: Articulo): Nivel {
  if (a.existencia === 0) return "agotado";
  if (a.existencia < a.minimo) return "bajo";
  return "ok";
}

const PESO: Record<Nivel, number> = { agotado: 0, bajo: 1, ok: 2 };

function fecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return fechaCorta.format(new Date(y, m - 1, d));
}

type Datos = { bodega: Bodega; items: Articulo[]; hora: Date };

function useInventario(bodega: Bodega) {
  const [datos, setDatos] = useState<Datos | null>(null);
  const [cargando, setCargando] = useState(true);
  const [lento, setLento] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ultima = useRef(0);

  const cargar = useCallback((b: Bodega) => {
    const id = ++ultima.current;
    setCargando(true);
    setLento(false);
    setError(null);
    const aviso = window.setTimeout(() => id === ultima.current && setLento(true), 3000);
    fetchInventario(b === TODAS ? undefined : b)
      .then((items) => {
        if (id === ultima.current) setDatos({ bodega: b, items, hora: new Date() });
      })
      .catch((e: unknown) => {
        if (id === ultima.current) setError(e instanceof Error ? e.message : "Error desconocido");
      })
      .finally(() => {
        window.clearTimeout(aviso);
        if (id === ultima.current) {
          setCargando(false);
          setLento(false);
        }
      });
  }, []);

  useEffect(() => cargar(bodega), [bodega, cargar]);

  // Solo se muestran datos de la bodega elegida; nunca los de la anterior mientras carga.
  const vigentes = datos?.bodega === bodega ? datos : null;
  return { datos: vigentes, cargando, lento, error, recargar: () => cargar(bodega) };
}

export default function App() {
  const [bodega, setBodega] = useState<Bodega>(TODAS);
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroEstado>("todos");
  const [orden, setOrden] = useState<Orden>("prioridad");
  const { datos, cargando, lento, error, recargar } = useInventario(bodega);

  const resumen = useMemo(() => {
    const items = datos?.items ?? [];
    return {
      total: items.length,
      reponer: items.filter((a) => nivel(a) !== "ok").length,
      agotados: items.filter((a) => nivel(a) === "agotado").length,
      valor: items.reduce((s, a) => s + a.existencia * a.costoUnitario, 0),
    };
  }, [datos]);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const lista = (datos?.items ?? []).filter((a) => {
      if (filtro === "reponer" && nivel(a) === "ok") return false;
      if (filtro === "agotado" && nivel(a) !== "agotado") return false;
      return !q || a.sku.toLowerCase().includes(q) || a.descripcion.toLowerCase().includes(q);
    });
    const cmp: Record<Orden, (a: Articulo, b: Articulo) => number> = {
      prioridad: (a, b) =>
        PESO[nivel(a)] - PESO[nivel(b)] || a.existencia / a.minimo - b.existencia / b.minimo,
      sku: (a, b) => a.sku.localeCompare(b.sku),
      existencia: (a, b) => a.existencia - b.existencia,
      valor: (a, b) => b.existencia * b.costoUnitario - a.existencia * a.costoUnitario,
    };
    return [...lista].sort(cmp[orden]);
  }, [datos, busqueda, filtro, orden]);

  const hayFiltros = busqueda.trim() !== "" || filtro !== "todos";
  const limpiarFiltros = () => {
    setBusqueda("");
    setFiltro("todos");
  };
  const nombreBodega = bodega === TODAS ? "todas las bodegas" : `la bodega ${bodega}`;

  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-teal-700">Andes Logística</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Inventario por bodega</h1>
            <p className="mt-1 text-sm text-slate-600" aria-live="polite">
              {datos
                ? `Datos de ${nombreBodega} a las ${hora.format(datos.hora)}`
                : cargando
                  ? `Consultando ${nombreBodega}…`
                  : "Sin datos cargados"}
            </p>
          </div>
          <button
            type="button"
            onClick={recargar}
            disabled={cargando}
            className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-medium shadow-sm hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw className={cn("size-4", cargando && "animate-spin")} aria-hidden />
            {cargando ? "Actualizando…" : "Actualizar"}
          </button>
        </header>

        <nav aria-label="Bodegas" className="-mx-4 mt-6 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <div className="flex w-max gap-2 sm:w-auto sm:flex-wrap">
            {[TODAS, ...BODEGAS].map((b) => (
              <button
                key={b}
                type="button"
                aria-pressed={bodega === b}
                onClick={() => setBodega(b as Bodega)}
                className={cn(
                  "inline-flex min-h-11 items-center gap-2 whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600",
                  bodega === b
                    ? "border-teal-700 bg-teal-700 text-white"
                    : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100",
                )}
              >
                {b !== TODAS && <Warehouse className="size-4" aria-hidden />}
                {b}
              </button>
            ))}
          </div>
        </nav>

        <section aria-label="Resumen" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Cifra etiqueta="Artículos" valor={datos ? entero.format(resumen.total) : cargando ? null : "—"} />
          <Cifra
            etiqueta="Bajo mínimo"
            valor={datos ? entero.format(resumen.reponer) : cargando ? null : "—"}
            tono={resumen.reponer > 0 ? "ambar" : undefined}
          />
          <Cifra
            etiqueta="Agotados"
            valor={datos ? entero.format(resumen.agotados) : cargando ? null : "—"}
            tono={resumen.agotados > 0 ? "rojo" : undefined}
          />
          <Cifra
            etiqueta="Valor en existencia"
            valor={datos ? monedaCorta.format(resumen.valor) : cargando ? null : "—"}
            titulo={datos ? moneda.format(resumen.valor) : undefined}
          />
        </section>

        {error && datos && (
          <div
            role="alert"
            className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900"
          >
            <AlertTriangle className="size-4 shrink-0" aria-hidden />
            <span className="flex-1">
              No se pudo actualizar; se muestran los datos de las {hora.format(datos.hora)}
            </span>
            <button
              type="button"
              onClick={recargar}
              className="min-h-11 rounded-md px-3 font-medium underline underline-offset-2 hover:bg-amber-100 focus-visible:outline-2 focus-visible:outline-amber-700"
            >
              Reintentar
            </button>
          </div>
        )}

        <section
          aria-label="Artículos"
          aria-busy={cargando}
          className="mt-6 rounded-xl border border-slate-200 bg-white shadow-sm"
        >
          {!datos && cargando && <Cargando lento={lento} nombre={nombreBodega} />}

          {!datos && !cargando && error && (
            <Estado
              icono={<AlertTriangle className="size-8 text-red-600" aria-hidden />}
              titulo={`No se pudo cargar el inventario de ${nombreBodega}`}
              texto="El servicio de inventario no respondió. Vuelve a intentarlo en unos segundos."
              detalle={error}
              rol="alert"
              accion={{ texto: "Reintentar", onClick: recargar, icono: <RefreshCw className="size-4" aria-hidden /> }}
            />
          )}

          {datos && datos.items.length === 0 && (
            <Estado
              icono={<PackageOpen className="size-8 text-slate-400" aria-hidden />}
              titulo={bodega === TODAS ? "No hay artículos registrados" : `${bodega} no tiene artículos registrados`}
              texto="La consulta respondió bien, pero sin registros. Si esperabas existencias aquí, revisa con el equipo de la bodega."
              accion={
                bodega === TODAS
                  ? { texto: "Volver a consultar", onClick: recargar }
                  : { texto: "Ver todas las bodegas", onClick: () => setBodega(TODAS) }
              }
            />
          )}

          {datos && datos.items.length > 0 && (
            <div className={cn(cargando && "opacity-60 transition-opacity")}>
              <Herramientas
                busqueda={busqueda}
                setBusqueda={setBusqueda}
                filtro={filtro}
                setFiltro={setFiltro}
                orden={orden}
                setOrden={setOrden}
              />
              <p className="border-b border-slate-200 px-4 py-2 text-xs text-slate-500" aria-live="polite">
                {visibles.length === datos.items.length
                  ? `${entero.format(visibles.length)} artículos`
                  : `${entero.format(visibles.length)} de ${entero.format(datos.items.length)} artículos`}
              </p>

              {visibles.length === 0 ? (
                <Estado
                  icono={<SearchX className="size-8 text-slate-400" aria-hidden />}
                  titulo="Ningún artículo coincide"
                  texto="Prueba con otro SKU o descripción, o quita el filtro de estado."
                  accion={{ texto: "Quitar filtros", onClick: limpiarFiltros }}
                />
              ) : (
                <>
                  <Tabla items={visibles} conBodega={bodega === TODAS} />
                  <Tarjetas items={visibles} conBodega={bodega === TODAS} />
                </>
              )}
              {hayFiltros && visibles.length > 0 && (
                <div className="border-t border-slate-200 px-4 py-3">
                  <button
                    type="button"
                    onClick={limpiarFiltros}
                    className="min-h-11 rounded-md px-2 text-sm font-medium text-teal-700 hover:bg-teal-50 focus-visible:outline-2 focus-visible:outline-teal-600"
                  >
                    Quitar filtros
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

function Cifra({
  etiqueta,
  valor,
  tono,
  titulo,
}: {
  etiqueta: string;
  valor: string | null;
  tono?: "ambar" | "rojo";
  titulo?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-sm text-slate-600">{etiqueta}</p>
      {valor === null ? (
        <div className="mt-2 h-8 w-20 animate-pulse rounded bg-slate-200" aria-hidden />
      ) : (
        <p
          title={titulo}
          className={cn(
            "mt-1 text-2xl font-semibold tabular-nums sm:text-3xl",
            tono === "ambar" && "text-amber-700",
            tono === "rojo" && "text-red-700",
          )}
        >
          {valor}
        </p>
      )}
    </div>
  );
}

function Cargando({ lento, nombre }: { lento: boolean; nombre: string }) {
  return (
    <div>
      <p role="status" className="px-4 pt-4 text-sm text-slate-600">
        {lento
          ? `La consulta de ${nombre} está tardando más de lo normal. Seguimos esperando…`
          : `Cargando inventario de ${nombre}…`}
      </p>
      <ul className="divide-y divide-slate-100 p-4" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => (
          <li key={i} className="flex items-center gap-4 py-3">
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-100" />
            <div className="hidden h-4 w-16 animate-pulse rounded bg-slate-200 sm:block" />
            <div className="h-5 w-20 animate-pulse rounded-full bg-slate-100" />
          </li>
        ))}
      </ul>
    </div>
  );
}

function Estado({
  icono,
  titulo,
  texto,
  detalle,
  accion,
  rol,
}: {
  icono: ReactNode;
  titulo: string;
  texto: string;
  detalle?: string;
  accion: { texto: string; onClick: () => void; icono?: ReactNode };
  rol?: "alert";
}) {
  return (
    <div role={rol} className="flex flex-col items-center px-6 py-14 text-center">
      {icono}
      <h2 className="mt-3 text-lg font-semibold">{titulo}</h2>
      <p className="mt-1 max-w-md text-sm text-slate-600">{texto}</p>
      {detalle && <p className="mt-2 font-mono text-xs text-slate-500">{detalle}</p>}
      <button
        type="button"
        onClick={accion.onClick}
        className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-teal-700 px-5 text-sm font-medium text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600"
      >
        {accion.icono}
        {accion.texto}
      </button>
    </div>
  );
}

function Herramientas(p: {
  busqueda: string;
  setBusqueda: (v: string) => void;
  filtro: FiltroEstado;
  setFiltro: (v: FiltroEstado) => void;
  orden: Orden;
  setOrden: (v: Orden) => void;
}) {
  const campo =
    "min-h-11 rounded-lg border border-slate-300 bg-white px-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-teal-600";
  return (
    <div className="flex flex-col gap-3 border-b border-slate-200 p-4 sm:flex-row sm:items-end">
      <label className="flex-1">
        <span className="text-xs font-medium text-slate-600">Buscar</span>
        <span className="relative mt-1 block">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-400" aria-hidden />
          <input
            type="search"
            value={p.busqueda}
            onChange={(e) => p.setBusqueda(e.target.value)}
            placeholder="SKU o descripción"
            className={cn(campo, "w-full pl-9 pr-10")}
          />
          {p.busqueda && (
            <button
              type="button"
              onClick={() => p.setBusqueda("")}
              aria-label="Borrar búsqueda"
              className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-slate-500 hover:bg-slate-100 focus-visible:outline-2 focus-visible:outline-teal-600"
            >
              <X className="size-4" aria-hidden />
            </button>
          )}
        </span>
      </label>
      <div className="grid grid-cols-2 gap-3 sm:flex">
        <label>
          <span className="text-xs font-medium text-slate-600">Estado</span>
          <select
            value={p.filtro}
            onChange={(e) => p.setFiltro(e.target.value as FiltroEstado)}
            className={cn(campo, "mt-1 block w-full")}
          >
            <option value="todos">Todos</option>
            <option value="reponer">Bajo mínimo</option>
            <option value="agotado">Agotados</option>
          </select>
        </label>
        <label>
          <span className="text-xs font-medium text-slate-600">Ordenar por</span>
          <select
            value={p.orden}
            onChange={(e) => p.setOrden(e.target.value as Orden)}
            className={cn(campo, "mt-1 block w-full")}
          >
            <option value="prioridad">Urgencia</option>
            <option value="sku">SKU</option>
            <option value="existencia">Menor existencia</option>
            <option value="valor">Mayor valor</option>
          </select>
        </label>
      </div>
    </div>
  );
}

const ESTILO_NIVEL: Record<Nivel, { texto: string; clase: string; barra: string }> = {
  agotado: { texto: "Agotado", clase: "bg-red-50 text-red-700 ring-red-200", barra: "bg-red-500" },
  bajo: { texto: "Bajo mínimo", clase: "bg-amber-50 text-amber-800 ring-amber-200", barra: "bg-amber-500" },
  ok: { texto: "Normal", clase: "bg-emerald-50 text-emerald-700 ring-emerald-200", barra: "bg-emerald-500" },
};

function Insignia({ a }: { a: Articulo }) {
  const e = ESTILO_NIVEL[nivel(a)];
  return (
    <span className={cn("inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset", e.clase)}>
      {e.texto}
    </span>
  );
}

function Cobertura({ a }: { a: Articulo }) {
  const pct = Math.min(100, (a.existencia / (a.minimo * 2)) * 100);
  return (
    <div className="mt-1 h-1.5 w-full rounded-full bg-slate-100" aria-hidden>
      <div className={cn("h-full rounded-full", ESTILO_NIVEL[nivel(a)].barra)} style={{ width: `${pct}%` }} />
    </div>
  );
}

function Tabla({ items, conBodega }: { items: Articulo[]; conBodega: boolean }) {
  const th = "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500";
  return (
    <div className="hidden lg:block">
      <table className="w-full text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr>
            <th className={th}>SKU</th>
            <th className={th}>Descripción</th>
            {conBodega && <th className={th}>Bodega</th>}
            <th className={cn(th, "text-right")}>Existencia</th>
            <th className={th}>Estado</th>
            <th className={cn(th, "text-right")}>Costo unit.</th>
            <th className={cn(th, "text-right")}>Valor</th>
            <th className={th}>Último mov.</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {items.map((a) => (
            <tr key={a.sku} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-mono text-xs text-slate-600">{a.sku}</td>
              <td className="px-4 py-3 font-medium">{a.descripcion}</td>
              {conBodega && <td className="px-4 py-3 text-slate-600">{a.bodega}</td>}
              <td className="px-4 py-3 text-right tabular-nums">
                <span className="font-semibold">{entero.format(a.existencia)}</span>{" "}
                <span className="text-slate-500">{a.unidad}</span>
                <span className="block text-xs text-slate-500">mín. {entero.format(a.minimo)}</span>
              </td>
              <td className="px-4 py-3">
                <Insignia a={a} />
              </td>
              <td className="px-4 py-3 text-right tabular-nums text-slate-600">{moneda.format(a.costoUnitario)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{moneda.format(a.existencia * a.costoUnitario)}</td>
              <td className="px-4 py-3 whitespace-nowrap text-slate-600">{fecha(a.ultimoMovimiento)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Tarjetas({ items, conBodega }: { items: Articulo[]; conBodega: boolean }) {
  return (
    <ul className="grid gap-3 p-4 sm:grid-cols-2 lg:hidden">
      {items.map((a) => (
        <li key={a.sku} className="rounded-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-medium">{a.descripcion}</p>
              <p className="font-mono text-xs text-slate-500">
                {a.sku}
                {conBodega && <span className="font-sans"> · {a.bodega}</span>}
              </p>
            </div>
            <Insignia a={a} />
          </div>
          <div className="mt-3 flex items-baseline justify-between text-sm">
            <span>
              <span className="text-lg font-semibold tabular-nums">{entero.format(a.existencia)}</span>{" "}
              <span className="text-slate-500">{a.unidad}</span>
            </span>
            <span className="text-xs text-slate-500">mín. {entero.format(a.minimo)}</span>
          </div>
          <Cobertura a={a} />
          <dl className="mt-3 grid grid-cols-2 gap-x-3 text-xs">
            <dt className="text-slate-500">Valor</dt>
            <dd className="text-right tabular-nums">{moneda.format(a.existencia * a.costoUnitario)}</dd>
            <dt className="text-slate-500">Último mov.</dt>
            <dd className="text-right">{fecha(a.ultimoMovimiento)}</dd>
          </dl>
        </li>
      ))}
    </ul>
  );
}
