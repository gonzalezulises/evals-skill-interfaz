import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, RotateCw, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ESTADOS,
  TRAMOS,
  cargarOrdenes,
  diasAtraso,
  esAbierta,
  fmt,
  hoyISO,
  resumen,
  tramoDe,
  type Orden,
  type TramoId,
} from "@/lib/ordenes";
import { BarList, Kpis } from "@/components/kpis";
import { DetalleOrden } from "@/components/detalle";
import { TablaOrdenes, ordenar, type Sort, type SortKey } from "@/components/tabla";
import { Panel, Skeleton, focusRing } from "@/components/ui";

type Vista = "todas" | "atrasadas" | "abiertas" | (typeof ESTADOS)[number]["id"];
const POR_PAGINA = 12;

type Carga = { estado: "cargando" } | { estado: "error"; mensaje: string } | { estado: "listo"; ordenes: Orden[] };

export default function App() {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const hoy = useMemo(hoyISO, []);

  const cargar = useCallback(() => {
    setCarga({ estado: "cargando" });
    cargarOrdenes()
      .then((ordenes) => setCarga({ estado: "listo", ordenes }))
      .catch((e: unknown) => setCarga({ estado: "error", mensaje: e instanceof Error ? e.message : String(e) }));
  }, []);
  useEffect(cargar, [cargar]);

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-end justify-between gap-x-6 gap-y-1 px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-accent">Andes Logística · Compras</p>
            <h1 className="mt-0.5 text-xl font-semibold tracking-tight sm:text-2xl">Órdenes de compra</h1>
          </div>
          <p className="text-sm text-muted">Corte al {fmt.fecha(hoy)} · montos en USD</p>
        </div>
      </header>
      <main className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6 sm:py-6">
        {carga.estado === "cargando" && <Cargando />}
        {carga.estado === "error" && <ErrorCarga mensaje={carga.mensaje} onReintentar={cargar} />}
        {carga.estado === "listo" && <Tablero ordenes={carga.ordenes} hoy={hoy} />}
      </main>
    </div>
  );
}

function Cargando() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <span className="sr-only">Cargando órdenes de compra…</span>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr]">
        <Skeleton className="h-64 md:col-span-2 xl:col-span-1 xl:row-span-2" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-28 md:col-span-2" />
      </div>
      <Skeleton className="h-96" />
    </div>
  );
}

function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar: () => void }) {
  return (
    <div role="alert" className="mx-auto max-w-lg rounded-2xl border border-danger/30 bg-danger-soft p-6 text-center">
      <AlertCircle aria-hidden="true" className="mx-auto size-8 text-danger" />
      <h2 className="mt-3 font-semibold">No se pudieron cargar las órdenes</h2>
      <p className="mt-1 text-sm text-muted">Revisa tu conexión y vuelve a intentarlo. Si sigue fallando, avisa a sistemas con este detalle: <span className="font-mono">{mensaje}</span></p>
      <button type="button" onClick={onReintentar} className={cn("mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-surface hover:opacity-90", focusRing)}>
        <RotateCw aria-hidden="true" className="size-4" /> Reintentar
      </button>
    </div>
  );
}

function Tablero({ ordenes, hoy }: { ordenes: Orden[]; hoy: string }) {
  const r = useMemo(() => resumen(ordenes, hoy), [ordenes, hoy]);
  const [vista, setVista] = useState<Vista>("todas");
  const [centro, setCentro] = useState<string | null>(null);
  const [tramo, setTramo] = useState<TramoId | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>({ key: "atraso", dir: "desc" });
  const [page, setPage] = useState(0);
  const [abierta, setAbierta] = useState<Orden | null>(null);
  const tablaRef = useRef<HTMLElement>(null);

  const centros = useMemo(() => [...new Set(ordenes.map((o) => o.centroCosto))].sort((a, b) => a.localeCompare(b, "es")), [ordenes]);

  const filtradas = useMemo(() => {
    const t = q.trim().toLowerCase();
    return ordenes.filter((o) => {
      if (vista === "atrasadas" && diasAtraso(o, hoy) === 0) return false;
      if (vista === "abiertas" && !esAbierta(o)) return false;
      if (vista !== "todas" && vista !== "atrasadas" && vista !== "abiertas" && o.estado !== vista) return false;
      if (centro && o.centroCosto !== centro) return false;
      if (tramo && tramoDe(diasAtraso(o, hoy)) !== tramo) return false;
      if (t && !`${o.id} ${o.proveedor} ${o.solicitante}`.toLowerCase().includes(t)) return false;
      return true;
    });
  }, [ordenes, vista, centro, tramo, q, hoy]);

  const ordenadas = useMemo(() => ordenar(filtradas, sort, hoy), [filtradas, sort, hoy]);
  const pages = Math.max(1, Math.ceil(ordenadas.length / POR_PAGINA));
  const pagina = Math.min(page, pages - 1);
  const visibles = ordenadas.slice(pagina * POR_PAGINA, pagina * POR_PAGINA + POR_PAGINA);
  useEffect(() => setPage(0), [vista, centro, tramo, q, sort]);

  const irATabla = () => tablaRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  const limpiar = () => { setVista("todas"); setCentro(null); setTramo(null); setQ(""); };
  const onSort = (k: SortKey) => setSort((s) => (s.key === k ? { key: k, dir: s.dir === "asc" ? "desc" : "asc" } : { key: k, dir: k === "id" || k === "proveedor" ? "asc" : "desc" }));

  const conteo = (v: Vista) =>
    v === "todas" ? ordenes.length : v === "atrasadas" ? r.atrasadas : v === "abiertas" ? r.abiertas : ordenes.filter((o) => o.estado === v).length;
  const chips: { id: Vista; label: string }[] = [
    { id: "todas", label: "Todas" },
    { id: "atrasadas", label: "Atrasadas" },
    { id: "abiertas", label: "Abiertas" },
    ...ESTADOS,
  ];
  const hayFiltros = vista !== "todas" || centro || tramo || q;

  return (
    <div className="space-y-4">
      <Kpis r={r} onVerAtrasadas={() => { setVista("atrasadas"); setTramo(null); irATabla(); }} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel id="p-tramos" title="Atrasadas por antigüedad" subtitle="Días transcurridos desde la entrega prometida. Pulsa un tramo para verlo en la tabla.">
          <BarList
            etiqueta="este tramo de atraso"
            activo={tramo}
            onSelect={(id) => { setTramo(id as TramoId | null); if (id) setVista("atrasadas"); irATabla(); }}
            items={r.porTramo.map((t) => ({ id: t.id, label: t.label, valor: t.monto, detalle: `${t.ordenes} órdenes · ${fmt.usdCompacto(t.monto)}` }))}
          />
        </Panel>
        <Panel id="p-centros" title="Comprometido por centro de costo" subtitle="Órdenes abiertas. Pulsa un centro para filtrar la tabla.">
          <BarList
            etiqueta="este centro de costo"
            activo={centro}
            onSelect={(id) => { setCentro(id); irATabla(); }}
            items={r.porCentro.map(([c, v]) => ({ id: c, label: c, valor: v, detalle: fmt.usdCompacto(v) }))}
          />
        </Panel>
      </div>

      <section ref={tablaRef} aria-labelledby="t-ordenes" className="scroll-mt-4 min-w-0 rounded-2xl border border-line bg-surface shadow-[var(--shadow)]">
        <div className="space-y-3 px-4 pb-3 pt-4 sm:px-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="t-ordenes" className="text-sm font-semibold">Órdenes <span className="font-normal text-soft tabular-nums">({filtradas.length})</span></h2>
            {hayFiltros && (
              <button type="button" onClick={limpiar} className={cn("inline-flex h-11 cursor-pointer items-center gap-1 rounded-xl px-3 text-sm font-medium text-accent hover:bg-surface-hover md:h-9", focusRing)}>
                <X aria-hidden="true" className="size-4" /> Quitar filtros
              </button>
            )}
          </div>

          <div role="group" aria-label="Filtrar por estado" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">
            {chips.map((c) => (
              <button
                key={c.id}
                type="button"
                aria-pressed={vista === c.id}
                onClick={() => { setVista(c.id); if (c.id !== "atrasadas") setTramo(null); }}
                className={cn(
                  "inline-flex h-11 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors md:h-9",
                  vista === c.id ? "border-line-strong bg-surface-active font-medium text-ink" : "border-line text-muted hover:bg-surface-hover hover:text-ink",
                  c.id === "atrasadas" && vista !== c.id && "text-danger",
                  focusRing,
                )}
              >
                {c.label}
                <span className="text-xs tabular-nums text-soft">{conteo(c.id)}</span>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto]">
            <label className="relative block">
              <span className="mb-1 block text-xs font-medium text-muted">Buscar</span>
              <Search aria-hidden="true" className="pointer-events-none absolute bottom-3.5 left-3 size-4 text-soft md:bottom-2.5" />
              <input
                type="search"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Número de orden, proveedor o solicitante"
                className="h-11 w-full rounded-xl border border-line bg-surface pl-9 pr-3 text-sm text-ink placeholder:text-soft focus-visible:border-accent md:h-9 outline-none focus-visible:ring-[3px] focus-visible:ring-accent/30"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-muted">Centro de costo</span>
              <select
                value={centro ?? ""}
                onChange={(e) => setCentro(e.target.value || null)}
                className="h-11 w-full cursor-pointer rounded-xl border border-line bg-surface px-3 text-sm text-ink md:h-9 sm:w-56 outline-none focus-visible:border-accent focus-visible:ring-[3px] focus-visible:ring-accent/30"
              >
                <option value="">Todos</option>
                {centros.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          {tramo && (
            <p className="text-xs text-muted">
              Mostrando solo el tramo de atraso <strong className="text-ink">{TRAMOS.find((t) => t.id === tramo)?.label}</strong>.
            </p>
          )}
        </div>

        <TablaOrdenes
          rows={visibles}
          total={ordenadas.length}
          hoy={hoy}
          sort={sort}
          onSort={onSort}
          page={pagina}
          pages={pages}
          onPage={setPage}
          onOpen={setAbierta}
          onLimpiar={limpiar}
        />
      </section>

      <DetalleOrden orden={abierta} hoy={hoy} onClose={() => setAbierta(null)} />
    </div>
  );
}
