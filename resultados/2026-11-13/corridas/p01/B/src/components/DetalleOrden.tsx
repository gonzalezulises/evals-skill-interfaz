import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { EstadoBadge } from "@/components/EstadoBadge";
import { desvioRecepcion, diasAtraso, esAbierta, fmtFecha, fmtUSDcents, type Orden } from "@/lib/ordenes";
import { cn } from "@/lib/utils";

type Props = { orden: Orden | null; corte: string; onClose: () => void };

/** Panel lateral con el detalle de una orden. Esc o clic fuera lo cierran; el foco vuelve a la fila. */
export function DetalleOrden({ orden, corte, onClose }: Props) {
  const panel = useRef<HTMLDivElement>(null);
  const cerrar = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!orden) return;
    const previo = document.activeElement as HTMLElement | null;
    cerrar.current?.focus();
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Tab" && panel.current) {
        const f = panel.current.querySelectorAll<HTMLElement>("button, [href], [tabindex]:not([tabindex='-1'])");
        const first = f[0];
        const last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previo?.focus();
    };
  }, [orden, onClose]);

  if (!orden) return null;

  const atraso = diasAtraso(orden, corte);
  const desvio = desvioRecepcion(orden);
  const abierta = esAbierta(orden);

  let situacion: { texto: string; tono: string };
  if (orden.estado === "cancelada") situacion = { texto: "Orden cancelada", tono: "bg-surface-2 text-muted" };
  else if (orden.estado === "borrador") situacion = { texto: "Borrador: aún no compromete dinero", tono: "bg-surface-2 text-muted" };
  else if (abierta && atraso > 0)
    situacion = { texto: `Atrasada ${atraso} días respecto a la fecha prometida`, tono: atraso > 60 ? "bg-danger-soft text-danger" : "bg-warn-soft text-warn" };
  else if (abierta) situacion = { texto: "En plazo", tono: "bg-ok-soft text-ok" };
  else if (desvio !== null && desvio > 0) situacion = { texto: `Recibida ${desvio} días tarde`, tono: "bg-warn-soft text-warn" };
  else situacion = { texto: "Recibida a tiempo", tono: "bg-ok-soft text-ok" };

  const hitos: { label: string; fecha: string | null; nota?: string }[] = [
    { label: "Emisión", fecha: orden.fechaEmision },
    { label: "Entrega prometida", fecha: orden.fechaEntregaPrometida },
    {
      label: orden.estado === "recibida parcial" ? "Recepción parcial" : "Recepción",
      fecha: orden.fechaRecepcion,
      nota: orden.fechaRecepcion ? undefined : abierta ? "Pendiente" : "—",
    },
  ];

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col overflow-y-auto bg-surface shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-line p-5">
          <div>
            <p className="text-sm text-muted">Orden de compra</p>
            <h2 id="detalle-titulo" className="text-xl font-semibold">
              {orden.id}
            </h2>
          </div>
          <button
            ref={cerrar}
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="cursor-pointer rounded-lg p-2 text-muted hover:bg-surface-2 hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X aria-hidden className="size-5" />
          </button>
        </div>

        <div className="space-y-6 p-5">
          <div>
            <p className="tabular text-3xl font-semibold">{fmtUSDcents(orden.monto)}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <EstadoBadge estado={orden.estado} />
              <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", situacion.tono)}>{situacion.texto}</span>
            </div>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
            <Campo label="Proveedor" valor={orden.proveedor} />
            <Campo label="Centro de costo" valor={orden.centroCosto} />
            <Campo label="Solicitante" valor={orden.solicitante} />
            <Campo label="Estado" valor={orden.estado} />
          </dl>

          <div>
            <h3 className="mb-3 text-sm font-semibold">Fechas</h3>
            <ol className="space-y-3 border-l-2 border-line pl-4">
              {hitos.map((h) => (
                <li key={h.label} className="relative">
                  <span
                    aria-hidden
                    className={cn("absolute -left-[1.4rem] top-1.5 size-2.5 rounded-full", h.fecha ? "bg-accent" : "border-2 border-line bg-surface")}
                  />
                  <p className="text-xs text-muted">{h.label}</p>
                  <p className="tabular text-sm font-medium">{h.fecha ? fmtFecha(h.fecha) : h.nota}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ label, valor }: { label: string; valor: string }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="font-medium first-letter:uppercase">{valor}</dd>
    </div>
  );
}
