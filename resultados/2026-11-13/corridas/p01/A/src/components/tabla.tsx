import { ArrowDown, ArrowUp, ArrowUpDown, ChevronLeft, ChevronRight, ChevronRight as Abrir, SearchX } from "lucide-react";
import { cn } from "@/lib/utils";
import { diasAtraso, fmt, type Orden } from "@/lib/ordenes";
import { AtrasoBadge, EstadoBadge, focusRing } from "./ui";

export type SortKey = "id" | "proveedor" | "fechaEntregaPrometida" | "atraso" | "monto";
export type Sort = { key: SortKey; dir: "asc" | "desc" };

export function ordenar(rows: Orden[], sort: Sort, hoy: string): Orden[] {
  const dir = sort.dir === "asc" ? 1 : -1;
  const val = (o: Orden) => (sort.key === "atraso" ? diasAtraso(o, hoy) : o[sort.key]);
  return [...rows].sort((a, b) => {
    const av = val(a), bv = val(b);
    const c = typeof av === "number" && typeof bv === "number" ? av - bv : String(av).localeCompare(String(bv), "es");
    return c * dir || a.id.localeCompare(b.id);
  });
}

function Th({ k, label, sort, onSort, className }: { k: SortKey; label: string; sort: Sort; onSort: (k: SortKey) => void; className?: string }) {
  const on = sort.key === k;
  const Icon = on ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <th scope="col" aria-sort={on ? (sort.dir === "asc" ? "ascending" : "descending") : "none"} className={cn("px-3 py-0 font-medium", className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn("inline-flex h-10 cursor-pointer items-center gap-1 rounded-md text-xs font-medium hover:text-ink", on ? "text-ink" : "text-soft", focusRing)}
      >
        {label}
        <Icon aria-hidden="true" className="size-3.5" />
      </button>
    </th>
  );
}

export function TablaOrdenes({ rows, total, hoy, sort, onSort, page, pages, onPage, onOpen, onLimpiar }: {
  rows: Orden[];
  total: number;
  hoy: string;
  sort: Sort;
  onSort: (k: SortKey) => void;
  page: number;
  pages: number;
  onPage: (p: number) => void;
  onOpen: (o: Orden) => void;
  onLimpiar: () => void;
}) {
  if (total === 0) {
    return (
      <div className="flex flex-col items-center px-4 py-12 text-center">
        <SearchX aria-hidden="true" className="size-8 text-soft" />
        <p className="mt-3 text-sm font-medium">Ninguna orden coincide con estos filtros</p>
        <p className="mt-1 max-w-sm text-sm text-muted">Prueba con otro proveedor o número de orden, o quita los filtros para ver las 300 órdenes.</p>
        <button type="button" onClick={onLimpiar} className={cn("mt-4 inline-flex h-11 cursor-pointer items-center rounded-xl border border-line-strong px-4 text-sm font-medium hover:bg-surface-hover", focusRing)}>
          Quitar filtros
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Móvil: tarjetas */}
      <ul className="divide-y divide-line border-t border-line md:hidden">
        {rows.map((o) => {
          const d = diasAtraso(o, hoy);
          return (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => onOpen(o)}
                aria-label={`Ver detalle de ${o.id}, ${o.proveedor}, ${fmt.usd(o.monto)}${d ? `, ${d} días de atraso` : ""}`}
                className={cn("flex w-full cursor-pointer items-center gap-3 px-4 py-3 text-left hover:bg-surface-hover", focusRing)}
              >
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate font-medium">{o.proveedor}</span>
                    <span className="shrink-0 font-semibold tabular-nums">{fmt.usd(o.monto)}</span>
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted">
                    <span className="font-mono">{o.id}</span> · {o.centroCosto} · entrega {fmt.fecha(o.fechaEntregaPrometida)}
                  </span>
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    <EstadoBadge estado={o.estado} />
                    {d > 0 && <AtrasoBadge dias={d} />}
                  </span>
                </span>
                <Abrir aria-hidden="true" className="size-4 shrink-0 text-soft" />
              </button>
            </li>
          );
        })}
      </ul>

      {/* Tableta y escritorio: tabla con scroll interno */}
      <div className="hidden overflow-x-auto border-t border-line md:block">
        <table className="w-full border-collapse text-sm">
          <caption className="sr-only">Órdenes de compra; pulsa una fila para ver el detalle</caption>
          <thead>
            <tr className="border-b border-line bg-bg text-left">
              <Th k="id" label="Orden" sort={sort} onSort={onSort} className="sticky left-0 bg-bg" />
              <Th k="proveedor" label="Proveedor" sort={sort} onSort={onSort} />
              <th scope="col" className="hidden px-3 text-xs font-medium text-soft lg:table-cell">Centro de costo</th>
              <th scope="col" className="px-3 text-xs font-medium text-soft">Estado</th>
              <Th k="fechaEntregaPrometida" label="Entrega prometida" sort={sort} onSort={onSort} className="hidden xl:table-cell" />
              <Th k="atraso" label="Atraso" sort={sort} onSort={onSort} />
              <Th k="monto" label="Monto" sort={sort} onSort={onSort} className="text-right [&>button]:flex-row-reverse" />
            </tr>
          </thead>
          <tbody>
            {rows.map((o) => (
              <tr key={o.id} onClick={() => onOpen(o)} className="group cursor-pointer border-b border-line last:border-b-0 hover:bg-surface-hover">
                <td className="sticky left-0 bg-surface px-3 py-2.5 group-hover:bg-surface-hover">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onOpen(o); }}
                    aria-label={`Ver detalle de ${o.id}`}
                    className={cn("cursor-pointer rounded font-mono text-sm font-medium text-accent underline-offset-2 hover:underline", focusRing)}
                  >
                    {o.id}
                  </button>
                </td>
                <td className="max-w-[14rem] truncate px-3 py-2.5">{o.proveedor}</td>
                <td className="hidden px-3 py-2.5 text-muted lg:table-cell">{o.centroCosto}</td>
                <td className="px-3 py-2.5"><EstadoBadge estado={o.estado} /></td>
                <td className="hidden whitespace-nowrap px-3 py-2.5 text-muted tabular-nums xl:table-cell">{fmt.fecha(o.fechaEntregaPrometida)}</td>
                <td className="px-3 py-2.5"><AtrasoBadge dias={diasAtraso(o, hoy)} /></td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-medium tabular-nums">{fmt.usd(o.monto)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <nav aria-label="Paginación" className="flex items-center justify-between gap-3 border-t border-line px-4 py-2 text-sm text-muted">
        <span className="tabular-nums">Página {page + 1} de {pages} · {total} órdenes</span>
        <span className="flex gap-1">
          <button type="button" disabled={page === 0} onClick={() => onPage(page - 1)} aria-label="Página anterior"
            className={cn("grid size-11 cursor-pointer place-items-center rounded-xl hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40", focusRing)}>
            <ChevronLeft aria-hidden="true" className="size-4" />
          </button>
          <button type="button" disabled={page >= pages - 1} onClick={() => onPage(page + 1)} aria-label="Página siguiente"
            className={cn("grid size-11 cursor-pointer place-items-center rounded-xl hover:bg-surface-hover disabled:cursor-not-allowed disabled:opacity-40", focusRing)}>
            <ChevronRight aria-hidden="true" className="size-4" />
          </button>
        </span>
      </nav>
    </>
  );
}
