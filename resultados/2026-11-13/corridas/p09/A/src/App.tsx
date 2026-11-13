import * as React from "react";
import { AlertTriangle, ChevronRight, MessageSquareText } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BANDAS,
  banda,
  calcEnps,
  cargarClima,
  f0,
  f1,
  f2,
  fSigned,
  media,
  type Clima,
} from "@/lib/clima";
import { Card, Delta, Drawer, EmptyState, KpiCard, Segmented } from "@/components/ui";

type Detalle = { tipo: "dim"; nombre: string } | { tipo: "area"; nombre: string } | null;

export default function App() {
  const carga = React.useMemo(() => cargarClima(), []);
  return (
    <div className="min-h-screen">
      <main className="mx-auto grid w-full max-w-[1240px] gap-4 px-4 py-6 sm:px-6 sm:py-8">
        <header className="grid gap-1">
          <p className="text-[13px] font-medium text-ink-2">Andes Logística · Recursos Humanos</p>
          <h1 className="text-[22px] font-semibold tracking-[-0.02em] sm:text-[26px]">Encuesta de clima organizacional</h1>
        </header>
        {carga.estado === "error" && (
          <div role="alert" className="flex gap-3 rounded-2xl bg-surface p-5 ring-1 ring-line">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-bad" aria-hidden />
            <div className="grid gap-1">
              <p className="font-medium">No se pudieron leer los resultados de la encuesta</p>
              <p className="text-[14px] text-ink-2">{carga.motivo} Revisa el archivo de resultados exportado y vuelve a cargar la página.</p>
            </div>
          </div>
        )}
        {carga.estado === "vacio" && (
          <EmptyState title="La encuesta todavía no tiene respuestas">
            Cuando llegue la primera respuesta aparecerán aquí el eNPS, las dimensiones y los comentarios.
          </EmptyState>
        )}
        {carga.estado === "ok" && <Tablero datos={carga.datos} />}
      </main>
    </div>
  );
}

function Tablero({ datos }: { datos: Clima }) {
  const [detalle, setDetalle] = React.useState<Detalle>(null);
  const cerrar = React.useCallback(() => setDetalle(null), []);
  const enps = calcEnps(datos.enps);
  const participacion = datos.invitados ? (datos.respuestas / datos.invitados) * 100 : 0;
  const promAct = media(datos.dimensiones.map((d) => d.puntaje));
  const promAnt = media(datos.dimensiones.map((d) => d.anterior));
  const caida = [...datos.dimensiones].sort((a, b) => a.puntaje - a.anterior - (b.puntaje - b.anterior))[0];

  return (
    <>
      <p className="-mt-2 text-[13px] text-ink-2">
        {f0(datos.respuestas)} respuestas de {f0(datos.invitados)} invitados · puntajes en escala de 1 a 5 · comparación con la medición anterior
      </p>

      {/* Fila 1: eNPS protagonista + tres cifras de apoyo */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Card id="enps" title="eNPS" subtitle="¿Recomendarías Andes como lugar para trabajar?" className="lg:col-span-5">
          <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
            <p className="text-[56px] leading-none font-semibold tracking-[-0.03em] tabular-nums">{fSigned(enps.valor)}</p>
            <p className="pb-1 text-[13px] text-ink-2">
              % promotores − % detractores
              <br />
              rango −100 a +100 · {f0(enps.total)} respuestas
            </p>
          </div>
          <EnpsBar enps={enps} conteos={datos.enps} />
        </Card>
        <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
          <KpiCard label="Participación" value={`${f1(participacion)} %`}>
            <div
              className="mb-1.5 h-1.5 w-full overflow-hidden rounded-full bg-surface-2"
              role="img"
              aria-label={`${f1(participacion)} % de participación`}
            >
              <div className="h-full rounded-full bg-[var(--series-now)]" style={{ width: `${participacion}%` }} />
            </div>
            <span className="text-ink-2">
              {f0(datos.respuestas)} de {f0(datos.invitados)} invitados
            </span>
          </KpiCard>
          <KpiCard label="Promedio de las dimensiones" value={f2(promAct)} unit="de 5">
            <Delta value={promAct - promAnt} suffix={`vs. ${f2(promAnt)} anterior`} />
          </KpiCard>
          {caida && (
            <KpiCard
              className="sm:col-span-2"
              label="Mayor caída"
              value={caida.dimension}
              onClick={() => setDetalle({ tipo: "dim", nombre: caida.dimension })}
              actionLabel={`Mayor caída: ${caida.dimension}, ${f2(caida.puntaje)}. Ver detalle por área`}
            >
              <span className="flex flex-wrap items-center gap-x-2">
                <span className="tabular-nums">{f2(caida.puntaje)}</span>
                <Delta value={caida.puntaje - caida.anterior} suffix={`vs. ${f2(caida.anterior)}`} />
                <span className="ml-auto inline-flex items-center text-accent">
                  Ver detalle <ChevronRight className="size-4" aria-hidden />
                </span>
              </span>
            </KpiCard>
          )}
        </div>
      </div>

      {/* Fila 2: dimensiones vs anterior + comentarios */}
      <div className="grid gap-4 lg:grid-cols-12">
        <Dimensiones datos={datos} onPick={(nombre) => setDetalle({ tipo: "dim", nombre })} />
        <Comentarios datos={datos} />
      </div>

      {/* Fila 3: mapa de calor por área */}
      <PorArea datos={datos} onPick={(nombre) => setDetalle({ tipo: "area", nombre })} />

      <DetalleDrawer datos={datos} detalle={detalle} onClose={cerrar} />
    </>
  );
}

function EnpsBar({ enps, conteos }: { enps: ReturnType<typeof calcEnps>; conteos: Clima["enps"] }) {
  const partes = [
    { k: "Promotores", sub: "9–10", v: conteos.promotores, p: enps.pProm, c: "var(--promotor)" },
    { k: "Pasivos", sub: "7–8", v: conteos.pasivos, p: enps.pPas, c: "var(--pasivo)" },
    { k: "Detractores", sub: "0–6", v: conteos.detractores, p: enps.pDet, c: "var(--detractor)" },
  ];
  return (
    <div className="grid gap-3">
      <div
        className="flex h-3 w-full gap-[2px] overflow-hidden rounded-full"
        role="img"
        aria-label={partes.map((x) => `${x.k} ${f0(x.p)} %`).join(", ")}
      >
        {partes.map((x) => (
          <div key={x.k} style={{ width: `${x.p}%`, background: x.c }} title={`${x.k}: ${f0(x.v)} (${f1(x.p)} %)`} />
        ))}
      </div>
      <ul className="grid grid-cols-3 gap-2">
        {partes.map((x) => (
          <li key={x.k} className="grid gap-0.5">
            <span className="flex items-center gap-1.5 text-[13px] text-ink-2">
              <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: x.c }} aria-hidden />
              {x.k}
            </span>
            <span className="text-[17px] font-semibold tabular-nums">{f0(x.p)} %</span>
            <span className="text-[12px] text-ink-3 tabular-nums">
              {f0(x.v)} · nota {x.sub}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- Dimensiones: gráfico de mancuernas anterior → actual ---------- */

const MIN = 2;
const MAX = 5;
const pos = (v: number) => `${((Math.min(Math.max(v, MIN), MAX) - MIN) / (MAX - MIN)) * 100}%`;

function Dimensiones({ datos, onPick }: { datos: Clima; onPick: (d: string) => void }) {
  const [orden, setOrden] = React.useState<"cambio" | "puntaje">("cambio");
  const filas = [...datos.dimensiones].sort((a, b) =>
    orden === "cambio" ? a.puntaje - a.anterior - (b.puntaje - b.anterior) : b.puntaje - a.puntaje,
  );
  return (
    <Card
      id="dims"
      title="Puntaje por dimensión"
      subtitle="Medición actual frente a la anterior. Pulsa una dimensión para verla por área."
      className="lg:col-span-7"
      actions={
        <Segmented
          label="Ordenar dimensiones"
          value={orden}
          onChange={setOrden}
          options={[
            { value: "cambio", label: "Mayor caída" },
            { value: "puntaje", label: "Puntaje" },
          ]}
        />
      }
    >
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-[12px] text-ink-2" aria-hidden>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-[var(--series-prev)] bg-surface" /> Anterior
        </li>
        <li className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full bg-[var(--series-now)]" /> Actual
        </li>
      </ul>
      <ol className="grid">
        {filas.map((d) => {
          const delta = d.puntaje - d.anterior;
          const lo = Math.min(d.puntaje, d.anterior);
          const hi = Math.max(d.puntaje, d.anterior);
          return (
            <li key={d.dimension} className="border-t border-line first:border-t-0">
              <button
                type="button"
                onClick={() => onPick(d.dimension)}
                aria-label={`${d.dimension}: ${f2(d.puntaje)}, antes ${f2(d.anterior)}. Ver por área`}
                className="group grid min-h-11 w-full cursor-pointer grid-cols-[1fr_auto] items-center gap-x-3 gap-y-1.5 rounded-lg px-1 py-2.5 text-left hover:bg-surface-2 sm:grid-cols-[150px_1fr_120px]"
              >
                <span className="text-[14px] font-medium">{d.dimension}</span>
                <span className="flex items-center justify-end gap-2 text-[13px] sm:order-3">
                  <span className="font-semibold tabular-nums">{f2(d.puntaje)}</span>
                  <Delta value={delta} />
                </span>
                <span className="relative col-span-2 h-5 sm:order-2 sm:col-span-1" aria-hidden>
                  <span className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-line" />
                  <span
                    className={cn("absolute top-1/2 h-[3px] -translate-y-1/2 rounded-full", delta >= 0 ? "bg-[var(--series-now)]/40" : "bg-[var(--detractor)]/40")}
                    style={{ left: pos(lo), width: `calc(${pos(hi)} - ${pos(lo)})` }}
                  />
                  <span
                    className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[var(--series-prev)] bg-surface"
                    style={{ left: pos(d.anterior) }}
                  />
                  <span
                    className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--series-now)] ring-2 ring-surface"
                    style={{ left: pos(d.puntaje) }}
                  />
                </span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className="grid grid-cols-[1fr_auto] gap-x-3 px-1 sm:grid-cols-[150px_1fr_120px]" aria-hidden>
        <span className="hidden sm:block" />
        <span className="col-span-2 flex justify-between text-[12px] text-ink-3 tabular-nums sm:col-span-1">
          {[2, 3, 4, 5].map((t) => (
            <span key={t}>{t}</span>
          ))}
        </span>
      </div>
      <table className="sr-only">
        <caption>Puntaje por dimensión, medición actual y anterior</caption>
        <thead>
          <tr>
            <th scope="col">Dimensión</th>
            <th scope="col">Actual</th>
            <th scope="col">Anterior</th>
          </tr>
        </thead>
        <tbody>
          {filas.map((d) => (
            <tr key={d.dimension}>
              <th scope="row">{d.dimension}</th>
              <td>{f2(d.puntaje)}</td>
              <td>{f2(d.anterior)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

/* ---------- Comentarios ---------- */

const PAGINA = 5;

function Comentarios({ datos }: { datos: Clima }) {
  const [area, setArea] = React.useState("");
  const [tema, setTema] = React.useState("");
  const [todos, setTodos] = React.useState(false);
  const areas = [...new Set(datos.comentarios.map((c) => c.area))].sort();
  const temas = [...new Set(datos.comentarios.map((c) => c.tema))].sort();
  const lista = datos.comentarios.filter((c) => (!area || c.area === area) && (!tema || c.tema === tema));
  const visibles = todos ? lista : lista.slice(0, PAGINA);

  return (
    <Card
      id="coments"
      title="Comentarios"
      subtitle={`${f0(lista.length)} de ${f0(datos.comentarios.length)} comentarios abiertos`}
      className="lg:col-span-5"
    >
      <div className="grid grid-cols-2 gap-2">
        <Filtro label="Área" value={area} onChange={(v) => (setArea(v), setTodos(false))} options={areas} todas="Todas" />
        <Filtro label="Tema" value={tema} onChange={(v) => (setTema(v), setTodos(false))} options={temas} todas="Todos" />
      </div>
      {datos.comentarios.length === 0 ? (
        <EmptyState title="Esta medición no tiene comentarios abiertos">La pregunta abierta era opcional y nadie la respondió.</EmptyState>
      ) : lista.length === 0 ? (
        <EmptyState title="Ningún comentario coincide con los filtros">
          <button
            type="button"
            onClick={() => (setArea(""), setTema(""))}
            className="mt-1 min-h-11 cursor-pointer rounded-lg px-3 font-medium text-accent underline-offset-2 hover:underline"
          >
            Quitar filtros
          </button>
        </EmptyState>
      ) : (
        <>
          <ComentarioLista items={visibles} />
          {lista.length > PAGINA && (
            <button
              type="button"
              onClick={() => setTodos((t) => !t)}
              className="min-h-11 cursor-pointer rounded-xl text-[14px] font-medium text-accent ring-1 ring-line hover:bg-surface-2"
            >
              {todos ? "Mostrar menos" : `Mostrar los ${f0(lista.length)}`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}

function ComentarioLista({ items }: { items: Clima["comentarios"] }) {
  return (
    <ul className="grid gap-2">
      {items.map((c, i) => (
        <li key={i} className="grid gap-1.5 rounded-xl bg-surface-2 px-3.5 py-3">
          <p className="flex gap-2 text-[14px] leading-snug">
            <MessageSquareText className="mt-0.5 size-4 shrink-0 text-ink-3" aria-hidden />
            <span>{c.texto}</span>
          </p>
          <p className="pl-6 text-[12px] text-ink-2">
            {c.area} · {c.tema}
          </p>
        </li>
      ))}
    </ul>
  );
}

function Filtro({
  label,
  value,
  onChange,
  options,
  todas,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  todas: string;
}) {
  const id = React.useId();
  return (
    <div className="grid min-w-0 gap-1">
      <label htmlFor={id} className="text-[12px] font-medium text-ink-2">
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-11 w-full min-w-0 cursor-pointer rounded-xl bg-surface px-3 text-[14px] ring-1 ring-line"
      >
        <option value="">{todas}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ---------- Mapa de calor área × dimensión ---------- */

function PorArea({ datos, onPick }: { datos: Clima; onPick: (a: string) => void }) {
  const dims = datos.dimensiones.map((d) => d.dimension);
  const areas = [...new Set(datos.porArea.map((c) => c.area))];
  const celda = (a: string, d: string) => datos.porArea.find((c) => c.area === a && c.dimension === d);

  return (
    <Card
      id="areas"
      title="Resultados por área"
      subtitle="Puntaje de cada dimensión en cada área (n = respuestas). Pulsa un área para ver su detalle y comentarios."
      actions={
        <ul className="flex flex-wrap items-center gap-1" aria-label="Leyenda de colores">
          {BANDAS.map((b) => (
            <li
              key={b.b}
              className="rounded-md px-2 py-1 text-[12px] tabular-nums"
              style={{ background: `var(--div-${b.b})`, color: "var(--div-text)" }}
            >
              {b.label}
            </li>
          ))}
        </ul>
      }
    >
      {areas.length === 0 ? (
        <EmptyState title="Sin resultados por área">El archivo no trae el desglose por área de esta medición.</EmptyState>
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0" tabIndex={0} role="region" aria-label="Tabla de resultados por área, desplazable">
          <table className="w-full min-w-[760px] border-separate border-spacing-[3px] text-[13px]">
            <caption className="sr-only">Puntaje por área y dimensión, escala 1 a 5</caption>
            <thead>
              <tr>
                <th scope="col" className="sticky left-0 z-10 bg-surface px-2 py-2 text-left font-medium text-ink-2">
                  Área
                </th>
                {dims.map((d) => (
                  <th key={d} scope="col" className="px-1 py-2 text-center text-[12px] font-medium text-ink-2">
                    {d}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {areas.map((a) => (
                <tr key={a}>
                  <th scope="row" className="sticky left-0 z-10 bg-surface p-0 text-left">
                    <button
                      type="button"
                      onClick={() => onPick(a)}
                      aria-label={`Ver detalle de ${a}`}
                      className="flex min-h-11 w-full cursor-pointer items-center justify-between gap-1 rounded-lg px-2 font-medium text-ink hover:bg-surface-2"
                    >
                      {a}
                      <ChevronRight className="size-4 text-ink-3" aria-hidden />
                    </button>
                  </th>
                  {dims.map((d) => {
                    const c = celda(a, d);
                    if (!c)
                      return (
                        <td key={d} className="rounded-md bg-surface-2 text-center text-ink-3" title="Sin dato">
                          —
                        </td>
                      );
                    return (
                      <td
                        key={d}
                        className="rounded-md px-1 py-1.5 text-center"
                        style={{ background: `var(--div-${banda(c.puntaje)})`, color: "var(--div-text)" }}
                        title={`${a} · ${d}: ${f2(c.puntaje)} (n = ${c.n})`}
                      >
                        <span className="block font-semibold tabular-nums">{f2(c.puntaje)}</span>
                        <span className="block text-[12px] opacity-75 tabular-nums">n = {c.n}</span>
                      </td>
                    );
                  })}
                </tr>
              ))}
              <tr>
                <th scope="row" className="sticky left-0 z-10 bg-surface px-2 py-2 text-left text-[12px] font-medium text-ink-2">
                  Total empresa
                </th>
                {datos.dimensiones.map((d) => (
                  <td key={d.dimension} className="px-1 py-1.5 text-center font-semibold tabular-nums ring-1 ring-line rounded-md">
                    {f2(d.puntaje)}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}

/* ---------- Drawer de detalle ---------- */

function DetalleDrawer({ datos, detalle, onClose }: { datos: Clima; detalle: Detalle; onClose: () => void }) {
  if (!detalle) return <Drawer open={false} title="" onClose={onClose}>{null}</Drawer>;

  if (detalle.tipo === "dim") {
    const d = datos.dimensiones.find((x) => x.dimension === detalle.nombre)!;
    const celdas = datos.porArea.filter((c) => c.dimension === d.dimension).sort((a, b) => a.puntaje - b.puntaje);
    const coms = datos.comentarios.filter((c) => c.tema === d.dimension);
    return (
      <Drawer
        open
        onClose={onClose}
        title={d.dimension}
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2">
            <span className="tabular-nums">
              {f2(d.puntaje)} hoy · {f2(d.anterior)} antes
            </span>
            <Delta value={d.puntaje - d.anterior} />
          </span>
        }
      >
        <section className="grid gap-2">
          <h3 className="text-[14px] font-semibold">Por área, de menor a mayor</h3>
          <BarrasArea filas={celdas.map((c) => ({ k: c.area, v: c.puntaje, n: c.n }))} ref_={d.puntaje} refLabel="Total empresa" />
        </section>
        <section className="grid gap-2">
          <h3 className="text-[14px] font-semibold">Comentarios sobre {d.dimension.toLowerCase()} ({coms.length})</h3>
          {coms.length ? <ComentarioLista items={coms} /> : <EmptyState title="Nadie comentó sobre este tema" />}
        </section>
      </Drawer>
    );
  }

  const celdas = datos.porArea.filter((c) => c.area === detalle.nombre);
  const total = (dim: string) => datos.dimensiones.find((x) => x.dimension === dim)?.puntaje ?? 0;
  const coms = datos.comentarios.filter((c) => c.area === detalle.nombre);
  const filas = celdas.map((c) => ({ ...c, dif: c.puntaje - total(c.dimension) })).sort((a, b) => a.dif - b.dif);
  return (
    <Drawer open onClose={onClose} title={detalle.nombre} subtitle="Cada dimensión del área frente al total de la empresa">
      <section className="grid gap-2">
        <h3 className="text-[14px] font-semibold">Diferencia con el total de la empresa</h3>
        <table className="w-full text-[13px]">
          <caption className="sr-only">Puntaje de {detalle.nombre} por dimensión frente al total</caption>
          <thead>
            <tr className="text-left text-[12px] text-ink-2">
              <th scope="col" className="py-1.5 font-medium">Dimensión</th>
              <th scope="col" className="py-1.5 text-right font-medium">Área</th>
              <th scope="col" className="py-1.5 text-right font-medium">Empresa</th>
              <th scope="col" className="py-1.5 text-right font-medium">Dif.</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((c) => (
              <tr key={c.dimension} className="border-t border-line">
                <th scope="row" className="py-2 text-left font-medium">
                  {c.dimension}
                  <span className="block text-[12px] font-normal text-ink-3">n = {c.n}</span>
                </th>
                <td className="py-2 text-right font-semibold tabular-nums">{f2(c.puntaje)}</td>
                <td className="py-2 text-right text-ink-2 tabular-nums">{f2(total(c.dimension))}</td>
                <td className="py-2 text-right">
                  <Delta value={c.dif} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
      <section className="grid gap-2">
        <h3 className="text-[14px] font-semibold">Comentarios de {detalle.nombre} ({coms.length})</h3>
        {coms.length ? <ComentarioLista items={coms} /> : <EmptyState title="Nadie de esta área dejó comentarios" />}
      </section>
    </Drawer>
  );
}

function BarrasArea({ filas, ref_, refLabel }: { filas: { k: string; v: number; n: number }[]; ref_: number; refLabel: string }) {
  if (!filas.length) return <EmptyState title="Sin desglose por área para esta dimensión" />;
  const w = (v: number) => `${(v / 5) * 100}%`;
  return (
    <div className="grid gap-2">
      <ul className="grid gap-2">
        {filas.map((f) => (
          <li key={f.k} className="grid grid-cols-[96px_1fr_44px] items-center gap-2 text-[13px]">
            <span className="truncate">{f.k}</span>
            <span className="relative h-4 rounded bg-surface-2" aria-hidden>
              <span
                className="absolute inset-y-0 left-0 rounded"
                style={{ width: w(f.v), background: f.v < ref_ ? "var(--detractor)" : "var(--series-now)" }}
              />
              <span className="absolute inset-y-[-3px] w-px bg-ink" style={{ left: w(ref_) }} />
            </span>
            <span className="text-right font-semibold tabular-nums">{f2(f.v)}</span>
          </li>
        ))}
      </ul>
      <p className="flex items-center gap-1.5 text-[12px] text-ink-2">
        <span className="inline-block h-3 w-px bg-ink" aria-hidden /> {refLabel}: {f2(ref_)} · rojo = por debajo del total, azul = igual o por encima
      </p>
      <table className="sr-only">
        <caption>Puntaje por área</caption>
        <tbody>
          {filas.map((f) => (
            <tr key={f.k}>
              <th scope="row">{f.k}</th>
              <td>{f2(f.v)}</td>
              <td>n = {f.n}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
