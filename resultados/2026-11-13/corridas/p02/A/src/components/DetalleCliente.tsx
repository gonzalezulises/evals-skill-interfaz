import * as React from "react";
import { AlertTriangle, X } from "lucide-react";
import { TRAMOS, pct, usd, type Cliente } from "@/lib/cartera";
import { cn } from "@/lib/utils";

/** Drawer lateral de detalle; `<dialog>` nativo para foco atrapado, Esc y fondo inerte. */
export function DetalleCliente({ cliente, onCerrar }: { cliente: Cliente | null; onCerrar: () => void }) {
  const ref = React.useRef<HTMLDialogElement>(null);
  const [ultimo, setUltimo] = React.useState<Cliente | null>(cliente);
  if (cliente && cliente !== ultimo) setUltimo(cliente);

  React.useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (cliente && !d.open) d.showModal();
    if (!cliente && d.open) d.close();
  }, [cliente]);

  const c = cliente ?? ultimo;
  const sobre = c ? c.uso > 1 : false;

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => { if (e.target === e.currentTarget) onCerrar(); }}
      aria-labelledby="detalle-titulo"
      className="fixed inset-y-0 right-0 left-auto m-0 h-dvh max-h-dvh w-full max-w-[440px] bg-card p-0 text-card-foreground shadow-2xl"
    >
      {c && (
        <div className="grid gap-5 p-5 sm:p-6">
          <header className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[13px] font-medium text-muted-foreground">Detalle del cliente</p>
              <h2 id="detalle-titulo" className="text-[20px] font-semibold tracking-[-0.01em]">{c.cliente}</h2>
            </div>
            <button
              type="button"
              onClick={onCerrar}
              aria-label="Cerrar detalle"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-5" aria-hidden />
            </button>
          </header>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-muted p-3">
              <p className="text-[12px] text-muted-foreground">Saldo total</p>
              <p className="text-[22px] font-semibold tabular-nums">{usd(c.total)}</p>
            </div>
            <div className={cn("rounded-xl bg-muted p-3", sobre && "ring-1 ring-critical/50")}>
              <p className="text-[12px] text-muted-foreground">Límite de crédito</p>
              <p className="text-[22px] font-semibold tabular-nums">{usd(c.limiteCredito)}</p>
            </div>
          </div>

          <div className="grid gap-2">
            <div className="flex justify-between text-[13px]">
              <span className="text-muted-foreground">Uso del límite</span>
              <span className={cn("font-medium tabular-nums", sobre && "text-critical-text")}>{pct(c.uso)}</span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
              <div className={cn("h-full rounded-full", sobre ? "bg-critical" : "bg-[color:var(--chart-1)]")} style={{ width: `${Math.min(c.uso, 1) * 100}%` }} />
            </div>
            {sobre && (
              <p className="flex items-center gap-1.5 text-[13px] font-medium text-critical-text">
                <AlertTriangle className="size-4" aria-hidden /> Excede su límite por {usd(c.total - c.limiteCredito)}
              </p>
            )}
          </div>

          <div className="grid gap-2">
            <h3 className="text-[14px] font-semibold">Saldo por antigüedad</h3>
            <table className="w-full text-[14px]">
              <tbody>
                {TRAMOS.map((t) => (
                  <tr key={t.key} className="border-b border-border last:border-0">
                    <th scope="row" className="py-2.5 text-left font-normal">
                      <span className="flex items-center gap-2">
                        <span className="h-3 w-3 rounded-[3px]" style={{ background: t.color }} />
                        {t.label}
                      </span>
                    </th>
                    <td className={cn("py-2.5 text-right font-medium tabular-nums", c[t.key] === 0 && "text-muted-foreground")}>{usd(c[t.key])}</td>
                    <td className="w-14 py-2.5 text-right text-muted-foreground tabular-nums">{pct(c[t.key] / (c.total || 1))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </dialog>
  );
}
