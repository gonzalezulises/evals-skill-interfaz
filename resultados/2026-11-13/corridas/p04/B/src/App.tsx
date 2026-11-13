import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronRight, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  INDICADORES,
  formatoUSD,
  indicadorPorId,
  mediana,
  proyectos,
  rango,
  riesgoDe,
  tono,
  type IndicadorId,
  type Proyecto,
  type Riesgo,
  type Tono,
} from "@/lib/proyectos";

type FiltroRiesgo = "todos" | Riesgo;

const TONO_TEXTO: Record<Tono, string> = {
  bien: "text-ok",
  alerta: "text-warn",
  mal: "text-bad",
  neutro: "text-fg",
};
const TONO_BARRA: Record<Tono, string> = {
  bien: "bg-ok",
  alerta: "bg-warn",
  mal: "bg-bad",
  neutro: "bg-accent",
};

const RESALTADOS: IndicadorId[] = ["avanceFisicoPct", "desviacionCostoPct", "diasAtraso", "hitos", "satisfaccionCliente", "incidentesSeguridad"];

export default function App() {
  const [busqueda, setBusqueda] = useState("");
  const [filtro, setFiltro] = useState<FiltroRiesgo>("todos");
  const [orden, setOrden] = useState<IndicadorId>("riesgo");
  const [desc, setDesc] = useState(true);
  const [abierto, setAbierto] = useState<Proyecto | null>(null);

  const conteo = useMemo(() => {
    const c = { todos: proyectos.length, alto: 0, medio: 0, bajo: 0 };
    for (const p of proyectos) c[riesgoDe(p)]++;
    return c;
  }, []);

  const lista = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    const ind = indicadorPorId(orden);
    return proyectos
      .filter((p) => filtro === "todos" || p.riesgo === filtro)
      .filter((p) => !q || `${p.id} ${p.nombre} ${p.gerente}`.toLowerCase().includes(q))
      .sort((a, b) => (desc ? ind.valor(b) - ind.valor(a) : ind.valor(a) - ind.valor(b)) || a.id.localeCompare(b.id));
  }, [busqueda, filtro, orden, desc]);

  const ordenarPor = (id: IndicadorId) => {
    if (id === orden) setDesc((d) => !d);
    else {
      setOrden(id);
      setDesc(true);
    }
  };

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <header className="mx-auto max-w-7xl px-4 pt-5 pb-3 sm:px-6 lg:px-8">
        <p className="text-xs font-medium tracking-wide text-muted uppercase">Andes Logística · Operaciones</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-balance sm:text-3xl">Proyectos activos</h1>
        <p className="mt-1 text-sm text-muted">
          {proyectos.length} proyectos · 12 indicadores
        </p>
        <Resumen />
      </header>

      <div className="sticky top-0 z-20 border-b border-line bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/80">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <label className="relative block lg:w-72">
            <span className="sr-only">Buscar proyecto, código o gerente</span>
            <Search aria-hidden className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar proyecto o gerente"
              className="h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-base outline-none placeholder:text-muted focus-visible:ring-2 focus-visible:ring-accent sm:text-sm"
            />
          </label>

          <div role="radiogroup" aria-label="Filtrar por riesgo" className="grid grid-cols-4 gap-1.5 sm:flex">
            {(["todos", "alto", "medio", "bajo"] as const).map((r) => (
              <button
                key={r}
                role="radio"
                aria-checked={filtro === r}
                onClick={() => setFiltro(r)}
                className={cn(
                  "flex h-11 min-w-0 shrink-0 cursor-pointer items-center justify-center gap-1.5 rounded-full border px-2 text-sm font-medium outline-none sm:px-3.5 focus-visible:ring-2 focus-visible:ring-accent",
                  filtro === r ? "border-fg bg-fg text-bg" : "border-line bg-surface text-fg hover:bg-subtle",
                )}
              >
                {r !== "todos" && <span aria-hidden className={cn("size-2 rounded-full", r === "alto" ? "bg-bad" : r === "medio" ? "bg-warn" : "bg-ok")} />}
                {r === "todos" ? "Todos" : (
                  <span>
                    <span className="sr-only sm:not-sr-only">Riesgo </span>
                    {r === "alto" ? "Alto" : r === "medio" ? "Medio" : "Bajo"}
                  </span>
                )}
                <span className={cn("tabular-nums", filtro === r ? "text-bg/70" : "text-muted")}>{conteo[r]}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 lg:ml-auto">
            <label htmlFor="orden" className="shrink-0 text-sm text-muted">
              Ordenar por
            </label>
            <select
              id="orden"
              value={orden}
              onChange={(e) => {
                setOrden(e.target.value as IndicadorId);
                setDesc(true);
              }}
              className="h-11 min-w-0 flex-1 cursor-pointer rounded-lg border border-line bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-accent sm:text-sm lg:w-56 lg:flex-none"
            >
              {INDICADORES.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.label}
                </option>
              ))}
            </select>
            <button
              onClick={() => setDesc((d) => !d)}
              aria-label={desc ? "Orden descendente: cambiar a ascendente" : "Orden ascendente: cambiar a descendente"}
              title={desc ? "Mayor a menor" : "Menor a mayor"}
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg border border-line bg-surface outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
            >
              {desc ? <ArrowDownWideNarrow className="size-5" /> : <ArrowUpNarrowWide className="size-5" />}
            </button>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pt-3 pb-10 sm:px-6 lg:px-8">
        <p className="mb-2 text-sm text-muted" aria-live="polite">
          {lista.length === proyectos.length ? `${lista.length} proyectos` : `${lista.length} de ${proyectos.length} proyectos`}
        </p>

        {lista.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface px-4 py-10 text-center">
            <p className="font-medium">Ningún proyecto coincide</p>
            <p className="mt-1 text-sm text-muted">Prueba con otro nombre o quita el filtro de riesgo.</p>
            <button
              onClick={() => {
                setBusqueda("");
                setFiltro("todos");
              }}
              className="mt-4 h-11 cursor-pointer rounded-lg border border-line px-4 text-sm font-medium outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
            >
              Limpiar filtros
            </button>
          </div>
        ) : (
          <>
            <ListaTarjetas lista={lista} orden={orden} onAbrir={setAbierto} />
            <Tabla lista={lista} orden={orden} desc={desc} onOrdenar={ordenarPor} onAbrir={setAbierto} />
          </>
        )}
      </main>

      <Detalle proyecto={abierto} onCerrar={() => setAbierto(null)} />
    </div>
  );
}

function Resumen() {
  const totales = useMemo(() => {
    const presupuesto = proyectos.reduce((s, p) => s + p.presupuestoUSD, 0);
    const ejecutado = proyectos.reduce((s, p) => s + p.ejecutadoUSD, 0);
    return {
      alto: proyectos.filter((p) => p.riesgo === "alto").length,
      atrasados: proyectos.filter((p) => p.diasAtraso > 0).length,
      sobreCosto: proyectos.filter((p) => p.desviacionCostoPct > 0).length,
      presupuesto,
      ejecutado,
    };
  }, []);
  const tiles = [
    { label: "Riesgo alto", valor: totales.alto, tono: "mal" as Tono },
    { label: "Con atraso", valor: totales.atrasados, tono: "alerta" as Tono },
    { label: "Sobre costo", valor: totales.sobreCosto, tono: "alerta" as Tono },
    {
      label: "Ejecutado",
      valor: formatoUSD(totales.ejecutado),
      detalle: `de ${formatoUSD(totales.presupuesto)}`,
      tono: "neutro" as Tono,
    },
  ];
  return (
    <dl className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
      {tiles.map((t) => (
        <div key={t.label} className="rounded-xl border border-line bg-surface px-3 py-2.5">
          <dt className="text-xs text-muted">{t.label}</dt>
          <dd className="mt-0.5 flex min-w-0 flex-wrap items-baseline gap-x-1.5">
            <span className={cn("text-xl font-semibold tabular-nums", TONO_TEXTO[t.tono])}>{t.valor}</span>
            {typeof t.valor === "number" && <span className="text-xs text-muted">de {proyectos.length}</span>}
            {t.detalle && <span className="text-xs text-muted">{t.detalle}</span>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BadgeRiesgo({ riesgo }: { riesgo: string }) {
  const t: Tono = riesgo === "alto" ? "mal" : riesgo === "medio" ? "alerta" : "bien";
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium capitalize",
        t === "mal" ? "bg-bad-soft text-bad" : t === "alerta" ? "bg-warn-soft text-warn" : "bg-ok-soft text-ok",
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", TONO_BARRA[t])} />
      {riesgo}
    </span>
  );
}

/** Barra horizontal: posición del valor dentro del rango de los 40 proyectos. */
function Barra({ id, p }: { id: IndicadorId; p: Proyecto }) {
  const ind = indicadorPorId(id);
  const { min, max } = rango(id);
  const base = id === "desviacionCostoPct" ? Math.min(0, min) : 0;
  const pct = max === base ? 0 : ((ind.valor(p) - base) / (max - base)) * 100;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-subtle" aria-hidden>
      <div className={cn("h-full rounded-full", TONO_BARRA[tono(id, p)])} style={{ width: `${Math.max(2, Math.min(100, pct))}%` }} />
    </div>
  );
}

function ListaTarjetas({ lista, orden, onAbrir }: { lista: Proyecto[]; orden: IndicadorId; onAbrir: (p: Proyecto) => void }) {
  const ind = indicadorPorId(orden);
  const resto = RESALTADOS.filter((id) => id !== orden).slice(0, 6);
  return (
    <ol className="space-y-2 md:hidden">
      {lista.map((p, i) => (
        <li key={p.id}>
          <button
            onClick={() => onAbrir(p)}
            aria-label={`${p.nombre}, ${ind.label} ${ind.formato(p)}. Ver los 12 indicadores`}
            className="w-full cursor-pointer rounded-xl border border-line bg-surface p-3 text-left outline-none active:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
          >
            <div className="flex items-start gap-2">
              <span className="mt-0.5 w-6 shrink-0 text-xs text-muted tabular-nums">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium leading-snug">{p.nombre}</p>
                  <BadgeRiesgo riesgo={p.riesgo} />
                </div>
                <p className="text-xs text-muted">
                  {p.id} · {p.gerente}
                </p>

                {orden !== "riesgo" && (
                  <div className="mt-2.5">
                    <div className="flex items-baseline justify-between text-sm">
                      <span className="text-muted">{ind.label}</span>
                      <span className={cn("font-semibold tabular-nums", TONO_TEXTO[tono(orden, p)])}>{ind.formato(p)}</span>
                    </div>
                    <div className="mt-1">
                      <Barra id={orden} p={p} />
                    </div>
                  </div>
                )}

                <dl className="mt-2.5 grid grid-cols-3 gap-x-2 gap-y-1.5">
                  {resto.slice(0, orden === "riesgo" ? 6 : 3).map((id) => {
                    const r = indicadorPorId(id);
                    return (
                      <div key={id} className="min-w-0">
                        <dt className="truncate text-[11px] text-muted">{r.corto}</dt>
                        <dd className={cn("text-sm font-medium tabular-nums", TONO_TEXTO[tono(id, p)])}>{r.formato(p)}</dd>
                      </div>
                    );
                  })}
                </dl>
              </div>
              <ChevronRight aria-hidden className="mt-0.5 size-4 shrink-0 text-muted" />
            </div>
          </button>
        </li>
      ))}
    </ol>
  );
}

function Tabla({
  lista,
  orden,
  desc,
  onOrdenar,
  onAbrir,
}: {
  lista: Proyecto[];
  orden: IndicadorId;
  desc: boolean;
  onOrdenar: (id: IndicadorId) => void;
  onAbrir: (p: Proyecto) => void;
}) {
  return (
    <div className="hidden max-h-[calc(100dvh-9rem)] overflow-auto rounded-xl border border-line bg-surface md:block">
      <table className="w-full border-separate border-spacing-0 text-sm">
        <caption className="sr-only">Proyectos activos con sus indicadores. Pulsa un encabezado para ordenar y una fila para ver el detalle.</caption>
        <thead>
          <tr>
            <th scope="col" className="sticky top-0 left-0 z-20 border-b border-line bg-subtle px-3 py-2 text-left font-medium text-muted">
              Proyecto
            </th>
            {INDICADORES.map((i) => {
              const activo = i.id === orden;
              return (
                <th
                  key={i.id}
                  scope="col"
                  aria-sort={activo ? (desc ? "descending" : "ascending") : "none"}
                  className="sticky top-0 z-10 border-b border-line bg-subtle p-0 text-right font-medium whitespace-nowrap"
                >
                  <button
                    onClick={() => onOrdenar(i.id)}
                    title={`Ordenar por ${i.label.toLowerCase()}`}
                    className={cn(
                      "inline-flex w-full cursor-pointer items-center justify-end gap-1 px-3 py-2 outline-none hover:text-fg focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset",
                      activo ? "text-fg" : "text-muted",
                    )}
                  >
                    {i.corto}
                    {activo && (desc ? <ArrowDownWideNarrow aria-hidden className="size-3.5" /> : <ArrowUpNarrowWide aria-hidden className="size-3.5" />)}
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {lista.map((p) => (
            <tr key={p.id} className="group">
              <th scope="row" className="sticky left-0 z-[5] border-b border-line bg-surface p-0 text-left font-normal group-hover:bg-subtle">
                <button
                  onClick={() => onAbrir(p)}
                  aria-label={`Ver detalle de ${p.nombre}`}
                  className="block w-full min-w-52 cursor-pointer px-3 py-2 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
                >
                  <span className="block max-w-64 truncate font-medium">{p.nombre}</span>
                  <span className="block text-xs text-muted">
                    {p.id} · {p.gerente}
                  </span>
                </button>
              </th>
              {INDICADORES.map((i) => (
                <td
                  key={i.id}
                  className={cn(
                    "border-b border-line px-3 py-2 text-right whitespace-nowrap tabular-nums group-hover:bg-subtle",
                    i.id === orden && "bg-accent-soft font-medium",
                    TONO_TEXTO[tono(i.id, p)],
                  )}
                >
                  {i.id === "riesgo" ? <BadgeRiesgo riesgo={p.riesgo} /> : i.formato(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Detalle({ proyecto, onCerrar }: { proyecto: Proyecto | null; onCerrar: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (proyecto && !d.open) d.showModal();
    if (!proyecto && d.open) d.close();
  }, [proyecto]);

  return (
    <dialog
      ref={ref}
      onClose={onCerrar}
      onClick={(e) => e.target === e.currentTarget && onCerrar()}
      aria-labelledby="detalle-titulo"
      className="m-0 mt-auto max-h-[88dvh] w-full max-w-none overflow-hidden rounded-t-2xl bg-surface p-0 text-fg backdrop:bg-black/40 sm:m-auto sm:max-h-[85dvh] sm:max-w-lg sm:rounded-2xl"
    >
      {proyecto && (
        <div className="flex max-h-[inherit] flex-col">
          <div className="flex items-start gap-3 border-b border-line px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-muted">
                {proyecto.id} · {proyecto.gerente}
              </p>
              <h2 id="detalle-titulo" className="text-lg font-semibold leading-snug">
                {proyecto.nombre}
              </h2>
              <div className="mt-1">
                <BadgeRiesgo riesgo={proyecto.riesgo} />
              </div>
            </div>
            <button
              onClick={onCerrar}
              aria-label="Cerrar detalle"
              className="grid size-11 shrink-0 cursor-pointer place-items-center rounded-lg outline-none hover:bg-subtle focus-visible:ring-2 focus-visible:ring-accent"
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="overflow-y-auto px-4 py-3">
            <p className="mb-3 text-xs text-muted">
              Valor del proyecto frente a la mediana de los {proyectos.length} (marca vertical).
            </p>
            <ul className="space-y-3">
              {INDICADORES.filter((i) => i.id !== "riesgo").map((i) => (
                <FilaDetalle key={i.id} id={i.id} p={proyecto} />
              ))}
            </ul>
          </div>
        </div>
      )}
    </dialog>
  );
}

function FilaDetalle({ id, p }: { id: IndicadorId; p: Proyecto }) {
  const ind = indicadorPorId(id);
  const { min, max } = rango(id);
  const pos = (v: number) => (max === min ? 0 : ((v - min) / (max - min)) * 100);
  const med = mediana(id);
  const t = tono(id, p);
  const medTexto =
    id === "hitos"
      ? `${Math.round(med * 10)}/10`
      : ind.formato({ ...p, [id]: med } as Proyecto);
  return (
    <li>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span>{ind.label}</span>
        <span className={cn("font-semibold tabular-nums", TONO_TEXTO[t])}>{ind.formato(p)}</span>
      </div>
      <div className="relative mt-1.5 h-2 rounded-full bg-subtle" aria-hidden>
        <div className={cn("absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-surface", TONO_BARRA[t])} style={{ left: `${pos(ind.valor(p))}%` }} />
        <div className="absolute -top-0.5 h-3 w-0.5 -translate-x-1/2 bg-muted" style={{ left: `${pos(med)}%` }} />
      </div>
      <p className="mt-0.5 text-[11px] text-muted">Mediana {medTexto}</p>
    </li>
  );
}
