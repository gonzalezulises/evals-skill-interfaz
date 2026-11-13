import { useMemo, useState } from "react";
import { Search, X, ArrowUpDown, ArrowUp, ArrowDown, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ordenes,
  ESTADOS,
  TRAMOS,
  esAbierta,
  diasAtraso,
  desvioRecepcion,
  tramoDe,
  hoyISO,
  fmtUSD,
  fmtUSDcompact,
  fmtFecha,
  type Orden,
  type TramoId,
} from "@/lib/ordenes";
import { EstadoBadge } from "@/components/EstadoBadge";
import { ProveedorChart } from "@/components/ProveedorChart";
import { DetalleOrden } from "@/components/DetalleOrden";

type Vista = "atrasadas" | "abiertas" | "todas";
type SortKey = "id" | "proveedor" | "monto" | "fechaEntregaPrometida" | "atraso";
const PAGE = 20;

const CENTROS = [...new Set(ordenes.map((o) => o.centroCosto))].sort();

export default function App() {
  const corte = hoyISO();
  const [vista, setVista] = useState<Vista>("atrasadas");
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("");
  const [centro, setCentro] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [tramo, setTramo] = useState<TramoId | "">("");
  const [sort, setSort] = useState<{ key: SortKey; dir: 1 | -1 }>({ key: "atraso", dir: -1 });
  const [page, setPage] = useState(0);
  const [abierta, setAbierta] = useState<Orden | null>(null);

  const abiertas = useMemo(() => ordenes.filter(esAbierta), []);
  const atrasadas = useMemo(() => abiertas.filter((o) => diasAtraso(o, corte) > 0), [abiertas, corte]);

  const kpi = useMemo(() => {
    const sum = (xs: Orden[]) => xs.reduce((s, o) => s + o.monto, 0);
    const criticas = atrasadas.filter((o) => diasAtraso(o, corte) > 60);
    const recibidas = ordenes.filter((o) => o.estado === "recibida");
    const aTiempo = recibidas.filter((o) => (desvioRecepcion(o) ?? 0) <= 0);
    return {
      comprometido: sum(abiertas),
      nAbiertas: abiertas.length,
      atrasado: sum(atrasadas),
      nAtrasadas: atrasadas.length,
      criticas: sum(criticas),
      nCriticas: criticas.length,
      cumplimiento: recibidas.length ? aTiempo.length / recibidas.length : 0,
      nRecibidas: recibidas.length,
    };
  }, [abiertas, atrasadas, corte]);

  const tramos = useMemo(
    () =>
      TRAMOS.map((t) => {
        const xs = atrasadas.filter((o) => tramoDe(diasAtraso(o, corte)) === t.id);
        return { ...t, n: xs.length, monto: xs.reduce((s, o) => s + o.monto, 0) };
      }),
    [atrasadas, corte],
  );

  const filas = useMemo(() => {
    const base = vista === "atrasadas" ? atrasadas : vista === "abiertas" ? abiertas : ordenes;
    const term = q.trim().toLowerCase();
    const xs = base.filter(
      (o) =>
        (!estado || o.estado === estado) &&
        (!centro || o.centroCosto === centro) &&
        (!proveedor || o.proveedor === proveedor) &&
        (!tramo || tramoDe(diasAtraso(o, corte)) === tramo) &&
        (!term ||
          o.id.toLowerCase().includes(term) ||
          o.proveedor.toLowerCase().includes(term) ||
          o.solicitante.toLowerCase().includes(term)),
    );
    const val = (o: Orden) => (sort.key === "atraso" ? diasAtraso(o, corte) : o[sort.key]);
    return [...xs].sort((a, b) => {
      const va = val(a);
      const vb = val(b);
      return (va < vb ? -1 : va > vb ? 1 : 0) * sort.dir;
    });
  }, [vista, atrasadas, abiertas, q, estado, centro, proveedor, tramo, sort, corte]);

  const totalFiltrado = filas.reduce((s, o) => s + o.monto, 0);
  const paginas = Math.max(1, Math.ceil(filas.length / PAGE));
  const pagina = Math.min(page, paginas - 1);
  const visibles = filas.slice(pagina * PAGE, pagina * PAGE + PAGE);

  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(0);
  };
  const hayFiltros = q || estado || centro || proveedor || tramo;
  const limpiar = () => {
    setQ("");
    setEstado("");
    setCentro("");
    setProveedor("");
    setTramo("");
    setPage(0);
  };

  const ordenar = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: (s.dir * -1) as 1 | -1 } : { key, dir: key === "id" || key === "proveedor" ? 1 : -1 }));

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-end justify-between gap-2 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted">Andes Logística · Compras</p>
            <h1 className="text-xl font-semibold sm:text-2xl">Órdenes de compra</h1>
          </div>
          <p className="text-sm text-muted">
            Corte al <time dateTime={corte}>{fmtFecha(corte)}</time> · {ordenes.length} órdenes · montos en USD
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {/* Cifras principales */}
        <section aria-label="Resumen" className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Kpi
            label="Dinero comprometido"
            value={fmtUSD(kpi.comprometido)}
            hint={`${kpi.nAbiertas} órdenes aprobadas, enviadas o con recepción parcial`}
            onClick={() => {
              limpiar();
              setVista("abiertas");
            }}
          />
          <Kpi
            tone="danger"
            label="Comprometido atrasado"
            value={fmtUSD(kpi.atrasado)}
            hint={`${kpi.nAtrasadas} órdenes pasaron su fecha prometida (${Math.round((kpi.atrasado / kpi.comprometido) * 100)} % del comprometido)`}
            onClick={() => {
              limpiar();
              setVista("atrasadas");
            }}
          />
          <Kpi
            tone="warn"
            label="Atraso de más de 60 días"
            value={fmtUSD(kpi.criticas)}
            hint={`${kpi.nCriticas} órdenes`}
            onClick={() => {
              limpiar();
              setVista("atrasadas");
              setSort({ key: "atraso", dir: -1 });
            }}
          />
          <Kpi
            label="Entregas completas a tiempo"
            value={`${Math.round(kpi.cumplimiento * 100)} %`}
            hint={`de ${kpi.nRecibidas} órdenes recibidas completas`}
          />
        </section>

        {/* Gráficos */}
        <section className="grid gap-4 lg:grid-cols-5">
          <div className="rounded-xl border border-line bg-surface p-4 lg:col-span-3">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-semibold">Comprometido por proveedor</h2>
              <Leyenda />
            </div>
            <ProveedorChart
              ordenes={abiertas}
              corte={corte}
              seleccionado={proveedor}
              onSelect={(p) => {
                setProveedor((cur) => (cur === p ? "" : p));
                setPage(0);
              }}
            />
          </div>
          <div className="rounded-xl border border-line bg-surface p-4 lg:col-span-2">
            <h2 className="mb-3 font-semibold">Antigüedad del atraso</h2>
            <ul className="space-y-2">
              {tramos.map((t) => {
                const max = Math.max(...tramos.map((x) => x.monto), 1);
                const activo = tramo === t.id;
                return (
                  <li key={t.id}>
                    <button
                      type="button"
                      aria-pressed={activo}
                      aria-label={`Filtrar atraso de ${t.label}: ${t.n} órdenes, ${fmtUSD(t.monto)}`}
                      onClick={() => {
                        setVista("atrasadas");
                        setTramo(activo ? "" : t.id);
                        setPage(0);
                      }}
                      className={cn(
                        "w-full cursor-pointer rounded-lg border px-3 py-2 text-left transition-colors hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
                        activo ? "border-accent bg-accent-soft" : "border-transparent",
                      )}
                    >
                      <div className="flex items-baseline justify-between gap-2 text-sm">
                        <span className="font-medium">{t.label}</span>
                        <span className="tabular text-muted">
                          {t.n} · <span className="font-medium text-ink">{fmtUSD(t.monto)}</span>
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 rounded-full bg-surface-2">
                        <div
                          className={cn("h-2 rounded-full", t.min > 60 ? "bg-danger" : "bg-warn")}
                          style={{ width: `${(t.monto / max) * 100}%` }}
                        />
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Listado */}
        <section aria-labelledby="listado" className="rounded-xl border border-line bg-surface">
          <div className="space-y-3 border-b border-line p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="listado" className="font-semibold">
                Órdenes
              </h2>
              <div role="group" aria-label="Vista" className="inline-flex rounded-lg bg-surface-2 p-1 text-sm">
                {(
                  [
                    ["atrasadas", `Atrasadas (${atrasadas.length})`],
                    ["abiertas", `Comprometidas (${abiertas.length})`],
                    ["todas", `Todas (${ordenes.length})`],
                  ] as const
                ).map(([v, label]) => (
                  <button
                    key={v}
                    aria-pressed={vista === v}
                    onClick={() => reset(setVista)(v)}
                    className={cn(
                      "cursor-pointer rounded-md px-3 py-1.5 font-medium transition-colors focus-visible:outline-2 focus-visible:outline-accent",
                      vista === v ? "bg-surface text-ink shadow-sm" : "text-muted hover:text-ink",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-[1fr_auto_auto_auto]">
              <label className="relative block sm:col-span-2 lg:col-span-1">
                <span className="sr-only">Buscar</span>
                <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={q}
                  onChange={(e) => reset(setQ)(e.target.value)}
                  placeholder="Buscar por número, proveedor o solicitante"
                  className="h-10 w-full rounded-lg border border-line bg-surface pl-9 pr-3 text-sm placeholder:text-muted focus-visible:outline-2 focus-visible:outline-accent"
                />
              </label>
              <Select label="Estado" value={estado} onChange={reset(setEstado)} options={ESTADOS} />
              <Select label="Centro de costo" value={centro} onChange={reset(setCentro)} options={CENTROS} />
              {hayFiltros ? (
                <button
                  type="button"
                  onClick={limpiar}
                  className="inline-flex h-10 cursor-pointer items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium text-accent hover:bg-accent-soft focus-visible:outline-2 focus-visible:outline-accent"
                >
                  <X aria-hidden className="size-4" /> Limpiar filtros
                </button>
              ) : null}
            </div>
            {(proveedor || tramo) && (
              <div className="flex flex-wrap gap-2 text-sm">
                {proveedor && <Chip onRemove={() => reset(setProveedor)("")}>Proveedor: {proveedor}</Chip>}
                {tramo && <Chip onRemove={() => reset(setTramo)("")}>Atraso: {TRAMOS.find((t) => t.id === tramo)?.label}</Chip>}
              </div>
            )}
            <p className="text-sm text-muted" aria-live="polite">
              <span className="tabular font-medium text-ink">{filas.length}</span> órdenes ·{" "}
              <span className="tabular font-medium text-ink">{fmtUSD(totalFiltrado)}</span>
            </p>
          </div>

          {filas.length === 0 ? (
            <div className="px-4 py-12 text-center">
              <p className="font-medium">No hay órdenes con estos filtros.</p>
              <button type="button" onClick={limpiar} className="mt-2 cursor-pointer text-sm font-medium text-accent hover:underline">
                Limpiar filtros
              </button>
            </div>
          ) : (
            <>
              {/* Tabla: tablet y escritorio */}
              <div className="hidden lg:block">
                <table className="w-full text-sm">
                  <thead className="bg-surface-2 text-left text-xs uppercase tracking-wide text-muted">
                    <tr>
                      <Th k="id" sort={sort} onSort={ordenar}>Orden</Th>
                      <Th k="proveedor" sort={sort} onSort={ordenar}>Proveedor</Th>
                      <th scope="col" className="hidden px-4 py-2.5 font-medium lg:table-cell">Centro de costo</th>
                      <th scope="col" className="px-4 py-2.5 font-medium">Estado</th>
                      <Th k="fechaEntregaPrometida" sort={sort} onSort={ordenar}>Entrega prometida</Th>
                      <Th k="atraso" sort={sort} onSort={ordenar} align="right">Atraso</Th>
                      <Th k="monto" sort={sort} onSort={ordenar} align="right">Monto</Th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibles.map((o) => {
                      const d = diasAtraso(o, corte);
                      return (
                        <tr
                          key={o.id}
                          tabIndex={0}
                          aria-label={`Ver detalle de ${o.id}`}
                          onClick={() => setAbierta(o)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              setAbierta(o);
                            }
                          }}
                          className="cursor-pointer border-t border-line hover:bg-surface-2 focus-visible:bg-accent-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                        >
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-accent">{o.id}</td>
                          <td className="px-4 py-3">
                            <div>{o.proveedor}</div>
                            <div className="text-xs text-muted lg:hidden">{o.centroCosto}</div>
                          </td>
                          <td className="hidden px-4 py-3 text-muted lg:table-cell">{o.centroCosto}</td>
                          <td className="px-4 py-3">
                            <EstadoBadge estado={o.estado} />
                          </td>
                          <td className="tabular whitespace-nowrap px-4 py-3 text-muted">{fmtFecha(o.fechaEntregaPrometida)}</td>
                          <td className="tabular px-4 py-3 text-right">
                            <Atraso dias={d} />
                          </td>
                          <td className="tabular px-4 py-3 text-right font-medium">{fmtUSD(o.monto)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Tarjetas: móvil */}
              <ul className="divide-y divide-line lg:hidden">
                {visibles.map((o) => {
                  const d = diasAtraso(o, corte);
                  return (
                    <li key={o.id}>
                      <button
                        type="button"
                        onClick={() => setAbierta(o)}
                        aria-label={`Ver detalle de ${o.id}, ${o.proveedor}`}
                        className="flex w-full cursor-pointer flex-col gap-1.5 px-4 py-3 text-left hover:bg-surface-2 focus-visible:bg-accent-soft focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
                      >
                        <div className="flex w-full items-baseline justify-between gap-2">
                          <span className="font-medium text-accent">{o.id}</span>
                          <span className="tabular font-semibold">{fmtUSD(o.monto)}</span>
                        </div>
                        <div className="text-sm">{o.proveedor}</div>
                        <div className="flex w-full flex-wrap items-center justify-between gap-2 text-sm">
                          <EstadoBadge estado={o.estado} />
                          <span className="text-muted">
                            Prometida {fmtFecha(o.fechaEntregaPrometida)}
                            {d > 0 && (
                              <>
                                {" · "}
                                <Atraso dias={d} />
                              </>
                            )}
                          </span>
                        </div>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <nav aria-label="Paginación" className="flex items-center justify-between gap-2 border-t border-line px-4 py-3 text-sm">
                <span className="tabular text-muted">
                  {pagina * PAGE + 1}–{Math.min(filas.length, (pagina + 1) * PAGE)} de {filas.length}
                </span>
                <div className="flex gap-1">
                  <PageBtn label="Página anterior" disabled={pagina === 0} onClick={() => setPage(pagina - 1)}>
                    <ChevronLeft aria-hidden className="size-4" />
                  </PageBtn>
                  <PageBtn label="Página siguiente" disabled={pagina >= paginas - 1} onClick={() => setPage(pagina + 1)}>
                    <ChevronRight aria-hidden className="size-4" />
                  </PageBtn>
                </div>
              </nav>
            </>
          )}
        </section>
      </main>

      <DetalleOrden orden={abierta} corte={corte} onClose={() => setAbierta(null)} />
    </div>
  );
}

function Kpi({
  label,
  value,
  hint,
  tone,
  onClick,
}: {
  label: string;
  value: string;
  hint: string;
  tone?: "danger" | "warn";
  onClick?: () => void;
}) {
  const body = (
    <>
      <span className="text-xs font-medium text-muted sm:text-sm">{label}</span>
      <span
        className={cn(
          "tabular mt-1 block text-xl font-semibold sm:text-2xl",
          tone === "danger" && "text-danger",
          tone === "warn" && "text-warn",
        )}
      >
        {value}
      </span>
      <span className="mt-1 block text-xs text-muted">{hint}</span>
    </>
  );
  const cls = "block h-full w-full rounded-xl border border-line bg-surface p-4 text-left";
  return onClick ? (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label}: ${value}. Ver las órdenes`}
      className={cn(cls, "cursor-pointer transition-colors hover:border-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent")}
    >
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

function Leyenda() {
  return (
    <div className="flex gap-3 text-xs text-muted">
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-danger" /> Atrasado
      </span>
      <span className="inline-flex items-center gap-1.5">
        <span className="size-2.5 rounded-sm bg-accent" /> En plazo
      </span>
    </div>
  );
}

function Atraso({ dias }: { dias: number }) {
  if (dias <= 0) return <span className="text-muted">—</span>;
  return <span className={cn("font-medium", dias > 60 ? "text-danger" : "text-warn")}>{dias} d</span>;
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full cursor-pointer rounded-lg border border-line bg-surface px-3 text-sm focus-visible:outline-2 focus-visible:outline-accent"
      >
        <option value="">{label}: todos</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o.charAt(0).toUpperCase() + o.slice(1)}
          </option>
        ))}
      </select>
    </label>
  );
}

function Chip({ children, onRemove }: { children: React.ReactNode; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft py-1 pl-3 pr-1 text-accent">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label="Quitar filtro"
        className="cursor-pointer rounded-full p-0.5 hover:bg-surface focus-visible:outline-2 focus-visible:outline-accent"
      >
        <X aria-hidden className="size-3.5" />
      </button>
    </span>
  );
}

function Th({
  k,
  sort,
  onSort,
  align,
  children,
}: {
  k: SortKey;
  sort: { key: SortKey; dir: 1 | -1 };
  onSort: (k: SortKey) => void;
  align?: "right";
  children: React.ReactNode;
}) {
  const active = sort.key === k;
  const Icon = !active ? ArrowUpDown : sort.dir === 1 ? ArrowUp : ArrowDown;
  return (
    <th
      scope="col"
      aria-sort={active ? (sort.dir === 1 ? "ascending" : "descending") : "none"}
      className={cn("px-4 py-2.5 font-medium", align === "right" && "text-right")}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          "inline-flex cursor-pointer items-center gap-1 uppercase hover:text-ink focus-visible:outline-2 focus-visible:outline-accent",
          active && "text-ink",
        )}
      >
        {children}
        <Icon aria-hidden className="size-3.5" />
      </button>
    </th>
  );
}

function PageBtn({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="inline-flex size-9 cursor-pointer items-center justify-center rounded-lg border border-line hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40"
    >
      {children}
    </button>
  );
}
