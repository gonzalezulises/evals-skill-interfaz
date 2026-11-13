import * as React from "react";
import { AlertTriangle, ChevronRight, RefreshCw, Search, X } from "lucide-react";
import { BarCompare, ChartCard, KpiCard, type Series } from "@/components/charts";
import { DetalleCliente } from "@/components/DetalleCliente";
import { cn } from "@/lib/utils";
import {
  TRAMOS,
  cargarCartera,
  enriquecer,
  mesCorto,
  mesLargo,
  pct,
  usd,
  usdCorto,
  type Cartera,
  type Cliente,
  type TramoKey,
} from "@/lib/cartera";

type Estado = { tipo: "cargando" } | { tipo: "error"; mensaje: string } | { tipo: "listo"; datos: Cartera };

export default function App() {
  const [estado, setEstado] = React.useState<Estado>({ tipo: "cargando" });

  const cargar = React.useCallback(() => {
    setEstado({ tipo: "cargando" });
    cargarCartera()
      .then((datos) => setEstado({ tipo: "listo", datos }))
      .catch((e: unknown) => setEstado({ tipo: "error", mensaje: e instanceof Error ? e.message : String(e) }));
  }, []);
  React.useEffect(cargar, [cargar]);

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto grid w-full max-w-[1280px] gap-4 px-4 py-5 sm:px-6 sm:py-8 lg:gap-5">
        {estado.tipo === "cargando" && <Esqueleto />}
        {estado.tipo === "error" && <ErrorCarga mensaje={estado.mensaje} onReintentar={cargar} />}
        {estado.tipo === "listo" && <Tablero datos={estado.datos} />}
      </div>
    </div>
  );
}

function Encabezado({ corte }: { corte?: string }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-2">
      <div>
        <p className="text-[13px] font-medium text-muted-foreground">Andes Logística · Finanzas</p>
        <h1 className="text-[24px] font-semibold tracking-[-0.02em] sm:text-[28px]">Cartera por cobrar</h1>
      </div>
      {corte && <p className="text-[13px] text-muted-foreground">Último mes con datos: {corte}</p>}
    </header>
  );
}

function Tablero({ datos }: { datos: Cartera }) {
  const clientes = React.useMemo(() => datos.clientes.map(enriquecer), [datos]);
  const meses = datos.cobradoMensual;
  const [tramo, setTramo] = React.useState<TramoKey | null>(null);
  const [seleccionado, setSeleccionado] = React.useState<Cliente | null>(null);

  if (!clientes.length && !meses.length) {
    return (
      <>
        <Encabezado />
        <Vacio titulo="Sin datos de cartera" texto="El archivo de cartera llegó sin clientes ni meses. Revisa la exportación del sistema contable y vuelve a cargarla." />
      </>
    );
  }

  const total = clientes.reduce((n, c) => n + c.total, 0);
  const porTramo = TRAMOS.map((t) => ({ ...t, monto: clientes.reduce((n, c) => n + c[t.key], 0) }));
  const mas90 = porTramo[3].monto;
  const vencida = total - porTramo[0].monto;
  const sobreLimite = clientes.filter((c) => c.uso > 1);

  const ef = meses.map((m) => ({ ...m, efectividad: m.facturado ? m.cobrado / m.facturado : 0 }));
  const ultimo = ef[ef.length - 1];
  const previo = ef[ef.length - 2];
  const fact6 = meses.reduce((n, m) => n + m.facturado, 0);
  const cobr6 = meses.reduce((n, m) => n + m.cobrado, 0);

  return (
    <>
      <Encabezado corte={ultimo ? mesLargo(ultimo.mes) : undefined} />

      <section aria-label="Indicadores principales" className="grid gap-3 sm:grid-cols-3 lg:grid-cols-[1.5fr_1fr_1fr_1fr] lg:gap-4">
        <KpiCard hero label="Cartera total por cobrar" value={usdCorto(total)} hint={`${clientes.length} clientes · ${pct(vencida / (total || 1))} con más de 30 días`} className="sm:col-span-3 lg:col-span-1" />
        <KpiCard label="Saldo con más de 90 días" value={usdCorto(mas90)} hint={`${pct(mas90 / (total || 1), 1)} de la cartera`} />
        {ultimo && (
          <KpiCard
            label={`Cobrado / facturado en ${mesCorto(ultimo.mes)}`}
            value={pct(ultimo.efectividad)}
            delta={previo ? ultimo.efectividad - previo.efectividad : undefined}
            deltaText={previo ? `${((ultimo.efectividad - previo.efectividad) * 100).toLocaleString("es-PA", { maximumFractionDigits: 1, signDisplay: "exceptZero" })} pp` : undefined}
            period={previo ? `vs. ${mesCorto(previo.mes)}` : undefined}
            trend={ef.map((m) => m.efectividad)}
          />
        )}
        <KpiCard label="Clientes sobre su límite de crédito" value={`${sobreLimite.length}`} hint={`de ${clientes.length} · exceden por ${usdCorto(sobreLimite.reduce((n, c) => n + (c.total - c.limiteCredito), 0))}`}>
          {sobreLimite.length > 0 && (
            <p className="flex items-center gap-1.5 text-[13px] font-medium text-critical-text">
              <AlertTriangle className="size-4" aria-hidden /> Revisar antes de despachar
            </p>
          )}
        </KpiCard>
      </section>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.25fr] lg:gap-5">
        <ChartCard title="Antigüedad de los saldos" subtitle={`${usd(total)} en ${clientes.length} clientes`}>
          <BarraAntiguedad tramos={porTramo} total={total} />
          <ul className="grid gap-1" aria-label="Filtrar clientes por tramo de antigüedad">
            {porTramo.map((t) => {
              const activo = tramo === t.key;
              return (
                <li key={t.key}>
                  <button
                    type="button"
                    aria-pressed={activo}
                    aria-label={`${t.label}: ${usd(t.monto)}, ${pct(t.monto / (total || 1))}. ${activo ? "Quitar filtro" : "Ver clientes con saldo en este tramo"}`}
                    onClick={() => setTramo(activo ? null : t.key)}
                    className={cn(
                      "flex min-h-11 w-full cursor-pointer items-center justify-between gap-3 rounded-lg px-2.5 text-left text-[14px] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring",
                      activo && "bg-accent ring-1 ring-foreground/30",
                    )}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 shrink-0 rounded-[3px]" style={{ background: t.color }} />
                      {t.label}
                    </span>
                    <span className="flex items-center gap-3 tabular-nums">
                      <span className="font-medium">{usd(t.monto)}</span>
                      <span className="w-12 text-right text-muted-foreground">{pct(t.monto / (total || 1))}</span>
                      <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </ChartCard>

        <ChartCard
          title="Cobrado frente a facturado"
          subtitle={meses.length ? `${mesLargo(meses[0].mes)} – ${mesLargo(meses[meses.length - 1].mes)} · se cobró el ${pct(cobr6 / (fact6 || 1))} de lo facturado` : undefined}
        >
          {meses.length ? (
            <BarCompare
              data={ef}
              xKey="mes"
              xFormat={mesCorto}
              format={usd}
              axisFormat={usdCorto}
              series={SERIES_MES}
              height={260}
              description="Facturado y cobrado por mes"
              tooltipExtra={(row) => (
                <p className="flex justify-between gap-4 text-muted-foreground">
                  Cobrado / facturado <span className="font-medium text-popover-foreground tabular-nums">{pct(Number(row.efectividad))}</span>
                </p>
              )}
              tableExtra={{ label: "Cobrado / facturado", value: (r) => pct(r.efectividad) }}
            />
          ) : (
            <Vacio titulo="Sin movimientos mensuales" texto="No hay meses con facturación ni cobros registrados." />
          )}
          {meses.length > 0 && (
            <ol className="grid grid-cols-3 gap-2 sm:grid-cols-6" aria-label="Cobrado sobre facturado por mes">
              {ef.map((m) => (
                <li key={m.mes} className="rounded-lg bg-muted px-2 py-1.5 text-center">
                  <span className="block text-[12px] text-muted-foreground">{mesCorto(m.mes)}</span>
                  <span className={cn("block text-[14px] font-semibold tabular-nums", m.efectividad < 0.8 && "text-critical-text")}>{pct(m.efectividad)}</span>
                </li>
              ))}
            </ol>
          )}
        </ChartCard>
      </div>

      <Deudores clientes={clientes} tramo={tramo} onQuitarTramo={() => setTramo(null)} onAbrir={setSeleccionado} />

      <DetalleCliente cliente={seleccionado} onCerrar={() => setSeleccionado(null)} />
    </>
  );
}

const SERIES_MES: Series[] = [
  { key: "facturado", label: "Facturado", color: "var(--chart-1)" },
  { key: "cobrado", label: "Cobrado", color: "var(--chart-2)" },
];

function BarraAntiguedad({ tramos, total }: { tramos: { key: string; label: string; color: string; monto: number }[]; total: number }) {
  return (
    <div className="flex h-9 w-full gap-0.5 overflow-hidden rounded-md" role="img" aria-label={`Distribución por antigüedad: ${tramos.map((t) => `${t.label} ${pct(t.monto / (total || 1))}`).join(", ")}`}>
      {tramos
        .filter((t) => t.monto > 0)
        .map((t) => (
          <div key={t.key} className="h-full" style={{ width: `${(t.monto / (total || 1)) * 100}%`, background: t.color }} title={`${t.label}: ${usd(t.monto)}`} />
        ))}
    </div>
  );
}

function MiniAntiguedad({ c }: { c: Cliente }) {
  return (
    <div className="flex h-2.5 w-full min-w-[96px] gap-px overflow-hidden rounded-sm bg-muted" aria-hidden>
      {TRAMOS.map((t) => (c[t.key] > 0 ? <div key={t.key} style={{ width: `${(c[t.key] / (c.total || 1)) * 100}%`, background: t.color }} /> : null))}
    </div>
  );
}

function UsoLimite({ c }: { c: Cliente }) {
  const sobre = c.uso > 1;
  return (
    <span className={cn("inline-flex items-center gap-1 tabular-nums", sobre && "font-medium text-critical-text")}>
      {sobre && <AlertTriangle className="size-3.5" aria-hidden />}
      {pct(c.uso)}
      {sobre && <span className="sr-only"> (sobre el límite)</span>}
    </span>
  );
}

function Deudores({ clientes, tramo, onQuitarTramo, onAbrir }: { clientes: Cliente[]; tramo: TramoKey | null; onQuitarTramo: () => void; onAbrir: (c: Cliente) => void }) {
  const [q, setQ] = React.useState("");
  const [todos, setTodos] = React.useState(false);
  const tramoInfo = TRAMOS.find((t) => t.key === tramo);

  const filtrados = clientes
    .filter((c) => (tramo ? c[tramo] > 0 : true))
    .filter((c) => c.cliente.toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => (tramo ? b[tramo] - a[tramo] : b.total - a.total));
  const visibles = todos || q ? filtrados : filtrados.slice(0, 10);

  return (
    <ChartCard
      title={tramoInfo ? `Clientes con saldo de ${tramoInfo.label.toLowerCase()}` : "Clientes que más deben"}
      subtitle={tramoInfo ? `Ordenados por saldo en ese tramo · ${filtrados.length} clientes` : "Ordenados por saldo total · pulsa un cliente para ver su detalle"}
      actions={
        <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
          {tramoInfo && (
            <button
              type="button"
              onClick={onQuitarTramo}
              className="inline-flex min-h-11 cursor-pointer items-center gap-1.5 rounded-lg bg-muted px-3 text-[13px] font-medium outline-none hover:bg-border focus-visible:ring-2 focus-visible:ring-ring"
            >
              <X className="size-4" aria-hidden /> Quitar filtro: {tramoInfo.label}
            </button>
          )}
          <label className="grid w-full gap-1 text-[12px] font-medium text-muted-foreground sm:w-60">
            Buscar cliente
            <span className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre del cliente"
                className="h-11 w-full rounded-lg bg-card pr-3 pl-9 text-[14px] text-foreground ring-1 ring-border outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </span>
          </label>
        </div>
      }
    >
      {visibles.length === 0 ? (
        <Vacio
          titulo="Ningún cliente coincide"
          texto={q ? `No hay clientes con «${q}»${tramoInfo ? ` y saldo de ${tramoInfo.label.toLowerCase()}` : ""}. Revisa el nombre o borra la búsqueda.` : "No hay clientes con saldo en este tramo."}
          accion={{ texto: "Borrar búsqueda y filtros", onClick: () => { setQ(""); onQuitarTramo(); } }}
        />
      ) : (
        <>
          {/* Móvil: tarjetas */}
          <ul className="grid gap-2 md:hidden">
            {visibles.map((c, i) => (
              <li key={c.cliente}>
                <button
                  type="button"
                  onClick={() => onAbrir(c)}
                  aria-label={`Ver detalle de ${c.cliente}`}
                  className="grid w-full cursor-pointer gap-2 rounded-xl p-3 text-left ring-1 ring-border outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-[14px] font-medium">
                      <span className="mr-1.5 text-muted-foreground tabular-nums">{i + 1}.</span>
                      {c.cliente}
                    </span>
                    <span className="text-[15px] font-semibold tabular-nums">{usd(tramo ? c[tramo] : c.total)}</span>
                  </span>
                  <MiniAntiguedad c={c} />
                  <span className="flex justify-between gap-3 text-[13px] text-muted-foreground">
                    <span>+90 días: <span className="text-foreground tabular-nums">{usd(c.saldoMas90)}</span></span>
                    <span>Límite usado: <UsoLimite c={c} /></span>
                  </span>
                </button>
              </li>
            ))}
          </ul>

          {/* Tableta y escritorio: tabla */}
          <div className="hidden md:block">
            <table className="w-full border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-border text-left text-[12px] font-medium text-muted-foreground">
                  <th scope="col" className="py-2 pr-3 font-medium">Cliente</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">{tramoInfo ? tramoInfo.label : "Saldo total"}</th>
                  <th scope="col" className="hidden py-2 pr-3 font-medium lg:table-cell">Antigüedad</th>
                  <th scope="col" className="py-2 pr-3 text-right font-medium">+90 días</th>
                  <th scope="col" className="py-2 text-right font-medium">Límite usado</th>
                </tr>
              </thead>
              <tbody>
                {visibles.map((c, i) => (
                  <tr key={c.cliente} onClick={() => onAbrir(c)} className="cursor-pointer border-b border-border/70 last:border-0 hover:bg-accent/60">
                    <th scope="row" className="py-0 pr-3 text-left font-normal">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onAbrir(c); }}
                        aria-label={`Ver detalle de ${c.cliente}`}
                        className="flex min-h-11 cursor-pointer items-center gap-2 rounded-md text-left font-medium outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="w-5 text-right text-[13px] text-muted-foreground tabular-nums">{i + 1}</span>
                        {c.cliente}
                      </button>
                    </th>
                    <td className="pr-3 text-right font-semibold tabular-nums">{usd(tramo ? c[tramo] : c.total)}</td>
                    <td className="hidden w-[22%] pr-3 lg:table-cell"><MiniAntiguedad c={c} /></td>
                    <td className={cn("pr-3 text-right tabular-nums", c.saldoMas90 === 0 && "text-muted-foreground")}>{usd(c.saldoMas90)}</td>
                    <td className="text-right"><UsoLimite c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {!q && filtrados.length > 10 && (
            <button
              type="button"
              onClick={() => setTodos((v) => !v)}
              className="min-h-11 cursor-pointer justify-self-start rounded-lg px-3 text-[14px] font-medium text-[color:var(--chart-1)] outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring"
            >
              {todos ? "Ver solo los 10 primeros" : `Ver los ${filtrados.length} clientes`}
            </button>
          )}
        </>
      )}
    </ChartCard>
  );
}

function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: { texto: string; onClick: () => void } }) {
  return (
    <div className="grid justify-items-start gap-2 rounded-xl border border-dashed border-border p-5">
      <p className="text-[15px] font-semibold">{titulo}</p>
      <p className="text-[14px] text-muted-foreground">{texto}</p>
      {accion && (
        <button type="button" onClick={accion.onClick} className="min-h-11 cursor-pointer rounded-lg bg-foreground px-4 text-[14px] font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          {accion.texto}
        </button>
      )}
    </div>
  );
}

function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <>
      <Encabezado />
      <div role="alert" className="grid justify-items-start gap-2 rounded-2xl bg-card p-5 ring-1 ring-critical/40">
        <p className="flex items-center gap-2 text-[15px] font-semibold text-critical-text">
          <AlertTriangle className="size-5" aria-hidden /> No se pudieron cargar los datos de cartera
        </p>
        <p className="text-[14px] text-muted-foreground">Detalle: {mensaje}. Vuelve a intentarlo; si persiste, avisa a TI.</p>
        <button type="button" onClick={onReintentar} className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg bg-foreground px-4 text-[14px] font-medium text-background outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
          <RefreshCw className="size-4" aria-hidden /> Reintentar
        </button>
      </div>
    </>
  );
}

function Esqueleto() {
  const b = "animate-pulse rounded-2xl bg-muted";
  return (
    <div aria-busy="true" aria-live="polite" className="grid gap-4">
      <span className="sr-only">Cargando cartera por cobrar…</span>
      <div className={cn(b, "h-14 w-64")} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className={cn(b, "h-32")} />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={cn(b, "h-80")} />
        <div className={cn(b, "h-80")} />
      </div>
      <div className={cn(b, "h-96")} />
    </div>
  );
}
