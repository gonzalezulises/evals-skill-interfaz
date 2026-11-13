import { useEffect, useRef } from "react";
import { AlertTriangle, Ban, X } from "lucide-react";
import { EstadoBadge } from "@/components/EstadoBadge";
import {
  type Factura,
  fmtDate,
  fmtMoney,
  fmtNumber,
  importeLinea,
  tasaItbms,
} from "@/lib/facturas";

interface Props {
  factura: Factura | null;
  onClose: () => void;
}

export function DetalleFactura({ factura, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (factura && !dlg.open) dlg.showModal();
    if (!factura && dlg.open) dlg.close();
  }, [factura]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="detalle-titulo"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="m-0 ml-auto h-dvh max-h-dvh w-full max-w-none bg-transparent p-0 backdrop:bg-gray-900/45 sm:max-w-xl"
    >
      {factura && (
        <div className="panel flex h-full flex-col bg-surface shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
            <div className="min-w-0">
              <p className="text-xs font-medium uppercase tracking-wide text-ink-faint">Factura</p>
              <h2 id="detalle-titulo" className="mt-0.5 font-mono text-xl font-semibold text-ink">
                {factura.numero}
              </h2>
              <EstadoBadge estado={factura.estado} className="mt-2" />
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className="-mr-2 grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg text-ink-soft hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-5 sm:px-6">
            {factura.estado === "vencida" && (
              <p className="mb-5 flex gap-2 rounded-lg bg-red-50 px-3 py-2.5 text-sm text-red-800">
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                Venció el {fmtDate(factura.vencimiento)}.
              </p>
            )}
            {factura.estado === "anulada" && (
              <p className="mb-5 flex gap-2 rounded-lg bg-gray-100 px-3 py-2.5 text-sm text-gray-700">
                <Ban className="mt-0.5 size-4 shrink-0" aria-hidden />
                Factura anulada: no tiene saldo por pagar.
              </p>
            )}

            <dl className="grid grid-cols-2 gap-4 rounded-xl border border-border p-4 text-sm">
              <div>
                <dt className="text-ink-faint">Emisión</dt>
                <dd className="mt-0.5 font-medium text-ink">{fmtDate(factura.emision)}</dd>
              </div>
              <div>
                <dt className="text-ink-faint">Vencimiento</dt>
                <dd className="mt-0.5 font-medium text-ink">{fmtDate(factura.vencimiento)}</dd>
              </div>
            </dl>

            <h3 className="mt-6 text-sm font-semibold text-ink">
              Líneas <span className="font-normal text-ink-faint">({factura.lineas.length})</span>
            </h3>

            {/* Móvil: lista apilada */}
            <ul className="mt-2 divide-y divide-border rounded-xl border border-border sm:hidden">
              {factura.lineas.map((l, i) => (
                <li key={i} className="flex items-start justify-between gap-3 px-4 py-3 text-sm">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{l.descripcion}</p>
                    <p className="mt-0.5 tabular-nums text-ink-faint">
                      {fmtNumber(l.cantidad)} × {fmtMoney(l.precioUnitario)}
                    </p>
                  </div>
                  <p className="shrink-0 font-medium tabular-nums text-ink">
                    {fmtMoney(importeLinea(l))}
                  </p>
                </li>
              ))}
            </ul>

            {/* Tableta y escritorio: tabla */}
            <div className="mt-2 hidden overflow-hidden rounded-xl border border-border sm:block">
              <table className="w-full text-sm">
                <caption className="sr-only">Líneas de la factura {factura.numero}</caption>
                <thead className="bg-muted text-left text-xs text-ink-faint">
                  <tr>
                    <th scope="col" className="px-4 py-2.5 font-medium">Descripción</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Cant.</th>
                    <th scope="col" className="px-3 py-2.5 text-right font-medium">Precio unit.</th>
                    <th scope="col" className="px-4 py-2.5 text-right font-medium">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {factura.lineas.map((l, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2.5 text-ink">{l.descripcion}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                        {fmtNumber(l.cantidad)}
                      </td>
                      <td className="px-3 py-2.5 text-right tabular-nums text-ink-soft">
                        {fmtMoney(l.precioUnitario)}
                      </td>
                      <td className="px-4 py-2.5 text-right font-medium tabular-nums text-ink">
                        {fmtMoney(importeLinea(l))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <dl className="mt-4 space-y-2 rounded-xl bg-muted p-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Subtotal</dt>
                <dd className="tabular-nums text-ink">{fmtMoney(factura.subtotal)}</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">ITBMS ({tasaItbms(factura)} %)</dt>
                <dd className="tabular-nums text-ink">{fmtMoney(factura.itbms)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-t border-border pt-2 text-base font-semibold">
                <dt className="text-ink">Total</dt>
                <dd
                  className={
                    factura.estado === "anulada"
                      ? "tabular-nums text-ink-faint line-through"
                      : "tabular-nums text-ink"
                  }
                >
                  {fmtMoney(factura.total)}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      )}
    </dialog>
  );
}
