import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { Factura } from "@/lib/api";
import { cn } from "@/lib/utils";
import { dinero, fecha, tasaItbms } from "@/lib/facturas";
import { EstadoBadge } from "@/components/EstadoBadge";

type Props = { factura: Factura; onCerrar: () => void };

const AVISO: Record<string, { texto: (f: Factura) => string; clase: string }> = {
  vencida: { texto: (f) => `Venció el ${fecha(f.vencimiento)}. El total sigue pendiente de pago.`, clase: "bg-vencida-suave text-vencida" },
  pendiente: { texto: (f) => `Pendiente de pago. Fecha de vencimiento: ${fecha(f.vencimiento)}.`, clase: "bg-pendiente-suave text-pendiente" },
  pagada: { texto: () => "Esta factura está pagada.", clase: "bg-pagada-suave text-pagada" },
  anulada: { texto: () => "Esta factura fue anulada: no tienes que pagarla.", clase: "bg-anulada-suave text-anulada" },
};

/**
 * Drawer de detalle. Líneas y totales adaptados del patrón de 21st «Invoice Line Items Table»
 * (id 25157): cantidad × precio unitario, importe y pie con subtotal, impuesto y total.
 */
export function DetalleFactura({ factura: f, onCerrar }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);
  const aviso = AVISO[f.estado] ?? AVISO.pendiente;
  const anulada = f.estado === "anulada";

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
      if (e.key !== "Tab" || !panel.current) return;
      const foco = panel.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
      const primero = foco[0];
      const ultimo = foco[foco.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      previo?.focus();
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="anim-velo absolute inset-0 bg-tinta/40" onClick={onCerrar} aria-hidden="true" />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="anim-panel relative flex h-full w-full max-w-xl flex-col bg-superficie shadow-2xl"
      >
        <header className="flex items-start justify-between gap-3 border-b border-linea px-5 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium tracking-wide text-tenue uppercase">Factura</p>
            <h2 id="detalle-titulo" className="font-mono text-xl font-semibold">{f.numero}</h2>
          </div>
          <button
            ref={cerrar}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="-mr-2 inline-flex size-11 cursor-pointer items-center justify-center rounded-full text-tenue hover:bg-fondo hover:text-tinta"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-10 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-sm text-tenue">Total</p>
              <p className={cn("text-3xl font-semibold tabular-nums", anulada && "text-tenue line-through")}>
                {dinero(f.total)}
              </p>
            </div>
            <EstadoBadge estado={f.estado} className="text-sm" />
          </div>

          <p className={cn("mt-4 rounded-xl px-4 py-3 text-sm font-medium", aviso.clase)}>{aviso.texto(f)}</p>

          <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-tenue">Emisión</dt>
              <dd className="mt-0.5 font-medium">{fecha(f.emision)}</dd>
            </div>
            <div>
              <dt className="text-tenue">Vencimiento</dt>
              <dd className="mt-0.5 font-medium">{fecha(f.vencimiento)}</dd>
            </div>
          </dl>

          <h3 className="mt-7 text-sm font-semibold">
            Líneas <span className="font-normal text-tenue">({f.lineas.length})</span>
          </h3>

          <table className="mt-2 w-full text-sm">
            <caption className="sr-only">Líneas de la factura {f.numero}</caption>
            <thead className="border-b border-linea text-left text-xs font-semibold tracking-wide text-tenue uppercase">
              <tr>
                <th scope="col" className="py-2 pr-3">Descripción</th>
                <th scope="col" className="hidden py-2 pr-3 text-right sm:table-cell">Cant.</th>
                <th scope="col" className="hidden py-2 pr-3 text-right sm:table-cell">P. unitario</th>
                <th scope="col" className="py-2 text-right">Importe</th>
              </tr>
            </thead>
            <tbody>
              {f.lineas.map((l, i) => (
                <tr key={i} className="border-b border-linea/70 align-top">
                  <td className="py-3 pr-3">
                    <span className="font-medium">{l.descripcion}</span>
                    {/* En móvil la cantidad y el precio van bajo la descripción */}
                    <span className="mt-0.5 block text-xs text-tenue tabular-nums sm:hidden">
                      {l.cantidad} × {dinero(l.precioUnitario)}
                    </span>
                  </td>
                  <td className="hidden py-3 pr-3 text-right text-tenue tabular-nums sm:table-cell">{l.cantidad}</td>
                  <td className="hidden py-3 pr-3 text-right text-tenue tabular-nums sm:table-cell">{dinero(l.precioUnitario)}</td>
                  <td className="py-3 text-right font-medium tabular-nums">{dinero(l.cantidad * l.precioUnitario)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <dl className="mt-4 ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-2 text-sm">
            <dt className="text-tenue">Subtotal</dt>
            <dd className="text-right tabular-nums">{dinero(f.subtotal)}</dd>
            <dt className="text-tenue">ITBMS ({tasaItbms(f)} %)</dt>
            <dd className="text-right tabular-nums">{dinero(f.itbms)}</dd>
            <dt className="border-t border-linea pt-2 font-semibold">Total</dt>
            <dd className={cn("border-t border-linea pt-2 text-right font-semibold tabular-nums", anulada && "text-tenue line-through")}>
              {dinero(f.total)}
            </dd>
          </dl>
        </div>
      </div>
    </div>
  );
}
