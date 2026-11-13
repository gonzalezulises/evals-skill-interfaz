import { ChevronRight } from "lucide-react";
import type { Factura } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dinero, fecha, fechaSinAnio } from "@/lib/facturas";
import { EstadoBadge } from "@/components/EstadoBadge";

type Props = { facturas: Factura[]; onAbrir: (numero: string) => void };

const monto = (f: Factura) => (
  <span className={cn("tabular-nums", f.estado === "anulada" && "text-tenue line-through")}>{dinero(f.total)}</span>
);

/**
 * Tabla adaptada del patrón de 21st «Filterable Invoices Table» (id 25152): número en mono,
 * fechas, badge de estado y monto a la derecha. En móvil la tabla pasa a tarjetas.
 */
export function ListaFacturas({ facturas, onAbrir }: Props) {
  return (
    <>
      {/* ≥ 768 px: tabla; toda la fila abre el detalle */}
      <div className="hidden overflow-hidden rounded-2xl border border-linea bg-superficie md:block">
        <table className="w-full text-sm">
          <caption className="sr-only">Facturas. Pulsa una fila para ver sus líneas e impuestos.</caption>
          <thead className="bg-fondo/70 text-left text-xs font-semibold tracking-wide text-tenue uppercase">
            <tr>
              <th scope="col" className="py-3 pr-4 pl-5">Factura</th>
              <th scope="col" className="px-4 py-3">Emisión</th>
              <th scope="col" className="px-4 py-3">Vencimiento</th>
              <th scope="col" className="px-4 py-3">Estado</th>
              <th scope="col" className="px-4 py-3 text-right">Total</th>
              <th scope="col" className="w-12 py-3 pr-4"><span className="sr-only">Abrir</span></th>
            </tr>
          </thead>
          <tbody>
            {facturas.map((f) => (
              <tr
                key={f.numero}
                onClick={() => onAbrir(f.numero)}
                className="group cursor-pointer border-t border-linea transition-colors hover:bg-marca-suave/50"
              >
                <td className="py-3.5 pr-4 pl-5">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); onAbrir(f.numero); }}
                    aria-label={`Ver detalle de la factura ${f.numero}`}
                    className="cursor-pointer rounded font-mono text-sm font-medium text-tinta"
                  >
                    {f.numero}
                  </button>
                </td>
                <td className="px-4 py-3.5 text-tenue tabular-nums">{fecha(f.emision)}</td>
                <td className={cn("px-4 py-3.5 tabular-nums", f.estado === "vencida" ? "font-medium text-vencida" : "text-tenue")}>
                  {fecha(f.vencimiento)}
                </td>
                <td className="px-4 py-3.5"><EstadoBadge estado={f.estado} /></td>
                <td className="px-4 py-3.5 text-right font-semibold">{monto(f)}</td>
                <td className="py-3.5 pr-4 text-right">
                  <ChevronRight className="ml-auto size-4 text-tenue transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* < 768 px: tarjetas */}
      <ul className="grid gap-3 md:hidden">
        {facturas.map((f) => (
          <li key={f.numero}>
            <button
              type="button"
              onClick={() => onAbrir(f.numero)}
              aria-label={`Factura ${f.numero}, ${f.estado}, total ${dinero(f.total)}. Ver detalle`}
              className="flex w-full cursor-pointer items-center gap-3 rounded-2xl border border-linea bg-superficie p-4 text-left active:bg-marca-suave/50"
            >
              <span className="grid min-w-0 flex-1 grid-cols-[1fr_auto] items-center gap-x-3 gap-y-2">
                <span className="font-mono text-sm font-semibold">{f.numero}</span>
                <span className="text-right text-base font-semibold">{monto(f)}</span>
                <EstadoBadge estado={f.estado} className="justify-self-start" />
                <span className={cn("text-right text-sm text-tenue", f.estado === "vencida" && "font-medium text-vencida")}>
                  Vence {fechaSinAnio(f.vencimiento)}
                </span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-tenue" aria-hidden="true" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
