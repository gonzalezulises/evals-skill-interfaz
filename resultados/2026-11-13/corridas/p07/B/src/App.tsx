import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronRight } from "lucide-react";
import {
  TODOS,
  cumpleSla,
  estaAbierto,
  fechaCorte,
  fmtFecha,
  fmtHoras,
  fmtNum,
  fmtPct,
  mediana,
  pct,
  resumenPorAgente,
  resumenPorPrioridad,
  type FilaAgente,
  type Ticket,
} from "@/lib/escalamientos";
import { TicketDrawer } from "@/components/TicketDrawer";
import { PrioridadPill, colorPrioridad } from "@/components/PrioridadPill";
import { cn } from "@/lib/utils";

type Detalle = { titulo: string; subtitulo: string; tickets: Ticket[] } | null;

const ORDEN_PRIORIDAD: Record<string, number> = { crítica: 0, alta: 1, media: 2, baja: 3 };
const porUrgencia = (a: Ticket, b: Ticket) =>
  ORDEN_PRIORIDAD[a.prioridad] - ORDEN_PRIORIDAD[b.prioridad] || a.abierto.localeCompare(b.abierto);
const fueraPrimero = (a: Ticket, b: Ticket) =>
  Number(cumpleSla(a)) - Number(cumpleSla(b)) || b.primeraRespuestaHoras - a.primeraRespuestaHoras;

const foco =
  "cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

export default function App() {
  const [detalle, setDetalle] = useState<Detalle>(null);
  const prioridades = useMemo(resumenPorPrioridad, []);
  const agentes = useMemo(resumenPorAgente, []);

  const abiertos = TODOS.filter(estaAbierto);
  const criticosAbiertos = abiertos.filter((t) => t.prioridad === "crítica");
  const cumplen = TODOS.filter(cumpleSla).length;
  const maxAbiertos = Math.max(...prioridades.map((p) => p.abiertos), 1);

  const abrir = (titulo: string, subtitulo: string, tickets: Ticket[]) =>
    setDetalle({ titulo, subtitulo, tickets });

  return (
    <div className="min-h-dvh">
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted">Andes Logística · Soporte</p>
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Escalamientos de soporte</h1>
          </div>
          <p className="text-sm text-muted">
            Datos al <time dateTime={fechaCorte}>{fmtFecha(fechaCorte)}</time> · {fmtNum(TODOS.length)} tickets
          </p>
        </header>

        {/* Cifras primarias */}
        <section aria-label="Resumen" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            etiqueta="Tickets abiertos"
            valor={fmtNum(abiertos.length)}
            nota="sin resolver"
            onClick={() =>
              abrir("Tickets abiertos", `${abiertos.length} sin resolver, por urgencia`, [...abiertos].sort(porUrgencia))
            }
          />
          <Kpi
            etiqueta="Críticos abiertos"
            valor={fmtNum(criticosAbiertos.length)}
            nota="objetivo 4 h"
            tono="bad"
            onClick={() =>
              abrir("Críticos abiertos", `${criticosAbiertos.length} tickets, el más antiguo primero`, [...criticosAbiertos].sort(porUrgencia))
            }
          />
          <Kpi
            etiqueta="Cumplimiento del SLA"
            valor={fmtPct(pct(cumplen, TODOS.length))}
            nota={`${fmtNum(cumplen)} de ${fmtNum(TODOS.length)}`}
            onClick={() => {
              const fuera = TODOS.filter((t) => !cumpleSla(t)).sort(fueraPrimero);
              abrir("Fuera de SLA", `${fuera.length} tickets con la 1.ª respuesta tarde`, fuera);
            }}
          />
          <Kpi
            etiqueta="Mediana 1.ª respuesta"
            valor={fmtHoras(mediana(TODOS.map((t) => t.primeraRespuestaHoras)))}
            nota="todos los tickets"
          />
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {/* Abiertos por prioridad */}
          <Card titulo="Abiertos por prioridad" id="abiertos">
            <ul className="space-y-1">
              {prioridades.map((p) => (
                <li key={p.prioridad}>
                  <button
                    type="button"
                    className={cn(foco, "group grid w-full grid-cols-[6.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2.5 text-left hover:bg-subtle")}
                    aria-label={`Ver ${p.abiertos} tickets abiertos de prioridad ${p.prioridad}`}
                    onClick={() =>
                      abrir(
                        `Abiertos · ${p.prioridad}`,
                        `${p.abiertos} tickets, el más antiguo primero`,
                        TODOS.filter((t) => t.prioridad === p.prioridad && estaAbierto(t)).sort(porUrgencia),
                      )
                    }
                  >
                    <PrioridadPill prioridad={p.prioridad} />
                    <span className="h-3 overflow-hidden rounded-full bg-subtle" aria-hidden>
                      <span
                        className={cn("block h-full rounded-full", colorPrioridad(p.prioridad))}
                        style={{ width: `${(p.abiertos / maxAbiertos) * 100}%` }}
                      />
                    </span>
                    <span className="tabular flex items-center gap-1 text-right font-semibold">
                      {fmtNum(p.abiertos)}
                      <ChevronRight className="size-4 text-muted group-hover:text-ink" aria-hidden />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>

          {/* SLA por prioridad */}
          <Card titulo="Cumplimiento del SLA por prioridad" id="sla" leyenda="1.ª respuesta dentro del objetivo">
            <ul className="space-y-1">
              {prioridades.map((p) => {
                const v = pct(p.cumplen, p.total);
                return (
                  <li key={p.prioridad}>
                    <button
                      type="button"
                      className={cn(foco, "group grid w-full grid-cols-[6.5rem_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-subtle")}
                      aria-label={`Ver tickets de prioridad ${p.prioridad}: ${fmtPct(v)} en SLA`}
                      onClick={() =>
                        abrir(
                          `SLA · ${p.prioridad}`,
                          `Objetivo ${p.slaHoras} h · ${p.cumplen} de ${p.total} en SLA · fuera de SLA primero`,
                          TODOS.filter((t) => t.prioridad === p.prioridad).sort(fueraPrimero),
                        )
                      }
                    >
                      <span>
                        <PrioridadPill prioridad={p.prioridad} />
                        <span className="tabular block pl-4 text-xs text-muted">≤ {p.slaHoras} h</span>
                      </span>
                      <span className="h-3 overflow-hidden rounded-full bg-bad-soft" aria-hidden>
                        <span className="block h-full rounded-full bg-ok" style={{ width: `${v ?? 0}%` }} />
                      </span>
                      <span className="tabular flex items-center gap-1 text-right">
                        <span>
                          <span className="block font-semibold">{fmtPct(v)}</span>
                          <span className="block text-xs text-muted">{p.cumplen}/{p.total}</span>
                        </span>
                        <ChevronRight className="size-4 text-muted group-hover:text-ink" aria-hidden />
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>

        <TablaAgentes
          filas={agentes}
          onVer={(f) =>
            abrir(
              f.agente,
              `${f.total} tickets · ${fmtPct(f.cumplimiento)} en SLA · fuera de SLA primero`,
              TODOS.filter((t) => t.agente === f.agente).sort(fueraPrimero),
            )
          }
        />

        <footer className="mt-6 text-xs text-muted">
          Fuente: tickets.json · {fmtNum(TODOS.length)} tickets creados entre el {fmtFecha(TODOS.reduce((m, t) => (t.abierto < m ? t.abierto : m), fechaCorte))} y el {fmtFecha(fechaCorte)}. SLA: horas hasta la 1.ª respuesta frente al objetivo de cada prioridad.
        </footer>
      </main>

      <TicketDrawer
        titulo={detalle?.titulo ?? null}
        subtitulo={detalle?.subtitulo}
        tickets={detalle?.tickets ?? []}
        onClose={() => setDetalle(null)}
      />
    </div>
  );
}

function Kpi({
  etiqueta,
  valor,
  nota,
  tono,
  onClick,
}: {
  etiqueta: string;
  valor: string;
  nota: string;
  tono?: "bad";
  onClick?: () => void;
}) {
  const cuerpo = (
    <>
      <span className="flex items-center justify-between text-sm text-muted">
        {etiqueta}
        {onClick && <ChevronRight className="size-4" aria-hidden />}
      </span>
      <span className={cn("tabular mt-1 block text-2xl font-semibold sm:text-3xl", tono === "bad" && "text-bad")}>
        {valor}
      </span>
      <span className="mt-0.5 block text-xs text-muted">{nota}</span>
    </>
  );
  const base = "block w-full rounded-xl border border-line bg-surface p-4 text-left";
  return onClick ? (
    <button type="button" onClick={onClick} aria-label={`${etiqueta}: ${valor}. Ver detalle`} className={cn(base, foco, "hover:border-muted")}>
      {cuerpo}
    </button>
  ) : (
    <div className={base}>{cuerpo}</div>
  );
}

function Card({ titulo, id, leyenda, children }: { titulo: string; id: string; leyenda?: string; children: React.ReactNode }) {
  return (
    <section aria-labelledby={`t-${id}`} className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={`t-${id}`} className="font-semibold">{titulo}</h2>
        {leyenda && <p className="text-xs text-muted">{leyenda}</p>}
      </div>
      {children}
    </section>
  );
}

type Clave = keyof FilaAgente;
const COLUMNAS: { clave: Clave; etiqueta: string; num: boolean }[] = [
  { clave: "agente", etiqueta: "Agente", num: false },
  { clave: "total", etiqueta: "Tickets", num: true },
  { clave: "abiertos", etiqueta: "Abiertos", num: true },
  { clave: "medianaRespuesta", etiqueta: "Mediana 1.ª resp.", num: true },
  { clave: "cumplimiento", etiqueta: "En SLA", num: true },
  { clave: "fueraSla", etiqueta: "Fuera de SLA", num: true },
];

function TablaAgentes({ filas, onVer }: { filas: FilaAgente[]; onVer: (f: FilaAgente) => void }) {
  const [orden, setOrden] = useState<{ clave: Clave; asc: boolean }>({ clave: "medianaRespuesta", asc: true });
  const ordenadas = useMemo(() => {
    const r = [...filas].sort((a, b) => {
      const x = a[orden.clave] ?? -1;
      const y = b[orden.clave] ?? -1;
      return typeof x === "string" ? x.localeCompare(String(y)) : (x as number) - (y as number);
    });
    return orden.asc ? r : r.reverse();
  }, [filas, orden]);

  const celda = (f: FilaAgente, c: Clave) =>
    c === "medianaRespuesta"
      ? fmtHoras(f.medianaRespuesta)
      : c === "cumplimiento"
        ? fmtPct(f.cumplimiento)
        : c === "agente"
          ? f.agente
          : fmtNum(f[c] as number);

  return (
    <section aria-labelledby="t-agentes" className="mt-4 rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 px-4 pt-4 sm:px-5">
        <h2 id="t-agentes" className="font-semibold">Tiempos de respuesta por agente</h2>
        <p className="text-xs text-muted">Pulsa un agente para ver sus tickets</p>
      </div>

      {/* Móvil: tarjetas */}
      <div className="px-4 pt-3 pb-4 sm:hidden">
        <label className="flex items-center justify-between gap-2 text-sm text-muted">
          Ordenar por
          <select
            className="min-h-11 cursor-pointer rounded-lg border border-line bg-surface px-2 py-2 text-ink focus-visible:outline-2 focus-visible:outline-accent"
            value={`${orden.clave}:${orden.asc ? "asc" : "desc"}`}
            onChange={(e) => {
              const [clave, dir] = e.target.value.split(":");
              setOrden({ clave: clave as Clave, asc: dir === "asc" });
            }}
          >
            <option value="medianaRespuesta:asc">Respuesta más rápida</option>
            <option value="medianaRespuesta:desc">Respuesta más lenta</option>
            <option value="cumplimiento:desc">Más en SLA</option>
            <option value="cumplimiento:asc">Menos en SLA</option>
            <option value="abiertos:desc">Más abiertos</option>
            <option value="agente:asc">Nombre</option>
          </select>
        </label>
        <ul className="mt-3 space-y-2">
          {ordenadas.map((f) => (
            <li key={f.agente}>
              <button
                type="button"
                onClick={() => onVer(f)}
                aria-label={`Ver tickets de ${f.agente}`}
                className={cn(foco, "w-full rounded-lg border border-line p-3 text-left hover:bg-subtle")}
              >
                <span className="flex items-center justify-between font-medium">
                  {f.agente}
                  <ChevronRight className="size-4 text-muted" aria-hidden />
                </span>
                <span className="tabular mt-2 grid grid-cols-3 gap-2 text-sm">
                  <Dato etiqueta="Mediana" valor={fmtHoras(f.medianaRespuesta)} />
                  <Dato etiqueta="En SLA" valor={fmtPct(f.cumplimiento)} />
                  <Dato etiqueta="Abiertos" valor={`${f.abiertos}/${f.total}`} />
                </span>
                <BarraSla valor={f.cumplimiento} className="mt-2" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Tablet y escritorio: tabla */}
      <div className="hidden overflow-x-auto px-2 pt-2 pb-3 sm:block">
        <table className="tabular w-full text-sm">
          <thead>
            <tr className="border-b border-line text-muted">
              {COLUMNAS.map((c) => (
                <th
                  key={c.clave}
                  scope="col"
                  aria-sort={orden.clave === c.clave ? (orden.asc ? "ascending" : "descending") : "none"}
                  className={cn("px-3 py-2 font-medium", c.num ? "text-right" : "text-left")}
                >
                  <button
                    type="button"
                    className={cn(foco, "inline-flex items-center gap-1 rounded hover:text-ink", orden.clave === c.clave && "text-ink")}
                    onClick={() =>
                      setOrden((o) => ({ clave: c.clave, asc: o.clave === c.clave ? !o.asc : !c.num || c.clave === "medianaRespuesta" }))
                    }
                  >
                    {c.etiqueta}
                    {orden.clave === c.clave &&
                      (orden.asc ? <ArrowUp className="size-3.5" aria-hidden /> : <ArrowDown className="size-3.5" aria-hidden />)}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ordenadas.map((f) => (
              <tr key={f.agente} className="border-b border-line last:border-0 hover:bg-subtle">
                {COLUMNAS.map((c) => (
                  <td key={c.clave} className={cn("px-3 py-2.5", c.num ? "text-right" : "text-left")}>
                    {c.clave === "agente" ? (
                      <button
                        type="button"
                        onClick={() => onVer(f)}
                        aria-label={`Ver tickets de ${f.agente}`}
                        className={cn(foco, "inline-flex items-center gap-1 rounded font-medium hover:text-accent")}
                      >
                        {f.agente}
                        <ChevronRight className="size-4 text-muted" aria-hidden />
                      </button>
                    ) : c.clave === "cumplimiento" ? (
                      <span className="inline-flex items-center justify-end gap-2">
                        <BarraSla valor={f.cumplimiento} className="hidden w-20 md:block" />
                        {celda(f, c.clave)}
                      </span>
                    ) : (
                      celda(f, c.clave)
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <span>
      <span className="block text-xs text-muted">{etiqueta}</span>
      <span className="block font-semibold">{valor}</span>
    </span>
  );
}

function BarraSla({ valor, className }: { valor: number | null; className?: string }) {
  return (
    <span className={cn("block h-1.5 overflow-hidden rounded-full bg-bad-soft", className)} aria-hidden>
      <span className="block h-full rounded-full bg-ok" style={{ width: `${valor ?? 0}%` }} />
    </span>
  );
}
