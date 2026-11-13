import { useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Minus, MessageSquareText, TriangleAlert } from "lucide-react";
import clima from "@/data/clima.json";
import { cn } from "@/lib/utils";

/* ---------- Datos derivados ---------- */

const UMBRAL_BASE_BAJA = 20; // celdas con menos respuestas se leen con cautela
const fmt = (n: number, d = 2) => n.toLocaleString("es", { minimumFractionDigits: d, maximumFractionDigits: d });
const fmtPct = (n: number) => `${n.toLocaleString("es", { maximumFractionDigits: 1 })} %`;
const signo = (n: number, d = 2) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${fmt(Math.abs(n), d)}`;

const { respuestas, invitados, enps, dimensiones, porArea, comentarios } = clima;
const enpsValor = Math.round(((enps.promotores - enps.detractores) / respuestas) * 100);
const participacion = (respuestas / invitados) * 100;
const promedioActual = dimensiones.reduce((s, d) => s + d.puntaje, 0) / dimensiones.length;
const promedioAnterior = dimensiones.reduce((s, d) => s + d.anterior, 0) / dimensiones.length;

const dimsOrdenadas = [...dimensiones]
  .map((d) => ({ ...d, delta: d.puntaje - d.anterior }))
  .sort((a, b) => a.delta - b.delta);
const mayorCaida = dimsOrdenadas[0];
const nombresDim = dimensiones.map((d) => d.dimension);
const areas = [...new Set(porArea.map((a) => a.area))];
const celda = (area: string, dim: string) => porArea.find((a) => a.area === area && a.dimension === dim)!;

/* ---------- Piezas ---------- */

function Delta({ valor, className }: { valor: number; className?: string }) {
  const Icono = valor > 0.005 ? ArrowUpRight : valor < -0.005 ? ArrowDownRight : Minus;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-xs font-semibold tabular-nums",
        valor > 0.005 ? "bg-emerald-50 text-emerald-800" : valor < -0.005 ? "bg-rose-50 text-rose-800" : "bg-slate-100 text-slate-700",
        className,
      )}
    >
      <Icono aria-hidden className="size-3.5" />
      {signo(valor)}
    </span>
  );
}

function Tarjeta({ titulo, children, className, id }: { titulo: string; children: React.ReactNode; className?: string; id?: string }) {
  return (
    <section aria-labelledby={id} className={cn("rounded-xl border border-slate-200 bg-white p-4 sm:p-5", className)}>
      <h2 id={id} className="text-sm font-semibold text-slate-900">
        {titulo}
      </h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function tono(p: number) {
  if (p < 3) return "bg-rose-100 text-rose-900";
  if (p < 3.5) return "bg-amber-50 text-amber-900";
  if (p < 4) return "bg-slate-50 text-slate-800";
  return "bg-emerald-100 text-emerald-900";
}

/* ---------- Secciones ---------- */

function Kpis() {
  const total = respuestas;
  const seg = [
    { k: "Detractores", v: enps.detractores, c: "bg-rose-500" },
    { k: "Pasivos", v: enps.pasivos, c: "bg-slate-300" },
    { k: "Promotores", v: enps.promotores, c: "bg-emerald-600" },
  ];
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div className="rounded-xl border border-slate-200 bg-white p-4 sm:col-span-2 lg:col-span-2">
        <p className="text-sm text-slate-600">eNPS</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">
          {enpsValor > 0 ? "+" : ""}
          {enpsValor}
        </p>
        <div className="mt-3 flex h-2.5 overflow-hidden rounded-full" role="img" aria-label={seg.map((s) => `${s.k}: ${s.v}`).join(", ")}>
          {seg.map((s) => (
            <div key={s.k} className={s.c} style={{ width: `${(s.v / total) * 100}%` }} />
          ))}
        </div>
        <dl className="mt-2 grid grid-cols-3 gap-2 text-xs">
          {seg.map((s) => (
            <div key={s.k}>
              <dt className="flex items-center gap-1.5 text-slate-600">
                <span aria-hidden className={cn("size-2 rounded-full", s.c)} />
                {s.k}
              </dt>
              <dd className="font-medium text-slate-900 tabular-nums">
                {s.v} · {fmtPct((s.v / total) * 100)}
              </dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Puntaje promedio</p>
        <p className="mt-1 flex items-baseline gap-2">
          <span className="text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">{fmt(promedioActual)}</span>
          <span className="text-sm text-slate-500">/ 5</span>
        </p>
        <p className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-slate-600">
          <Delta valor={promedioActual - promedioAnterior} /> vs. {fmt(promedioAnterior)} anterior
        </p>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Participación</p>
        <p className="mt-1 text-4xl font-semibold tracking-tight text-slate-900 tabular-nums">{fmtPct(participacion)}</p>
        <p className="mt-2 text-xs text-slate-600 tabular-nums">
          {respuestas} de {invitados} invitados
        </p>
      </div>
    </div>
  );
}

function Dimensiones() {
  const min = 2.5;
  const max = 4.5;
  const x = (v: number) => `${((v - min) / (max - min)) * 100}%`;
  return (
    <Tarjeta titulo="Puntaje por dimensión vs. medición anterior" id="t-dim" className="min-w-0 lg:col-span-3">
      <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full border-2 border-slate-400 bg-white" /> Anterior
        </span>
        <span className="flex items-center gap-1.5">
          <span aria-hidden className="size-2.5 rounded-full bg-slate-900" /> Actual
        </span>
        <span>Escala 1–5 · ordenado de mayor caída a mayor mejora</span>
      </div>
      <ul className="divide-y divide-slate-100">
        {dimsOrdenadas.map((d) => {
          const lo = Math.min(d.puntaje, d.anterior);
          const hi = Math.max(d.puntaje, d.anterior);
          const sube = d.delta > 0;
          return (
            <li key={d.dimension} className="grid grid-cols-[7.5rem_1fr_auto] items-center gap-3 py-2.5 sm:grid-cols-[9rem_1fr_11rem]">
              <span className="truncate text-sm text-slate-800" title={d.dimension}>
                {d.dimension}
              </span>
              <div className="relative h-5" aria-hidden>
                <div className="absolute inset-x-0 top-1/2 h-px bg-slate-200" />
                <div
                  className={cn("absolute top-1/2 h-1 -translate-y-1/2 rounded-full", sube ? "bg-emerald-300" : "bg-rose-300")}
                  style={{ left: x(lo), width: `calc(${x(hi)} - ${x(lo)})` }}
                />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-slate-400 bg-white" style={{ left: x(d.anterior) }} />
                <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-slate-900" style={{ left: x(d.puntaje) }} />
              </div>
              <span className="flex items-center justify-end gap-2 whitespace-nowrap text-sm tabular-nums">
                <span className="hidden text-slate-500 sm:inline">{fmt(d.anterior)} →</span>
                <span className="font-semibold text-slate-900">{fmt(d.puntaje)}</span>
                <Delta valor={d.delta} />
              </span>
              <span className="sr-only">
                {d.dimension}: {fmt(d.puntaje)} actual, {fmt(d.anterior)} anterior, cambio {signo(d.delta)}
              </span>
            </li>
          );
        })}
      </ul>
      <div className="mt-1 grid grid-cols-[7.5rem_1fr_auto] gap-3 text-[11px] text-slate-500 sm:grid-cols-[9rem_1fr_11rem]" aria-hidden>
        <span />
        <div className="flex justify-between tabular-nums">
          <span>{fmt(min, 1)}</span>
          <span>{fmt((min + max) / 2, 1)}</span>
          <span>{fmt(max, 1)}</span>
        </div>
        <span />
      </div>
    </Tarjeta>
  );
}

function Leyenda() {
  const items = [
    { t: "< 3,0", c: "bg-rose-100" },
    { t: "3,0–3,49", c: "bg-amber-50 border border-amber-200" },
    { t: "3,5–3,99", c: "bg-slate-50 border border-slate-200" },
    { t: "≥ 4,0", c: "bg-emerald-100" },
  ];
  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600">
      {items.map((i) => (
        <span key={i.t} className="flex items-center gap-1.5">
          <span aria-hidden className={cn("size-3 rounded-sm", i.c)} />
          {i.t}
        </span>
      ))}
      <span className="flex items-center gap-1">
        <TriangleAlert aria-hidden className="size-3.5 text-amber-600" /> menos de {UMBRAL_BASE_BAJA} respuestas
      </span>
    </div>
  );
}

function PorArea() {
  const [area, setArea] = useState(areas[0]);
  return (
    <Tarjeta titulo="Resultados por área" id="t-area">
      <Leyenda />
      {/* Escritorio: matriz área × dimensión */}
      <div className="hidden overflow-x-auto lg:block">
        <table className="w-full table-fixed border-separate border-spacing-1 text-sm">
          <caption className="sr-only">Puntaje promedio por área y dimensión, escala 1 a 5, con número de respuestas</caption>
          <thead>
            <tr>
              <th scope="col" className="w-28 px-2 py-1 text-left text-xs font-medium text-slate-600">
                Área
              </th>
              {nombresDim.map((d) => (
                <th key={d} scope="col" className="px-0.5 py-1 text-center align-bottom text-xs leading-tight font-medium text-slate-600">
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {areas.map((a) => (
              <tr key={a}>
                <th scope="row" className="px-2 py-1 text-left font-medium text-slate-900">
                  {a}
                </th>
                {nombresDim.map((d) => {
                  const c = celda(a, d);
                  const baja = c.n < UMBRAL_BASE_BAJA;
                  return (
                    <td key={d} className={cn("rounded-md px-1 py-2 text-center tabular-nums", tono(c.puntaje))} title={`${a} · ${d}: ${fmt(c.puntaje)} (n = ${c.n})`}>
                      <span className="font-semibold">{fmt(c.puntaje)}</span>
                      <span className="mt-0.5 flex items-center justify-center gap-0.5 text-[11px] opacity-75">
                        {baja && <TriangleAlert aria-label="base baja" className="size-3 text-amber-700" />}n={c.n}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Móvil y tableta: un área a la vez */}
      <div className="lg:hidden">
        <label htmlFor="sel-area" className="text-xs font-medium text-slate-600">
          Área
        </label>
        <select
          id="sel-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="mt-1 block h-11 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {areas.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
          {nombresDim.map((d) => {
            const c = celda(area, d);
            return (
              <li key={d} className={cn("flex items-center justify-between rounded-md px-3 py-2 text-sm", tono(c.puntaje))}>
                <span>{d}</span>
                <span className="flex items-center gap-2 tabular-nums">
                  <span className="flex items-center gap-0.5 text-xs opacity-75">
                    {c.n < UMBRAL_BASE_BAJA && <TriangleAlert aria-label="base baja" className="size-3 text-amber-700" />}n={c.n}
                  </span>
                  <span className="font-semibold">{fmt(c.puntaje)}</span>
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </Tarjeta>
  );
}

function Comentarios() {
  const [area, setArea] = useState("Todas");
  const grupos = useMemo(() => {
    const filtrados = area === "Todas" ? comentarios : comentarios.filter((c) => c.area === area);
    const m = new Map<string, { texto: string; total: number; areas: Set<string>; temas: Set<string> }>();
    for (const c of filtrados) {
      const g = m.get(c.texto) ?? { texto: c.texto, total: 0, areas: new Set(), temas: new Set() };
      g.total++;
      g.areas.add(c.area);
      g.temas.add(c.tema);
      m.set(c.texto, g);
    }
    return { n: filtrados.length, lista: [...m.values()].sort((a, b) => b.total - a.total) };
  }, [area]);
  const opciones = ["Todas", ...areas];
  return (
    <Tarjeta titulo="Comentarios" id="t-com">
      <div role="group" aria-label="Filtrar comentarios por área" className="flex flex-wrap gap-1.5">
        {opciones.map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={area === o}
            onClick={() => setArea(o)}
            className={cn(
              "min-h-9 shrink-0 cursor-pointer rounded-full border px-3 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900",
              area === o ? "border-slate-900 bg-slate-900 text-white" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
            )}
          >
            {o}
          </button>
        ))}
      </div>
      <p className="mt-3 text-xs text-slate-600" aria-live="polite">
        {grupos.n} comentarios · {grupos.lista.length} distintos
      </p>
      {grupos.lista.length === 0 ? (
        <p className="mt-3 rounded-lg border border-dashed border-slate-300 p-6 text-center text-sm text-slate-600">Sin comentarios para esta área.</p>
      ) : (
        <ul className="mt-2 divide-y divide-slate-100">
          {grupos.lista.map((g) => (
            <li key={g.texto} className="flex gap-3 py-3">
              <MessageSquareText aria-hidden className="mt-0.5 size-4 shrink-0 text-slate-400" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-slate-900">«{g.texto.replace(/\.$/, "")}»</p>
                <p className="mt-1 text-xs text-slate-600">
                  {[...g.areas].join(", ")} · temas: {[...g.temas].join(", ")}
                </p>
              </div>
              <span className="shrink-0 self-start rounded-md bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-800 tabular-nums" title="Veces mencionado">
                ×{g.total}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Tarjeta>
  );
}

export default function App() {
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
          <p className="text-xs font-medium tracking-wide text-slate-500 uppercase">Andes Logística · Recursos Humanos</p>
          <h1 className="mt-0.5 text-xl font-semibold sm:text-2xl">Encuesta de clima: resultados</h1>
        </div>
      </header>
      <main className="mx-auto max-w-6xl space-y-4 px-4 py-5 sm:px-6">
        <Kpis />
        <p className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
          <ArrowDownRight aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Mayor caída: <strong>{mayorCaida.dimension}</strong>, de {fmt(mayorCaida.anterior)} a {fmt(mayorCaida.puntaje)} ({signo(mayorCaida.delta)}).
          </span>
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
          <Dimensiones />
          <div className="min-w-0 lg:col-span-2">
            <Comentarios />
          </div>
        </div>
        <PorArea />
      </main>
    </div>
  );
}
