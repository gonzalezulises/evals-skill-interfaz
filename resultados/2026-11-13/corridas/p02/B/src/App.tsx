import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, X } from "lucide-react";
import { BarCompare, ChartCard, KpiCard } from "@/components/charts";
import {
  TRAMOS,
  clientes,
  mensual,
  mesLargo,
  money,
  moneyShort,
  pct,
  porTramo,
  totalCartera,
  type Cliente,
} from "@/lib/cartera";
import { cn } from "@/lib/utils";

type Orden = "total" | "saldoMas90" | "usoLimite";
const ORDENES: { key: Orden; label: string }[] = [
  { key: "total", label: "Saldo total" },
  { key: "saldoMas90", label: "Más de 90 días" },
  { key: "usoLimite", label: "Uso del límite" },
];
const TOP = 10;

const ultimo = mensual[mensual.length - 1];
const anterior = mensual[mensual.length - 2];
const mas90 = porTramo[3];
const sobreLimite = clientes.filter((c) => c.sobreLimite);
const brecha = mensual.reduce((n, m) => n + (m.facturado - m.cobrado), 0);

export default function App() {
  const [orden, setOrden] = useState<Orden>("total");
  const [verTodos, setVerTodos] = useState(false);
  const [detalle, setDetalle] = useState<Cliente | null>(null);
  const cerrar = useCallback(() => setDetalle(null), []);

  const ordenados = useMemo(() => [...clientes].sort((a, b) => b[orden] - a[orden]), [orden]);
  const visibles = verTodos ? ordenados : ordenados.slice(0, TOP);
  const maxTotal = Math.max(...clientes.map((c) => c.total));

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto grid w-full max-w-[1200px] gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <header className="grid gap-1">
          <p className="text-[12.5px] font-medium text-muted-foreground">Andes Logística · Finanzas</p>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Cartera por cobrar</h1>
          <p className="text-[13px] text-muted-foreground">
            {clientes.length} clientes · facturación y cobros de {mesLargo(mensual[0].mes)} a {mesLargo(ultimo.mes)}
          </p>
        </header>

        <section aria-label="Indicadores principales" className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          <KpiCard label="Cartera total" value={moneyShort(totalCartera)} hint={money(totalCartera)} />
          <KpiCard
            label="Más de 90 días"
            value={moneyShort(mas90.valor)}
            hint={`${pct(mas90.pct)} de la cartera`}
            tone="danger"
          />
          <KpiCard
            label={`Cobrado / facturado · ${ultimo.etiqueta}`}
            value={pct(ultimo.tasa)}
            delta={ultimo.tasa - anterior.tasa}
            deltaLabel={`${(Math.abs(ultimo.tasa - anterior.tasa) * 100).toFixed(1)} pts`}
            hint={`vs ${anterior.etiqueta}`}
          />
          <KpiCard
            label="Clientes sobre su límite"
            value={`${sobreLimite.length} de ${clientes.length}`}
            hint={`${moneyShort(sobreLimite.reduce((n, c) => n + c.total - c.limiteCredito, 0))} por encima`}
            tone={sobreLimite.length ? "danger" : undefined}
          />
        </section>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
          <ChartCard id="t-antiguedad" title="Antigüedad de saldos" subtitle={`Total ${money(totalCartera)}`}>
            <Antiguedad />
          </ChartCard>

          <ChartCard
            id="t-cobro"
            title="Cobrado frente a facturado"
            subtitle={`Brecha acumulada en 6 meses: ${money(brecha)}`}
          >
            <BarCompare
              data={mensual}
              xKey="etiqueta"
              format={money}
              axisFormat={moneyShort}
              description={`Facturado y cobrado por mes, de ${mesLargo(mensual[0].mes)} a ${mesLargo(ultimo.mes)}`}
              series={[
                { key: "facturado", label: "Facturado", color: "var(--chart-1)" },
                { key: "cobrado", label: "Cobrado", color: "var(--chart-2)" },
              ]}
              tooltipExtra={(label) => {
                const m = mensual.find((x) => x.etiqueta === label);
                return m ? (
                  <p className="mt-1.5 flex justify-between gap-4 border-t border-border pt-1.5 text-muted-foreground">
                    Cobrado / facturado <span className="font-medium text-popover-foreground tabular-nums">{pct(m.tasa)}</span>
                  </p>
                ) : null;
              }}
            />
            <ul className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Porcentaje cobrado sobre facturado por mes">
              {mensual.map((m) => (
                <li key={m.mes} className="grid gap-0.5 rounded-lg bg-muted px-2 py-1.5 text-center">
                  <span className="text-[11.5px] text-muted-foreground">{m.etiqueta}</span>
                  <span className={cn("text-[13px] font-semibold tabular-nums", m.tasa < 0.8 && "text-danger")}>
                    {pct(m.tasa)}
                  </span>
                </li>
              ))}
            </ul>
          </ChartCard>
        </div>

        <ChartCard
          id="t-clientes"
          title="Clientes que más deben"
          subtitle={verTodos ? `Los ${clientes.length} clientes` : `Los ${TOP} primeros de ${clientes.length}`}
          actions={
            <div role="radiogroup" aria-label="Ordenar por" className="inline-flex max-w-full flex-wrap rounded-[10px] bg-muted p-0.5">
              {ORDENES.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  role="radio"
                  aria-checked={orden === o.key}
                  onClick={() => setOrden(o.key)}
                  className={cn(
                    "h-9 cursor-pointer rounded-[8px] px-3 text-[12.5px] font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    orden === o.key ? "bg-card shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          }
        >
          <Clientes lista={visibles} maxTotal={maxTotal} onAbrir={setDetalle} />
          <div className="flex flex-wrap items-center justify-between gap-3">
            <ul className="flex flex-wrap gap-x-4 gap-y-1.5" aria-label="Leyenda de antigüedad">
              {TRAMOS.map((t) => (
                <li key={t.key} className="flex items-center gap-1.5 text-[12px] text-muted-foreground">
                  <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: t.color }} aria-hidden />
                  {t.label}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setVerTodos((v) => !v)}
              className="h-9 cursor-pointer rounded-[10px] px-3 text-[13px] font-medium ring-1 ring-border outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {verTodos ? `Ver solo los ${TOP} primeros` : `Ver los ${clientes.length} clientes`}
            </button>
          </div>
        </ChartCard>

        <footer className="pb-2 text-[12px] text-muted-foreground">Fuente: src/data/cartera.json</footer>
      </main>

      {detalle && <Detalle cliente={detalle} onCerrar={cerrar} />}
    </div>
  );
}

function Antiguedad() {
  return (
    <div className="grid gap-4">
      <div
        role="img"
        aria-label={`Distribución de la cartera por antigüedad: ${porTramo.map((t) => `${t.label} ${pct(t.pct)}`).join(", ")}`}
        className="flex h-4 w-full overflow-hidden rounded-full bg-muted"
      >
        {porTramo.map((t) => (
          <span key={t.key} style={{ width: `${t.pct * 100}%`, background: t.color }} className="h-full border-r-2 border-card last:border-r-0" />
        ))}
      </div>
      <table className="w-full text-[13px]">
        <caption className="sr-only">Saldo por tramo de antigüedad</caption>
        <thead className="sr-only">
          <tr>
            <th scope="col">Tramo</th>
            <th scope="col">Saldo</th>
            <th scope="col">Porcentaje</th>
          </tr>
        </thead>
        <tbody>
          {porTramo.map((t) => (
            <tr key={t.key} className="border-b border-border last:border-b-0">
              <th scope="row" className="py-2.5 text-left font-normal">
                <span className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-[3px]" style={{ background: t.color }} aria-hidden />
                  {t.label}
                </span>
              </th>
              <td className="py-2.5 text-right font-medium tabular-nums">{money(t.valor)}</td>
              <td className="w-16 py-2.5 text-right text-muted-foreground tabular-nums">{pct(t.pct)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <dl className="grid grid-cols-2 gap-2">
        <div className="grid gap-0.5 rounded-xl bg-muted p-3">
          <dt className="text-[12px] text-muted-foreground">Más de 60 días</dt>
          <dd className="text-[17px] font-semibold tabular-nums">{money(porTramo[2].valor + porTramo[3].valor)}</dd>
          <dd className="text-[12px] text-muted-foreground tabular-nums">{pct(porTramo[2].pct + porTramo[3].pct)} de la cartera</dd>
        </div>
        <div className="grid gap-0.5 rounded-xl bg-muted p-3">
          <dt className="text-[12px] text-muted-foreground">Clientes con saldo a +90 días</dt>
          <dd className="text-[17px] font-semibold tabular-nums">{clientes.filter((c) => c.saldoMas90 > 0).length} de {clientes.length}</dd>
        </div>
      </dl>
    </div>
  );
}

function BarraTramos({ c, escala }: { c: Cliente; escala: number }) {
  return (
    <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" style={{ width: `${Math.max(escala * 100, 4)}%` }} aria-hidden>
      {TRAMOS.map((t) =>
        c[t.key] > 0 ? <span key={t.key} style={{ flexGrow: c[t.key], background: t.color }} className="h-full" /> : null,
      )}
    </div>
  );
}

function Clientes({ lista, maxTotal, onAbrir }: { lista: Cliente[]; maxTotal: number; onAbrir: (c: Cliente) => void }) {
  return (
    <>
      {/* Escritorio y tableta: tabla */}
      <div className="hidden overflow-x-auto md:block">
        <table className="w-full text-[13px]">
          <caption className="sr-only">Clientes con mayor saldo por cobrar</caption>
          <thead>
            <tr className="border-b border-border text-left text-[12px] text-muted-foreground">
              <th scope="col" className="w-8 py-2 pr-2 font-medium">#</th>
              <th scope="col" className="py-2 pr-3 font-medium">Cliente</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">Saldo total</th>
              <th scope="col" className="w-[28%] py-2 pr-3 font-medium">Antigüedad</th>
              <th scope="col" className="py-2 pr-3 text-right font-medium">+90 días</th>
              <th scope="col" className="py-2 pr-1 text-right font-medium">Uso del límite</th>
              <th scope="col" className="w-6 py-2"><span className="sr-only">Detalle</span></th>
            </tr>
          </thead>
          <tbody>
            {lista.map((c, i) => (
              <tr
                key={c.cliente}
                tabIndex={0}
                aria-label={`Ver detalle de ${c.cliente}`}
                title={`Ver detalle de ${c.cliente}`}
                onClick={() => onAbrir(c)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onAbrir(c);
                  }
                }}
                className="cursor-pointer border-b border-border outline-none last:border-b-0 hover:bg-accent focus-visible:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <td className="py-2.5 pr-2 text-muted-foreground tabular-nums">{i + 1}</td>
                <td className="py-2.5 pr-3 font-medium whitespace-nowrap">{c.cliente}</td>
                <td className="py-2.5 pr-3 text-right font-medium tabular-nums">{money(c.total)}</td>
                <td className="py-2.5 pr-3"><BarraTramos c={c} escala={c.total / maxTotal} /></td>
                <td className={cn("py-2.5 pr-3 text-right tabular-nums", c.saldoMas90 > 0 ? "text-danger" : "text-muted-foreground")}>
                  {c.saldoMas90 > 0 ? money(c.saldoMas90) : "—"}
                </td>
                <td className="py-2.5 pr-1 text-right tabular-nums"><UsoLimite c={c} /></td>
                <td className="py-2.5 text-muted-foreground"><ChevronRight className="size-4" aria-hidden /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Móvil: tarjetas */}
      <ol className="grid gap-2 md:hidden">
        {lista.map((c, i) => (
          <li key={c.cliente}>
            <button
              type="button"
              onClick={() => onAbrir(c)}
              aria-label={`Ver detalle de ${c.cliente}`}
              className="grid w-full cursor-pointer gap-2 rounded-xl p-3 text-left ring-1 ring-border outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="min-w-0 truncate text-[13.5px] font-medium">
                  <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                  {c.cliente}
                </span>
                <span className="text-[14px] font-semibold tabular-nums">{money(c.total)}</span>
              </span>
              <BarraTramos c={c} escala={1} />
              <span className="flex justify-between gap-3 text-[12px] text-muted-foreground">
                <span>
                  +90 días:{" "}
                  <span className={cn("tabular-nums", c.saldoMas90 > 0 && "font-medium text-danger")}>
                    {c.saldoMas90 > 0 ? money(c.saldoMas90) : "—"}
                  </span>
                </span>
                <span>
                  Límite: <UsoLimite c={c} />
                </span>
              </span>
            </button>
          </li>
        ))}
      </ol>
    </>
  );
}

function UsoLimite({ c }: { c: Cliente }) {
  return c.sobreLimite ? (
    <span className="inline-flex items-center gap-1 rounded-md bg-danger-soft px-1.5 py-0.5 font-medium text-danger tabular-nums">
      <AlertTriangle className="size-3" aria-hidden />
      {pct(c.usoLimite)}
    </span>
  ) : (
    <span className="tabular-nums">{pct(c.usoLimite)}</span>
  );
}

function Detalle({ cliente: c, onCerrar }: { cliente: Cliente; onCerrar: () => void }) {
  const cerrarRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    cerrarRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      previo?.focus();
    };
  }, [onCerrar]);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCerrar} aria-hidden />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="detalle-titulo"
        className="relative grid h-full w-full max-w-[420px] content-start gap-5 overflow-y-auto bg-card p-5 text-card-foreground shadow-2xl ring-1 ring-border"
      >
        <header className="flex items-start justify-between gap-3">
          <div className="grid gap-0.5">
            <p className="text-[12px] text-muted-foreground">Detalle del cliente</p>
            <h2 id="detalle-titulo" className="text-[18px] font-semibold">{c.cliente}</h2>
          </div>
          <button
            ref={cerrarRef}
            type="button"
            onClick={onCerrar}
            aria-label="Cerrar detalle"
            className="grid size-10 cursor-pointer place-items-center rounded-[10px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
          >
            <X className="size-5" aria-hidden />
          </button>
        </header>

        <dl className="grid grid-cols-2 gap-3">
          <div className="grid gap-1 rounded-xl bg-muted p-3">
            <dt className="text-[12px] text-muted-foreground">Saldo total</dt>
            <dd className="text-[18px] font-semibold tabular-nums">{money(c.total)}</dd>
          </div>
          <div className="grid gap-1 rounded-xl bg-muted p-3">
            <dt className="text-[12px] text-muted-foreground">Límite de crédito</dt>
            <dd className="text-[18px] font-semibold tabular-nums">{money(c.limiteCredito)}</dd>
          </div>
        </dl>

        <div className="grid gap-2">
          <div className="flex items-baseline justify-between text-[13px]">
            <span className="text-muted-foreground">Uso del límite</span>
            <UsoLimite c={c} />
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <div
              className={cn("h-full rounded-full", c.sobreLimite ? "bg-danger" : "bg-[var(--chart-2)]")}
              style={{ width: `${Math.min(c.usoLimite, 1) * 100}%` }}
            />
          </div>
          {c.sobreLimite && (
            <p className="text-[12.5px] text-danger">Excede su límite en {money(c.total - c.limiteCredito)}.</p>
          )}
        </div>

        <div className="grid gap-2">
          <h3 className="text-[13px] font-semibold">Saldo por antigüedad</h3>
          <BarraTramos c={c} escala={1} />
          <table className="w-full text-[13px]">
            <caption className="sr-only">Saldo de {c.cliente} por tramo de antigüedad</caption>
            <tbody>
              {TRAMOS.map((t) => (
                <tr key={t.key} className="border-b border-border last:border-b-0">
                  <th scope="row" className="py-2 text-left font-normal">
                    <span className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: t.color }} aria-hidden />
                      {t.label}
                    </span>
                  </th>
                  <td className={cn("py-2 text-right tabular-nums", c[t.key] === 0 ? "text-muted-foreground" : "font-medium")}>
                    {c[t.key] > 0 ? money(c[t.key]) : "—"}
                  </td>
                  <td className="w-16 py-2 text-right text-muted-foreground tabular-nums">
                    {c.total ? pct(c[t.key] / c.total) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </aside>
    </div>
  );
}
