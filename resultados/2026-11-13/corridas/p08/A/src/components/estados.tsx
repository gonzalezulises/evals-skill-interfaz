import type { ReactNode } from "react";
import { Clock, PackageX, RefreshCw, SearchX, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

// Patrón de estado vacío/error adaptado de 21st.dev «Error Empty State» (id 19376) y
// del esqueleto de tabla «Empty Table» (id 29396) / «Data Table Skeleton» (id 19002).

const botonBase =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700";
export const botonPrimario = cn(botonBase, "bg-teal-700 text-white hover:bg-teal-800");
export const botonSecundario = cn(botonBase, "border border-slate-300 bg-white text-slate-800 hover:bg-slate-50");

function Aviso({
  icono,
  tono,
  titulo,
  children,
  acciones,
}: {
  icono: ReactNode;
  tono: "neutro" | "error";
  titulo: string;
  children: ReactNode;
  acciones?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span
        aria-hidden="true"
        className={cn(
          "grid size-12 place-items-center rounded-full",
          tono === "error" ? "bg-rose-50 text-rose-700" : "bg-slate-100 text-slate-600",
        )}
      >
        {icono}
      </span>
      <h2 className="mt-4 text-base font-semibold text-slate-900">{titulo}</h2>
      <div className="mt-1.5 max-w-md text-sm text-pretty text-slate-600">{children}</div>
      {acciones && <div className="mt-5 flex flex-col gap-2 sm:flex-row">{acciones}</div>}
    </div>
  );
}

export function EstadoError({ bodega, detalle, onReintentar }: { bodega: string; detalle: string; onReintentar: () => void }) {
  return (
    <div role="alert">
      <Aviso
        tono="error"
        icono={<TriangleAlert className="size-6" />}
        titulo={`No pudimos cargar el inventario de ${bodega}`}
        acciones={
          <button type="button" className={botonPrimario} onClick={onReintentar}>
            <RefreshCw aria-hidden="true" className="size-4" /> Reintentar
          </button>
        }
      >
        <p>La API de inventario no respondió. Suele ser momentáneo: vuelve a intentarlo en unos segundos. Tus filtros se mantienen.</p>
        <p className="mt-2 font-mono text-xs text-slate-500">Detalle: {detalle}</p>
      </Aviso>
    </div>
  );
}

export function EstadoBodegaVacia({
  bodega,
  onReintentar,
  onVerTodas,
}: {
  bodega: string;
  onReintentar: () => void;
  onVerTodas?: () => void;
}) {
  return (
    <Aviso
      tono="neutro"
      icono={<PackageX className="size-6" />}
      titulo={`${bodega} no tiene artículos registrados`}
      acciones={
        <>
          {onVerTodas && (
            <button type="button" className={botonPrimario} onClick={onVerTodas}>
              Ver todas las bodegas
            </button>
          )}
          <button type="button" className={botonSecundario} onClick={onReintentar}>
            <RefreshCw aria-hidden="true" className="size-4" /> Volver a consultar
          </button>
        </>
      }
    >
      La consulta funcionó, pero la bodega no tiene existencias cargadas. Si esperabas ver artículos, puede que el registro
      de entradas aún no se haya sincronizado: vuelve a consultar más tarde o avisa al encargado de la bodega.
    </Aviso>
  );
}

export function EstadoSinCoincidencias({ onLimpiar }: { onLimpiar: () => void }) {
  return (
    <Aviso
      tono="neutro"
      icono={<SearchX className="size-6" />}
      titulo="Ningún artículo coincide con los filtros"
      acciones={
        <button type="button" className={botonSecundario} onClick={onLimpiar}>
          Limpiar filtros
        </button>
      }
    >
      Prueba con otra palabra o con otro estado. La bodega sí tiene artículos.
    </Aviso>
  );
}

export function AvisoLento() {
  return (
    <p className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-900">
      <Clock aria-hidden="true" className="size-4 shrink-0" />
      La API está tardando más de lo normal. Seguimos esperando la respuesta.
    </p>
  );
}

const pulso = "animate-pulse rounded bg-slate-200 motion-reduce:animate-none";

export function EsqueletoKpis() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-hidden="true">
      <div className="rounded-xl border border-slate-200 bg-white p-5 sm:col-span-2 lg:row-span-2">
        <div className={cn(pulso, "h-4 w-28")} />
        <div className={cn(pulso, "mt-4 h-10 w-20")} />
        <div className={cn(pulso, "mt-3 h-3 w-48")} />
        <div className={cn(pulso, "mt-6 h-11 w-36")} />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className={cn("rounded-xl border border-slate-200 bg-white p-5", i === 2 && "sm:col-span-2")}>
          <div className={cn(pulso, "h-3.5 w-24")} />
          <div className={cn(pulso, "mt-3 h-7 w-28")} />
        </div>
      ))}
    </div>
  );
}

export function EsqueletoFilas() {
  return (
    <ul aria-hidden="true" className="divide-y divide-slate-100">
      {Array.from({ length: 7 }, (_, i) => (
        <li key={i} className="flex items-center gap-4 px-4 py-4">
          <div className="min-w-0 flex-1">
            <div className={cn(pulso, "h-4 w-2/5")} />
            <div className={cn(pulso, "mt-2 h-3 w-20")} />
          </div>
          <div className={cn(pulso, "hidden h-2 w-28 md:block")} />
          <div className={cn(pulso, "h-6 w-20 rounded-full")} />
        </li>
      ))}
    </ul>
  );
}
