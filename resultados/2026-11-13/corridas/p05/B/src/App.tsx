import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronRight, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { EstadoBadge } from "@/components/EstadoBadge";
import { DetalleFactura } from "@/components/DetalleFactura";
import {
  ESTADOS,
  type Estado,
  type Factura,
  esEstado,
  facturas,
  fmtDate,
  fmtMoney,
} from "@/lib/facturas";

type Filtro = Estado | "todas";

const porNumero = new Map(facturas.map((f) => [f.numero, f]));

const leerFiltro = (): Filtro => {
  const v = new URLSearchParams(window.location.search).get("estado");
  return esEstado(v) ? v : "todas";
};
const leerSeleccion = () => porNumero.get(decodeURIComponent(window.location.hash.slice(1))) ?? null;

function sumar(estados: Estado[]) {
  const lista = facturas.filter((f) => estados.includes(f.estado));
  return { total: lista.reduce((a, f) => a + f.total, 0), cantidad: lista.length };
}

export default function App() {
  const [filtro, setFiltro] = useState<Filtro>(leerFiltro);
  const [seleccion, setSeleccion] = useState<Factura | null>(leerSeleccion);

  useEffect(() => {
    const sync = () => setSeleccion(leerSeleccion());
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  const cambiarFiltro = (f: Filtro) => {
    setFiltro(f);
    const url = new URL(window.location.href);
    if (f === "todas") url.searchParams.delete("estado");
    else url.searchParams.set("estado", f);
    window.history.replaceState(null, "", url);
  };

  const abrir = (f: Factura) => {
    window.location.hash = f.numero;
  };

  const cerrar = useCallback(() => {
    setSeleccion(null);
    if (window.location.hash) {
      window.history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  }, []);

  const conteos = useMemo(() => {
    const c: Record<Filtro, number> = { todas: facturas.length, pendiente: 0, vencida: 0, pagada: 0, anulada: 0 };
    facturas.forEach((f) => c[f.estado]++);
    return c;
  }, []);

  const visibles = filtro === "todas" ? facturas : facturas.filter((f) => f.estado === filtro);
  const porPagar = sumar(["pendiente", "vencida"]);
  const vencido = sumar(["vencida"]);
  const pagado = sumar(["pagada"]);

  const opciones: { value: Filtro; label: string }[] = [
    { value: "todas", label: "Todas" },
    ...ESTADOS.map((e) => ({ value: e.value, label: e.plural })),
  ];

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
          <span className="grid size-8 place-items-center rounded-lg bg-brand text-sm font-bold text-white" aria-hidden>
            A
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold text-ink">Andes Logística</p>
            <p className="text-xs text-ink-faint">Portal de clientes</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold tracking-tight text-ink">Mis facturas</h1>

        <section aria-label="Resumen" className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-3">
          <Resumen titulo="Por pagar" monto={porPagar.total} detalle={`${porPagar.cantidad} facturas pendientes o vencidas`} destacado />
          <Resumen titulo="Vencido" monto={vencido.total} detalle={`${vencido.cantidad} facturas`} tono="alerta" />
          <Resumen titulo="Pagado" monto={pagado.total} detalle={`${pagado.cantidad} facturas`} />
        </section>

        <section aria-labelledby="listado-titulo" className="mt-8">
          <h2 id="listado-titulo" className="sr-only">Listado de facturas</h2>

          <div
            role="group"
            aria-label="Filtrar por estado"
            className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0"
          >
            {opciones.map((o) => {
              const activo = filtro === o.value;
              return (
                <button
                  key={o.value}
                  type="button"
                  aria-pressed={activo}
                  onClick={() => cambiarFiltro(o.value)}
                  className={cn(
                    "inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
                    activo
                      ? "border-brand bg-brand text-white"
                      : "border-border bg-surface text-ink-soft hover:bg-muted",
                  )}
                >
                  {o.label}
                  <span
                    className={cn(
                      "rounded-full px-1.5 text-xs tabular-nums",
                      activo ? "bg-white/20 text-white" : "bg-muted text-ink-faint",
                    )}
                  >
                    {conteos[o.value]}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-sm text-ink-faint" aria-live="polite">
            {visibles.length} {visibles.length === 1 ? "factura" : "facturas"}
            {filtro !== "todas" && ` ${ESTADOS.find((e) => e.value === filtro)?.plural.toLowerCase()}`}
          </p>

          {visibles.length === 0 ? (
            <div className="mt-3 rounded-xl border border-dashed border-border bg-surface px-6 py-12 text-center">
              <FileText className="mx-auto size-8 text-ink-faint" aria-hidden />
              <p className="mt-3 font-medium text-ink">No hay facturas en este estado</p>
              <button
                type="button"
                onClick={() => cambiarFiltro("todas")}
                className="mt-3 min-h-11 cursor-pointer rounded-lg px-3 text-sm font-medium text-brand hover:bg-brand-soft focus-visible:outline-2 focus-visible:outline-brand"
              >
                Ver todas
              </button>
            </div>
          ) : (
            <>
              {/* Móvil: tarjetas */}
              <ul className="mt-3 space-y-2 md:hidden">
                {visibles.map((f) => (
                  <li key={f.numero}>
                    <button
                      type="button"
                      onClick={() => abrir(f)}
                      aria-label={`Ver detalle de la factura ${f.numero}`}
                      className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:border-brand/40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono font-semibold text-ink">{f.numero}</span>
                          <EstadoBadge estado={f.estado} />
                        </div>
                        <div className="mt-2 flex items-end justify-between gap-2">
                          <span className="text-xs text-ink-faint">
                            Vence {fmtDate(f.vencimiento)}
                          </span>
                          <span
                            className={cn(
                              "font-semibold tabular-nums",
                              f.estado === "anulada" ? "text-ink-faint line-through" : "text-ink",
                            )}
                          >
                            {fmtMoney(f.total)}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="size-4 shrink-0 text-ink-faint" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Tableta ancha y escritorio: tabla */}
              <div className="mt-3 hidden overflow-hidden rounded-xl border border-border bg-surface md:block">
                <table className="w-full text-sm">
                  <thead className="border-b border-border bg-muted text-left text-xs text-ink-faint">
                    <tr>
                      <th scope="col" className="px-5 py-3 font-medium">Número</th>
                      <th scope="col" className="px-4 py-3 font-medium">Emisión</th>
                      <th scope="col" className="px-4 py-3 font-medium">Vencimiento</th>
                      <th scope="col" className="px-4 py-3 font-medium">Estado</th>
                      <th scope="col" className="px-4 py-3 text-right font-medium">Total</th>
                      <th scope="col" className="w-12 px-4 py-3"><span className="sr-only">Detalle</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {visibles.map((f) => (
                      <tr
                        key={f.numero}
                        onClick={() => abrir(f)}
                        className="group cursor-pointer hover:bg-muted/60"
                      >
                        <td className="px-5 py-3">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              abrir(f);
                            }}
                            aria-label={`Ver detalle de la factura ${f.numero}`}
                            className="cursor-pointer rounded font-mono font-semibold text-ink group-hover:text-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
                          >
                            {f.numero}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-ink-soft">{fmtDate(f.emision)}</td>
                        <td className="px-4 py-3 text-ink-soft">{fmtDate(f.vencimiento)}</td>
                        <td className="px-4 py-3"><EstadoBadge estado={f.estado} /></td>
                        <td
                          className={cn(
                            "px-4 py-3 text-right font-medium tabular-nums",
                            f.estado === "anulada" ? "text-ink-faint line-through" : "text-ink",
                          )}
                        >
                          {fmtMoney(f.total)}
                        </td>
                        <td className="px-4 py-3 text-ink-faint">
                          <ChevronRight className="size-4" aria-hidden />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </main>

      <DetalleFactura factura={seleccion} onClose={cerrar} />
    </div>
  );
}

function Resumen({
  titulo,
  monto,
  detalle,
  destacado,
  tono,
}: {
  titulo: string;
  monto: number;
  detalle: string;
  destacado?: boolean;
  tono?: "alerta";
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 rounded-xl border bg-surface px-4 py-3 sm:block sm:p-4",
        destacado ? "border-brand/30" : "border-border",
      )}
    >
      <div>
        <p className="text-sm text-ink-soft">{titulo}</p>
        <p className="mt-0.5 text-xs text-ink-faint sm:hidden">{detalle}</p>
      </div>
      <p
        className={cn(
          "text-lg font-semibold tabular-nums tracking-tight sm:mt-1 sm:text-2xl",
          tono === "alerta" ? "text-red-700" : "text-ink",
        )}
      >
        {fmtMoney(monto)}
      </p>
      <p className="mt-0.5 hidden text-xs text-ink-faint sm:block">{detalle}</p>
    </div>
  );
}
