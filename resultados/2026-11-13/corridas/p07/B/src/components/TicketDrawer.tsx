import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { cumpleSla, fmtFecha, fmtHoras, type Ticket } from "@/lib/escalamientos";
import { PrioridadPill } from "./PrioridadPill";

type Props = {
  titulo: string | null;
  subtitulo?: string;
  tickets: Ticket[];
  onClose: () => void;
};

export function TicketDrawer({ titulo, subtitulo, tickets, onClose }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const abierto = titulo !== null;

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (abierto && !d.open) d.showModal();
    if (!abierto && d.open) d.close();
  }, [abierto]);

  return (
    <dialog
      ref={ref}
      className="drawer"
      aria-labelledby="drawer-titulo"
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
    >
      <div className="flex h-full flex-col">
        <header className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <div className="min-w-0">
            <h2 id="drawer-titulo" className="text-base font-semibold">{titulo}</h2>
            {subtitulo && <p className="mt-0.5 text-sm text-muted">{subtitulo}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar detalle"
            className="-mr-2 grid size-10 shrink-0 cursor-pointer place-items-center rounded-lg text-muted hover:bg-subtle hover:text-ink focus-visible:outline-2 focus-visible:outline-accent"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        {tickets.length === 0 ? (
          <p className="px-5 py-10 text-center text-sm text-muted">No hay tickets en este grupo.</p>
        ) : (
          <ul className="flex-1 divide-y divide-line overflow-y-auto">
            {tickets.map((t) => {
              const ok = cumpleSla(t);
              return (
                <li key={t.id} className="px-5 py-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <span className="tabular text-xs font-medium text-muted">{t.id}</span>
                    <PrioridadPill prioridad={t.prioridad} />
                  </div>
                  <p className="mt-1 font-medium">{t.asunto}</p>
                  <p className="mt-0.5 text-sm text-muted">
                    {t.cliente} · {t.agente} · {t.estado} · desde {fmtFecha(t.abierto)}
                  </p>
                  <p className="mt-1.5 flex flex-wrap items-center gap-2 text-sm">
                    <span className="tabular">
                      1.ª respuesta {fmtHoras(t.primeraRespuestaHoras)} / objetivo {t.slaHoras} h
                    </span>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-xs font-medium " +
                        (ok ? "bg-ok-soft text-ok" : "bg-bad-soft text-bad")
                      }
                    >
                      {ok ? "En SLA" : "Fuera de SLA"}
                    </span>
                  </p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </dialog>
  );
}
