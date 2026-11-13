import { useEffect, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { diasAtraso, esAbierta, fmt, type Orden } from "@/lib/ordenes";
import { EstadoBadge, focusRing } from "./ui";

/** Panel lateral de detalle (patrón Sheet de 21st) sobre <dialog> nativo: atrapa el foco y cierra con Esc. */
export function DetalleOrden({ orden, hoy, onClose }: { orden: Orden | null; hoy: string; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (orden && !d.open) d.showModal();
    if (!orden && d.open) d.close();
  }, [orden]);

  const atraso = orden ? diasAtraso(orden, hoy) : 0;
  const pasos = orden
    ? [
        { label: "Emitida", fecha: orden.fechaEmision, hecho: true },
        { label: "Entrega prometida", fecha: orden.fechaEntregaPrometida, hecho: orden.fechaEntregaPrometida <= hoy, alerta: atraso > 0 },
        {
          label: orden.estado === "recibida parcial" ? "Recepción parcial" : "Recepción",
          fecha: orden.fechaRecepcion,
          hecho: Boolean(orden.fechaRecepcion),
        },
      ]
    : [];

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
      aria-labelledby="detalle-titulo"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-md overflow-y-auto border-l border-line bg-surface p-0 text-ink shadow-2xl sm:w-[28rem]"
    >
      {orden && (
        <div className="flex min-h-full flex-col">
          <header className="sticky top-0 flex items-start justify-between gap-3 border-b border-line bg-surface px-5 py-4">
            <div className="min-w-0">
              <p className="text-xs font-medium text-soft">Orden de compra</p>
              <h2 id="detalle-titulo" className="font-mono text-lg font-semibold">{orden.id}</h2>
              <div className="mt-1.5"><EstadoBadge estado={orden.estado} /></div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar detalle"
              className={cn("grid size-11 shrink-0 cursor-pointer place-items-center rounded-xl text-muted hover:bg-surface-hover hover:text-ink", focusRing)}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </header>

          <div className="space-y-6 px-5 py-5">
            <div>
              <p className="text-sm text-muted">Monto</p>
              <p className="text-3xl font-semibold tracking-tight tabular-nums">{fmt.usd(orden.monto)}</p>
              <p className="text-xs text-soft">{orden.moneda} · {esAbierta(orden) ? "comprometido, pendiente de recibir" : orden.estado === "borrador" ? "aún no comprometido" : orden.estado === "cancelada" ? "liberado por cancelación" : "recibido"}</p>
            </div>

            {atraso > 0 && (
              <div role="status" className="flex gap-2.5 rounded-xl border border-danger/30 bg-danger-soft p-3 text-sm">
                <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
                <p>
                  <strong className="text-danger">{atraso} días de atraso.</strong>{" "}
                  <span className="text-ink">Debía entregarse el {fmt.fecha(orden.fechaEntregaPrometida)}{orden.estado === "recibida parcial" ? " y solo llegó una parte." : " y no se ha recibido."}</span>
                </p>
              </div>
            )}

            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              {[
                ["Proveedor", orden.proveedor],
                ["Centro de costo", orden.centroCosto],
                ["Solicitante", orden.solicitante],
                ["Moneda", orden.moneda],
              ].map(([k, v]) => (
                <div key={k} className="min-w-0">
                  <dt className="text-xs text-soft">{k}</dt>
                  <dd className="truncate font-medium">{v}</dd>
                </div>
              ))}
            </dl>

            <div>
              <h3 className="text-sm font-semibold">Recorrido</h3>
              <ol className="mt-3 space-y-0">
                {pasos.map((p, i) => (
                  <li key={p.label} className="relative flex gap-3 pb-4 last:pb-0">
                    {i < pasos.length - 1 && <span aria-hidden="true" className="absolute left-[7px] top-4 h-full w-px bg-line" />}
                    <span
                      aria-hidden="true"
                      className={cn(
                        "relative mt-0.5 size-[15px] shrink-0 rounded-full border-2",
                        p.alerta ? "border-danger bg-danger" : p.hecho ? "border-accent bg-accent" : "border-line-strong bg-surface",
                      )}
                    />
                    <div className="text-sm">
                      <p className="font-medium">{p.label}</p>
                      <p className={cn("text-xs", p.alerta ? "text-danger" : "text-muted")}>
                        {p.fecha ? fmt.fecha(p.fecha) : orden.estado === "cancelada" ? "No aplica: orden cancelada" : "Pendiente"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
