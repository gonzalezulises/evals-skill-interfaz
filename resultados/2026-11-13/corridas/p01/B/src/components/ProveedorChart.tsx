import { useMemo } from "react";
import { cn } from "@/lib/utils";
import { diasAtraso, fmtUSD, fmtUSDcompact, type Orden } from "@/lib/ordenes";

type Props = {
  ordenes: Orden[];
  corte: string;
  seleccionado: string;
  onSelect: (proveedor: string) => void;
};

/** Barras apiladas (atrasado + en plazo) por proveedor. Cada barra filtra el listado. */
export function ProveedorChart({ ordenes, corte, seleccionado, onSelect }: Props) {
  const filas = useMemo(() => {
    const m = new Map<string, { atrasado: number; plazo: number; n: number }>();
    for (const o of ordenes) {
      const r = m.get(o.proveedor) ?? { atrasado: 0, plazo: 0, n: 0 };
      if (diasAtraso(o, corte) > 0) r.atrasado += o.monto;
      else r.plazo += o.monto;
      r.n++;
      m.set(o.proveedor, r);
    }
    return [...m.entries()]
      .map(([proveedor, r]) => ({ proveedor, ...r, total: r.atrasado + r.plazo }))
      .sort((a, b) => b.total - a.total);
  }, [ordenes, corte]);

  const max = Math.max(...filas.map((f) => f.total), 1);

  return (
    <ul className="space-y-0.5">
      {filas.map((f) => {
        const activo = seleccionado === f.proveedor;
        return (
          <li key={f.proveedor}>
            <button
              type="button"
              aria-pressed={activo}
              aria-label={`${f.proveedor}: ${fmtUSD(f.total)} comprometido, ${fmtUSD(f.atrasado)} atrasado, ${f.n} órdenes. Filtrar el listado`}
              title={`${f.proveedor} · ${fmtUSD(f.total)} (${fmtUSD(f.atrasado)} atrasado) · ${f.n} órdenes`}
              onClick={() => onSelect(f.proveedor)}
              className={cn(
                "grid w-full cursor-pointer grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent sm:grid-cols-[11rem_1fr_auto]",
                activo && "bg-accent-soft",
                seleccionado && !activo && "opacity-50",
              )}
            >
              <span className="truncate">{f.proveedor}</span>
              <span className="flex h-3 overflow-hidden rounded-sm bg-surface-2" aria-hidden>
                <span className="h-full bg-danger" style={{ width: `${(f.atrasado / max) * 100}%` }} />
                <span className="h-full bg-accent" style={{ width: `${(f.plazo / max) * 100}%` }} />
              </span>
              <span className="tabular w-16 text-right font-medium">{fmtUSDcompact(f.total)}</span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
