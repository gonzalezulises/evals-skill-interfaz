import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, ChevronRight, Info, RefreshCw, Inbox } from "lucide-react";
import { Drawer } from "@/components/Drawer";
import { KpiCard, Sparkline } from "@/components/Kpi";
import { cn } from "@/lib/utils";
import {
  CORTE,
  PRIORIDADES,
  cumpleSla,
  diasAbierto,
  estaAbierto,
  fecha,
  fetchTickets,
  horas,
  mediana,
  pct,
  pctSla,
  porRiesgo,
  resolucionValida,
  slaSemanal,
  ventana,
  type Prioridad,
  type Ticket,
} from "@/lib/tickets";

type Filtro = Prioridad | "todas";
type Detalle =
  | { tipo: "prioridad"; p: Prioridad }
  | { tipo: "abiertos" }
  | { tipo: "sla" }
  | { tipo: "respuesta" }
  | { tipo: "resolucion" }
  | { tipo: "agente"; agente: string }
  | { tipo: "ticket"; t: Ticket }
  | { tipo: "metodo" };

const COLOR_P: Record<Prioridad, string> = {
  crítica: "var(--p-critica)",
  alta: "var(--p-alta)",
  media: "var(--p-media)",
  baja: "var(--p-baja)",
};
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const FOCO = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export default function App() {
  const [datos, setDatos] = useState<Ticket[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Filtro>("todas");
  const [detalle, setDetalle] = useState<Detalle | null>(null);
  const [abierto, setAbierto] = useState(false);

  const cargar = useCallback(() => {
    setError(null);
    setDatos(null);
    fetchTickets().then(setDatos, (e: Error) => setError(e.message));
  }, []);
  useEffect(cargar, [cargar]);

  const abrir = (d: Detalle) => {
    setDetalle(d);
    setAbierto(true);
  };

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <header className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div>
          <p className="text-sm font-medium text-ink-2">Andes Logística · Soporte</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Escalamientos de soporte</h1>
          {datos && datos.length > 0 && (
            <p className="mt-1 text-sm text-ink-2">
              Corte al {fecha(CORTE)} · {datos.length} tickets creados desde {fecha(datos.reduce((m, t) => (t.abierto < m ? t.abierto : m), CORTE))}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => abrir({ tipo: "metodo" })}
          className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-surface px-4 text-sm font-medium text-ink hover:bg-surface-2", FOCO)}
        >
          <Info className="size-4" aria-hidden />
          Cómo se calcula
        </button>
      </header>

      <main className="mt-6">
        {error ? (
          <Estado
            icono={<AlertTriangle className="size-6 text-bad" aria-hidden />}
            titulo="No se pudieron cargar los tickets"
            texto={`${error} Los datos no se muestran incompletos: vuelve a intentarlo.`}
            accion={
              <button type="button" onClick={cargar} className={cn("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl bg-ink px-4 text-sm font-semibold text-surface", FOCO)}>
                <RefreshCw className="size-4" aria-hidden /> Reintentar
              </button>
            }
          />
        ) : !datos ? (
          <Esqueleto />
        ) : datos.length === 0 ? (
          <Estado
            icono={<Inbox className="size-6 text-ink-2" aria-hidden />}
            titulo="No hay tickets registrados"
            texto="La API respondió sin tickets para el período. Si esperabas datos, revisa que la integración con la mesa de ayuda esté activa."
          />
        ) : (
          <Tablero datos={datos} filtro={filtro} setFiltro={setFiltro} abrir={abrir} />
        )}
      </main>

      <Drawer open={abierto} onClose={() => setAbierto(false)} {...tituloDetalle(detalle)}>
        {detalle && datos && <ContenidoDetalle d={detalle} datos={datos} filtro={filtro} abrir={abrir} />}
      </Drawer>
    </div>
  );
}

/* ----------------------------------------------------------------- tablero -- */

function Tablero({ datos, filtro, setFiltro, abrir }: { datos: Ticket[]; filtro: Filtro; setFiltro: (f: Filtro) => void; abrir: (d: Detalle) => void }) {
  const ts = useMemo(() => (filtro === "todas" ? datos : datos.filter((t) => t.prioridad === filtro)), [datos, filtro]);
  const abiertos = ts.filter(estaAbierto);
  const fueraSla = abiertos.filter((t) => !cumpleSla(t));
  const ult = ventana(ts, 0, 30);
  const ant = ventana(ts, 30, 60);
  const slaUlt = pctSla(ult);
  const slaAnt = pctSla(ant);
  const respUlt = mediana(ult.map((t) => t.primeraRespuestaHoras));
  const respAnt = mediana(ant.map((t) => t.primeraRespuestaHoras));
  const resUlt = mediana(ult.map(resolucionValida).filter((h): h is number => h !== null));
  const resAnt = mediana(ant.map(resolucionValida).filter((h): h is number => h !== null));
  const semanas = slaSemanal(ts);
  const periodo = "vs. 30 días anteriores";

  return (
    <div className="grid gap-6">
      <Filtros filtro={filtro} setFiltro={setFiltro} />

      <section aria-label="Indicadores principales" className="grid gap-3 md:grid-cols-3">
        <TarjetaAbiertos abiertos={abiertos} fueraSla={fueraSla.length} filtro={filtro} abrir={abrir} />
        <KpiCard
          label="Cumplimiento de SLA · 30 días"
          value={slaUlt === null ? "—" : Math.round(slaUlt * 100)}
          unit={slaUlt === null ? undefined : "%"}
          delta={deltaPuntos(slaUlt, slaAnt, periodo)}
          trend={<Sparkline data={semanas.map((s) => s.pct)} label={`Cumplimiento semanal: ${semanas.map((s) => `${Math.round(s.pct)} %`).join(", ")}`} />}
          onOpen={() => abrir({ tipo: "sla" })}
          openLabel={`Cumplimiento de SLA en 30 días: ${pct(slaUlt)}. Abrir detalle por prioridad`}
        />
        <KpiCard
          label="Mediana de primera respuesta · 30 días"
          value={respUlt === null ? "—" : respUlt.toLocaleString("es", { maximumFractionDigits: 1 })}
          unit={respUlt === null ? undefined : "h"}
          delta={deltaHoras(respUlt, respAnt, periodo)}
          onOpen={() => abrir({ tipo: "respuesta" })}
          openLabel={`Mediana de primera respuesta en 30 días: ${horas(respUlt)}. Abrir detalle por prioridad`}
        />
        <KpiCard
          label="Mediana de resolución · 30 días"
          value={resUlt === null ? "—" : resUlt.toLocaleString("es", { maximumFractionDigits: 0 })}
          unit={resUlt === null ? undefined : "h"}
          delta={deltaHoras(resUlt, resAnt, periodo)}
          onOpen={() => abrir({ tipo: "resolucion" })}
          openLabel={`Mediana de resolución en 30 días: ${horas(resUlt)}. Abrir detalle por prioridad`}
        />
      </section>

      <div className="grid items-start gap-6 lg:grid-cols-5">
        <Agentes ts={ts} abrir={abrir} className="lg:col-span-2" />
        <Cola abiertos={abiertos} abrir={abrir} className="lg:col-span-3" />
      </div>
    </div>
  );
}

function deltaPuntos(a: number | null, b: number | null, period: string) {
  if (a === null || b === null) return undefined;
  const v = Math.round((a - b) * 100);
  return { value: v, text: `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v)} pts`, good: "up" as const, period };
}
function deltaHoras(a: number | null, b: number | null, period: string) {
  if (a === null || b === null) return undefined;
  const v = Math.round((a - b) * 10) / 10;
  return { value: v, text: `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toLocaleString("es")} h`, good: "down" as const, period };
}

function Filtros({ filtro, setFiltro }: { filtro: Filtro; setFiltro: (f: Filtro) => void }) {
  const opciones: Filtro[] = ["todas", ...PRIORIDADES];
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
      <span id="filtro-prioridad" className="text-sm font-medium text-ink-2">
        Prioridad
      </span>
      <div role="radiogroup" aria-labelledby="filtro-prioridad" className="flex flex-wrap gap-1 rounded-xl bg-surface-2 p-1">
        {opciones.map((o) => (
          <button
            key={o}
            type="button"
            role="radio"
            aria-checked={filtro === o}
            onClick={() => setFiltro(o)}
            className={cn(
              "min-h-11 cursor-pointer rounded-lg px-3 text-sm font-medium sm:px-4",
              FOCO,
              filtro === o ? "bg-surface text-ink shadow-sm" : "text-ink-2 hover:text-ink",
            )}
          >
            {cap(o)}
          </button>
        ))}
      </div>
    </div>
  );
}

function TarjetaAbiertos({ abiertos, fueraSla, filtro, abrir }: { abiertos: Ticket[]; fueraSla: number; filtro: Filtro; abrir: (d: Detalle) => void }) {
  const filas = PRIORIDADES.filter((p) => filtro === "todas" || p === filtro).map((p) => {
    const g = abiertos.filter((t) => t.prioridad === p);
    return { p, n: g.length, fuera: g.filter((t) => !cumpleSla(t)).length, edad: g.length ? Math.max(...g.map(diasAbierto)) : null };
  });
  const total = abiertos.length;
  return (
    <section aria-labelledby="t-abiertos" className="grid content-between gap-4 rounded-2xl border border-line bg-surface p-4 md:col-span-3 lg:col-span-2 lg:row-span-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="t-abiertos" className="text-sm font-medium text-ink-2">
            Escalamientos abiertos
          </h2>
          <p className="mt-2 text-5xl leading-none font-semibold tracking-tight tabular-nums text-ink">{total}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm text-ink">
            <AlertTriangle className="size-4 text-bad" aria-hidden />
            <span>
              <strong className="font-semibold tabular-nums">{fueraSla}</strong> respondidos fuera de SLA
            </span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => abrir({ tipo: "abiertos" })}
          className={cn("inline-flex min-h-11 cursor-pointer items-center gap-1 rounded-xl px-3 text-sm font-medium text-ink hover:bg-surface-2", FOCO)}
        >
          Ver los {total} <ChevronRight className="size-4" aria-hidden />
        </button>
      </div>

      {total > 0 && (
        <div className="flex h-3 w-full gap-0.5 overflow-hidden rounded-full" aria-hidden>
          {filas.filter((f) => f.n).map((f) => (
            <span key={f.p} style={{ flexGrow: f.n, background: COLOR_P[f.p] }} />
          ))}
        </div>
      )}

      <ul className="grid gap-1" aria-label="Abiertos por prioridad">
        {filas.map((f) => (
          <li key={f.p}>
            <button
              type="button"
              onClick={() => abrir({ tipo: "prioridad", p: f.p })}
              disabled={!f.n}
              aria-label={`${cap(f.p)}: ${f.n} abiertos, ${f.fuera} fuera de SLA. Ver tickets`}
              className={cn(
                "grid min-h-11 w-full cursor-pointer grid-cols-[1fr_auto_auto_20px] items-center gap-x-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2 disabled:cursor-default disabled:hover:bg-transparent sm:grid-cols-[1fr_64px_96px_96px_20px]",
                FOCO,
              )}
            >
              <span className="flex items-center gap-2 font-medium text-ink">
                <span className="size-2.5 shrink-0 rounded-sm" style={{ background: COLOR_P[f.p] }} aria-hidden />
                {cap(f.p)}
              </span>
              <span className="text-right font-semibold tabular-nums text-ink">{f.n}</span>
              <span className={cn("text-right tabular-nums", f.fuera ? "text-ink" : "text-ink-2")}>
                {f.fuera} <span className="text-ink-2">fuera</span>
              </span>
              <span className="hidden text-right tabular-nums text-ink-2 sm:block">{f.edad === null ? "—" : `${f.edad} d máx.`}</span>
              <ChevronRight className={cn("size-4 text-ink-3", !f.n && "invisible")} aria-hidden />
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* ----------------------------------------------------------------- agentes -- */

function statsAgentes(ts: Ticket[]) {
  const nombres = [...new Set(ts.map((t) => t.agente))];
  return nombres
    .map((a) => {
      const g = ts.filter((t) => t.agente === a);
      return { agente: a, n: g.length, resp: mediana(g.map((t) => t.primeraRespuestaHoras)) ?? 0, sla: pctSla(g), abiertos: g.filter(estaAbierto).length };
    })
    .sort((x, y) => x.resp - y.resp);
}

function Agentes({ ts, abrir, className }: { ts: Ticket[]; abrir: (d: Detalle) => void; className?: string }) {
  const filas = statsAgentes(ts);
  const max = Math.max(...filas.map((f) => f.resp), 1);
  return (
    <section aria-labelledby="t-agentes" className={cn("rounded-2xl border border-line bg-surface p-4", className)}>
      <h2 id="t-agentes" className="text-base font-semibold text-ink">
        Primera respuesta por agente
      </h2>
      <p className="mt-0.5 text-sm text-ink-2">Mediana en horas, todo el período · de más rápido a más lento</p>
      <div className="mt-3 grid grid-cols-[1fr_auto_auto] gap-x-3 px-2 text-xs font-medium text-ink-2" aria-hidden>
        <span>Agente</span>
        <span className="w-14 text-right">SLA</span>
        <span className="w-14 text-right">Abiertos</span>
      </div>
      <ul className="mt-1 grid gap-1">
        {filas.map((f) => (
          <li key={f.agente}>
            <button
              type="button"
              onClick={() => abrir({ tipo: "agente", agente: f.agente })}
              aria-label={`${f.agente}: mediana ${horas(f.resp)}, cumplimiento de SLA ${pct(f.sla)}, ${f.abiertos} abiertos. Ver tickets`}
              className={cn("grid min-h-11 w-full cursor-pointer grid-cols-[1fr_auto_auto] items-center gap-x-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-2", FOCO)}
            >
              <span className="grid gap-1.5">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{f.agente}</span>
                  <span className="tabular-nums text-ink">{horas(f.resp)}</span>
                </span>
                <span className="h-2 w-full rounded-full bg-surface-2" aria-hidden>
                  <span className="block h-2 rounded-full bg-accent" style={{ width: `${(f.resp / max) * 100}%` }} />
                </span>
              </span>
              <span className="w-14 text-right tabular-nums text-ink">{pct(f.sla)}</span>
              <span className="w-14 text-right tabular-nums text-ink-2">{f.abiertos}</span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

/* -------------------------------------------------------------------- cola -- */

function Cola({ abiertos, abrir, className }: { abiertos: Ticket[]; abrir: (d: Detalle) => void; className?: string }) {
  const [todos, setTodos] = useState(false);
  const orden = [...abiertos].sort(porRiesgo);
  const vista = todos ? orden : orden.slice(0, 8);
  return (
    <section aria-labelledby="t-cola" className={cn("min-w-0 rounded-2xl border border-line bg-surface p-4", className)}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 id="t-cola" className="text-base font-semibold text-ink">
            Por atender primero
          </h2>
          <p className="mt-0.5 text-sm text-ink-2">Abiertos ordenados por riesgo: fuera de SLA, prioridad y antigüedad</p>
        </div>
      </div>
      {orden.length === 0 ? (
        <p className="mt-4 rounded-xl bg-surface-2 p-4 text-sm text-ink-2">No hay escalamientos abiertos con este filtro: no queda nada pendiente.</p>
      ) : (
        <>
          <ListaTickets ts={vista} abrir={abrir} />
          {orden.length > 8 && (
            <button
              type="button"
              onClick={() => setTodos((v) => !v)}
              aria-expanded={todos}
              className={cn("mt-3 inline-flex min-h-11 w-full cursor-pointer items-center justify-center rounded-xl border border-line text-sm font-medium text-ink hover:bg-surface-2", FOCO)}
            >
              {todos ? "Mostrar solo los 8 primeros" : `Mostrar los ${orden.length} abiertos`}
            </button>
          )}
        </>
      )}
    </section>
  );
}

function SlaChip({ t }: { t: Ticket }) {
  const ok = cumpleSla(t);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-ink">
      {ok ? <CheckCircle2 className="size-4 text-ok" aria-hidden /> : <AlertTriangle className="size-4 text-bad" aria-hidden />}
      {ok ? "En SLA" : "Fuera"}
    </span>
  );
}

function PrioridadTag({ p }: { p: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-ink">
      <span className="size-2.5 rounded-sm" style={{ background: COLOR_P[p as Prioridad] }} aria-hidden />
      {cap(p)}
    </span>
  );
}

/** Tabla en tableta y escritorio (scroll interno con ID fijo); tarjetas en móvil. */
function ListaTickets({ ts, abrir }: { ts: Ticket[]; abrir: (d: Detalle) => void }) {
  return (
    <>
      <ul className="mt-3 grid gap-2 md:hidden">
        {ts.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => abrir({ tipo: "ticket", t })}
              aria-label={`${t.id}, ${t.asunto}, prioridad ${t.prioridad}, ${cumpleSla(t) ? "en SLA" : "fuera de SLA"}. Ver detalle`}
              className={cn("grid w-full cursor-pointer gap-1.5 rounded-xl border border-line p-3 text-left text-sm hover:bg-surface-2", FOCO)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{t.id}</span>
                <SlaChip t={t} />
              </span>
              <span className="text-ink">{t.asunto}</span>
              <span className="flex flex-wrap gap-x-3 gap-y-1 text-ink-2">
                <PrioridadTag p={t.prioridad} />
                <span>{t.agente}</span>
                <span>{diasAbierto(t)} d abierto</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
      <div className="mt-3 hidden max-h-[560px] overflow-auto rounded-xl border border-line md:block">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead className="sticky top-0 z-10 bg-surface-2 text-xs font-medium text-ink-2">
            <tr>
              <th scope="col" className="sticky left-0 bg-surface-2 px-3 py-2.5">Ticket</th>
              <th scope="col" className="px-3 py-2.5">Asunto</th>
              <th scope="col" className="px-3 py-2.5">Prioridad</th>
              <th scope="col" className="px-3 py-2.5">Agente</th>
              <th scope="col" className="px-3 py-2.5">Estado</th>
              <th scope="col" className="px-3 py-2.5 text-right">Abierto</th>
              <th scope="col" className="px-3 py-2.5">1.ª resp.</th>
            </tr>
          </thead>
          <tbody>
            {ts.map((t) => (
              <tr key={t.id} className="group border-t border-line hover:bg-surface-2">
                <th scope="row" className="sticky left-0 bg-surface p-0 font-semibold group-hover:bg-surface-2">
                  <button
                    type="button"
                    onClick={() => abrir({ tipo: "ticket", t })}
                    aria-label={`Ver detalle de ${t.id}`}
                    className={cn("min-h-11 w-full cursor-pointer px-3 text-left text-accent underline-offset-2 hover:underline", FOCO)}
                  >
                    {t.id}
                  </button>
                </th>
                <td className="px-3 py-2 text-ink">
                  {t.asunto}
                  <span className="block text-xs text-ink-2">{t.cliente}</span>
                </td>
                <td className="px-3 py-2"><PrioridadTag p={t.prioridad} /></td>
                <td className="px-3 py-2 text-ink">{t.agente}</td>
                <td className="px-3 py-2 text-ink-2">{cap(t.estado)}</td>
                <td className="px-3 py-2 text-right tabular-nums text-ink">{diasAbierto(t)} d</td>
                <td className="px-3 py-2"><SlaChip t={t} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- detalle -- */

function tituloDetalle(d: Detalle | null): { title: string; description?: string } {
  if (!d) return { title: "Detalle" };
  switch (d.tipo) {
    case "prioridad": return { title: `Abiertos · prioridad ${d.p}`, description: "Ordenados: fuera de SLA primero, luego antigüedad" };
    case "abiertos": return { title: "Todos los escalamientos abiertos", description: "Ordenados por riesgo" };
    case "sla": return { title: "Cumplimiento de SLA", description: "Primera respuesta dentro del SLA de su prioridad" };
    case "respuesta": return { title: "Primera respuesta", description: "Mediana en horas por prioridad" };
    case "resolucion": return { title: "Resolución", description: "Mediana en horas de tickets resueltos" };
    case "agente": return { title: d.agente, description: "Tickets asignados en el período" };
    case "ticket": return { title: `${d.t.id} · ${d.t.asunto}`, description: d.t.cliente };
    case "metodo": return { title: "Cómo se calcula", description: "Definiciones y calidad de los datos" };
  }
}

function ContenidoDetalle({ d, datos, filtro, abrir }: { d: Detalle; datos: Ticket[]; filtro: Filtro; abrir: (d: Detalle) => void }) {
  const ts = filtro === "todas" ? datos : datos.filter((t) => t.prioridad === filtro);
  switch (d.tipo) {
    case "prioridad":
      return <ListaCompacta ts={ts.filter((t) => estaAbierto(t) && t.prioridad === d.p).sort(porRiesgo)} abrir={abrir} />;
    case "abiertos":
      return <ListaCompacta ts={ts.filter(estaAbierto).sort(porRiesgo)} abrir={abrir} />;
    case "agente":
      return <ListaCompacta ts={ts.filter((t) => t.agente === d.agente).sort(porRiesgo)} abrir={abrir} />;
    case "sla":
    case "respuesta":
    case "resolucion":
      return <TablaPeriodos tipo={d.tipo} ts={ts} />;
    case "ticket":
      return <FichaTicket t={d.t} />;
    case "metodo":
      return <Metodo datos={datos} />;
  }
}

function ListaCompacta({ ts, abrir }: { ts: Ticket[]; abrir: (d: Detalle) => void }) {
  if (!ts.length) return <p className="text-sm text-ink-2">No hay tickets para mostrar con este filtro.</p>;
  return (
    <>
      <p className="mb-3 text-sm text-ink-2">{ts.length} tickets</p>
      <ul className="grid gap-2">
        {ts.map((t) => (
          <li key={t.id}>
            <button
              type="button"
              onClick={() => abrir({ tipo: "ticket", t })}
              className={cn("grid w-full cursor-pointer gap-1 rounded-xl border border-line p-3 text-left text-sm hover:bg-surface-2", FOCO)}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="font-semibold text-ink">{t.id} · {t.asunto}</span>
                <SlaChip t={t} />
              </span>
              <span className="flex flex-wrap gap-x-3 text-ink-2">
                <PrioridadTag p={t.prioridad} />
                <span>{cap(t.estado)}</span>
                <span>{t.agente}</span>
                <span>{diasAbierto(t)} d</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}

function TablaPeriodos({ tipo, ts }: { tipo: "sla" | "respuesta" | "resolucion"; ts: Ticket[] }) {
  const calc = (g: Ticket[]) =>
    tipo === "sla"
      ? pct(pctSla(g))
      : tipo === "respuesta"
        ? horas(mediana(g.map((t) => t.primeraRespuestaHoras)))
        : horas(mediana(g.map(resolucionValida).filter((h): h is number => h !== null)));
  const grupos = PRIORIDADES.map((p) => ({ p, g: ts.filter((t) => t.prioridad === p) })).filter((x) => x.g.length);
  return (
    <div className="grid gap-4">
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-ink-2">
          <tr>
            <th scope="col" className="py-2">Prioridad</th>
            <th scope="col" className="py-2 text-right">SLA</th>
            <th scope="col" className="py-2 text-right">Últimos 30 d</th>
            <th scope="col" className="py-2 text-right">30 d anteriores</th>
          </tr>
        </thead>
        <tbody>
          {grupos.map(({ p, g }) => (
            <tr key={p} className="border-t border-line">
              <th scope="row" className="py-2.5 text-left font-medium"><PrioridadTag p={p} /></th>
              <td className="py-2.5 text-right tabular-nums text-ink-2">{g[0].slaHoras} h</td>
              <td className="py-2.5 text-right tabular-nums text-ink">{calc(ventana(g, 0, 30))}</td>
              <td className="py-2.5 text-right tabular-nums text-ink-2">{calc(ventana(g, 30, 60))}</td>
            </tr>
          ))}
          <tr className="border-t-2 border-line font-semibold">
            <th scope="row" className="py-2.5 text-left">Total</th>
            <td />
            <td className="py-2.5 text-right tabular-nums">{calc(ventana(ts, 0, 30))}</td>
            <td className="py-2.5 text-right tabular-nums">{calc(ventana(ts, 30, 60))}</td>
          </tr>
        </tbody>
      </table>
      {tipo === "sla" && (
        <div>
          <h3 className="text-sm font-semibold text-ink">Por semana de apertura</h3>
          <table className="mt-2 w-full text-sm">
            <thead className="text-left text-xs text-ink-2">
              <tr>
                <th scope="col" className="py-1.5">Semana desde</th>
                <th scope="col" className="py-1.5 text-right">Tickets</th>
                <th scope="col" className="py-1.5 text-right">Cumplimiento</th>
              </tr>
            </thead>
            <tbody>
              {slaSemanal(ts).map((s) => (
                <tr key={s.semana} className="border-t border-line">
                  <td className="py-1.5 text-ink">{fecha(s.semana)}</td>
                  <td className="py-1.5 text-right tabular-nums text-ink-2">{s.n}</td>
                  <td className="py-1.5 text-right tabular-nums text-ink">{Math.round(s.pct)} %</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FichaTicket({ t }: { t: Ticket }) {
  const res = resolucionValida(t);
  const filas: [string, React.ReactNode][] = [
    ["Prioridad", <PrioridadTag p={t.prioridad} />],
    ["Estado", cap(t.estado)],
    ["Agente", t.agente],
    ["Abierto", `${fecha(t.abierto)} (${diasAbierto(t)} d al corte)`],
    ["Primera respuesta", `${horas(t.primeraRespuestaHoras)} de ${t.slaHoras} h de SLA`],
    ["SLA", <SlaChip t={t} />],
    ["Resolución", t.estado === "resuelto" ? (res === null ? "Sin dato en el sistema" : horas(res)) : "Pendiente"],
  ];
  return (
    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
      {filas.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-ink-2">{k}</dt>
          <dd className="text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function Metodo({ datos }: { datos: Ticket[] }) {
  const resueltosSinDato = datos.filter((t) => t.estado === "resuelto" && t.resolucionHoras === null).length;
  const abiertosConDato = datos.filter((t) => estaAbierto(t) && t.resolucionHoras !== null).length;
  return (
    <div className="grid gap-4 text-sm leading-relaxed text-ink">
      <section>
        <h3 className="font-semibold">Escalamiento abierto</h3>
        <p className="text-ink-2">Todo ticket que no está «resuelto»: abierto, en curso o esperando cliente.</p>
      </section>
      <section>
        <h3 className="font-semibold">Cumplimiento de SLA</h3>
        <p className="text-ink-2">
          Un ticket cumple si su primera respuesta llegó dentro de las horas de SLA de su prioridad (crítica 4 h, alta 8 h, media 24 h, baja 48 h). El
          porcentaje es sobre los tickets abiertos en la ventana, resueltos o no.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Ventanas de 30 días</h3>
        <p className="text-ink-2">
          Se cuentan hacia atrás desde la fecha de corte ({fecha(CORTE)}), que es el último día con tickets en los datos. La comparación es contra los 30
          días anteriores.
        </p>
      </section>
      <section>
        <h3 className="font-semibold">Medianas</h3>
        <p className="text-ink-2">Se usa la mediana y no el promedio porque unos pocos tickets muy lentos moverían el promedio.</p>
      </section>
      <section className="rounded-xl border border-line bg-surface-2 p-3">
        <h3 className="flex items-center gap-1.5 font-semibold">
          <AlertTriangle className="size-4 text-bad" aria-hidden /> Calidad de los datos
        </h3>
        <ul className="mt-1 list-disc pl-5 text-ink-2">
          <li>{resueltosSinDato} tickets resueltos no traen horas de resolución: quedan fuera de la mediana de resolución.</li>
          <li>{abiertosConDato} tickets no resueltos sí traen horas de resolución: el dato se ignora porque el ticket sigue abierto.</li>
        </ul>
      </section>
    </div>
  );
}

/* ----------------------------------------------------------------- estados -- */

function Estado({ icono, titulo, texto, accion }: { icono: React.ReactNode; titulo: string; texto: string; accion?: React.ReactNode }) {
  return (
    <div role="status" className="mx-auto grid max-w-md justify-items-center gap-3 rounded-2xl border border-line bg-surface px-6 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-surface-2">{icono}</span>
      <h2 className="text-lg font-semibold text-ink">{titulo}</h2>
      <p className="text-sm text-ink-2">{texto}</p>
      {accion}
    </div>
  );
}

function Esqueleto() {
  const b = "animate-pulse rounded-2xl bg-surface-2";
  return (
    <div className="grid gap-6" aria-busy="true" aria-label="Cargando tickets">
      <span className="sr-only">Cargando tickets…</span>
      <div className={cn(b, "h-12 w-full max-w-md")} />
      <div className="grid gap-3 md:grid-cols-3">
        <div className={cn(b, "h-72 md:col-span-2 lg:row-span-2")} />
        <div className={cn(b, "h-32")} />
        <div className={cn(b, "h-32")} />
        <div className={cn(b, "h-32")} />
      </div>
      <div className="grid gap-6 lg:grid-cols-5">
        <div className={cn(b, "h-80 lg:col-span-2")} />
        <div className={cn(b, "h-80 lg:col-span-3")} />
      </div>
    </div>
  );
}
