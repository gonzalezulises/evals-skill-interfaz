import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowDownUp, LayoutList, RotateCw, Search, Table2, X } from "lucide-react";
import { fetchProyectos } from "@/lib/api";
import { INDICADORES, alertas, formatoUSD, indicador, type ClaveIndicador, type Proyecto, type Riesgo } from "@/lib/proyectos";
import { Ranking, type ClaveRanking } from "@/components/Ranking";
import { Tabla } from "@/components/Tabla";
import { Detalle } from "@/components/Detalle";
import { cn } from "@/lib/utils";

type Foco = "atraso" | "sobrecosto" | null;
type Vista = "ranking" | "tabla";
type Carga = { estado: "cargando" } | { estado: "error"; mensaje: string } | { estado: "listo"; datos: Proyecto[] };

const FOCOS: Record<Exclude<Foco, null>, { etiqueta: string; prueba: (p: Proyecto) => boolean; clave: ClaveIndicador }> = {
  atraso: { etiqueta: "Más de 30 días de atraso", prueba: (p) => p.diasAtraso > 30, clave: "diasAtraso" },
  sobrecosto: { etiqueta: "Sobrecosto mayor a 10 %", prueba: (p) => p.desviacionCostoPct > 10, clave: "desviacionCostoPct" },
};

const pct = { format: (f: number) => `${Math.round(f * 100)} %` };
const anchoInicial = (): Vista => (typeof window !== "undefined" && window.matchMedia("(min-width: 768px)").matches ? "tabla" : "ranking");

export default function App() {
  const [carga, setCarga] = useState<Carga>({ estado: "cargando" });
  const [riesgo, setRiesgo] = useState<Riesgo | "todos">("todos");
  const [gerente, setGerente] = useState("todos");
  const [busqueda, setBusqueda] = useState("");
  const [foco, setFoco] = useState<Foco>(null);
  const [vista, setVista] = useState<Vista>(anchoInicial);
  const [clave, setClave] = useState<ClaveRanking>("alertas");
  const [invertir, setInvertir] = useState(false);
  const [ordenTabla, setOrdenTabla] = useState<{ clave: ClaveIndicador | "nombre"; dir: 1 | -1 } | null>(null);
  const [abierto, setAbierto] = useState<Proyecto | null>(null);
  const origen = useRef<HTMLElement | null>(null);

  const cargar = useCallback(() => {
    setCarga({ estado: "cargando" });
    fetchProyectos()
      .then((datos) => setCarga({ estado: "listo", datos }))
      .catch((e: unknown) => setCarga({ estado: "error", mensaje: e instanceof Error ? e.message : String(e) }));
  }, []);
  useEffect(cargar, [cargar]);

  const cartera = carga.estado === "listo" ? carga.datos : [];
  const gerentes = useMemo(() => [...new Set(cartera.map((p) => p.gerente))].sort(), [cartera]);

  const filtrados = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return cartera.filter(
      (p) =>
        (riesgo === "todos" || p.riesgo === riesgo) &&
        (gerente === "todos" || p.gerente === gerente) &&
        (!foco || FOCOS[foco].prueba(p)) &&
        (!q || `${p.nombre} ${p.id} ${p.gerente}`.toLowerCase().includes(q)),
    );
  }, [cartera, riesgo, gerente, foco, busqueda]);

  // Ranking: por defecto, lo que más atención pide va primero.
  const enRanking = useMemo(() => {
    const puntaje = (p: Proyecto) => {
      if (clave === "alertas") {
        const a = alertas(p);
        return a.critico * 10 + a.alerta + indicador("riesgo").valor(p) * 0.1;
      }
      return indicador(clave).valor(p);
    };
    const peorPrimero = clave === "alertas" || indicador(clave).mejor !== "alto" ? -1 : 1;
    const dir = invertir ? -peorPrimero : peorPrimero;
    return [...filtrados].sort((a, b) => (puntaje(a) - puntaje(b)) * dir || a.nombre.localeCompare(b.nombre));
  }, [filtrados, clave, invertir]);

  const enTabla = useMemo(() => {
    if (!ordenTabla) return filtrados;
    const { clave: c, dir } = ordenTabla;
    return [...filtrados].sort((a, b) =>
      c === "nombre" ? a.nombre.localeCompare(b.nombre) * dir : (indicador(c).valor(a) - indicador(c).valor(b)) * dir,
    );
  }, [filtrados, ordenTabla]);

  const hayFiltros = riesgo !== "todos" || gerente !== "todos" || foco !== null || busqueda !== "";
  const limpiar = () => {
    setRiesgo("todos");
    setGerente("todos");
    setFoco(null);
    setBusqueda("");
  };

  const abrir = useCallback((p: Proyecto, el: HTMLElement) => {
    origen.current = el;
    setAbierto(p);
  }, []);
  const cerrar = useCallback(() => {
    setAbierto(null);
    origen.current?.focus();
  }, []);

  const ordenarTabla = (c: ClaveIndicador | "nombre") =>
    setOrdenTabla((o) => {
      if (o?.clave === c) return { clave: c, dir: (o.dir * -1) as 1 | -1 };
      const mejor = c === "nombre" ? "alto" : indicador(c).mejor;
      return { clave: c, dir: c === "nombre" || mejor === "alto" ? 1 : -1 };
    });

  const elegirFoco = (f: Exclude<Foco, null>) => {
    const nuevo = foco === f ? null : f;
    setFoco(nuevo);
    if (nuevo) {
      setClave(FOCOS[nuevo].clave);
      setInvertir(false);
      setOrdenTabla({ clave: FOCOS[nuevo].clave, dir: -1 });
    }
  };

  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6">
          <p className="text-xs font-medium tracking-wide text-ink-3 uppercase">Andes Logística · Operaciones</p>
          <h1 className="mt-0.5 text-xl font-semibold sm:text-2xl">Proyectos activos</h1>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 pt-4 pb-10 sm:px-6">
        {carga.estado === "cargando" && <Esqueleto />}

        {carga.estado === "error" && (
          <div role="alert" className="rounded-xl border border-crit/40 bg-crit-soft p-5">
            <h2 className="font-semibold text-crit-ink">No se pudieron cargar los proyectos</h2>
            <p className="mt-1 text-sm text-ink-2">
              El servicio de proyectos no respondió ({carga.mensaje}). Los datos no se han perdido: vuelve a intentarlo.
            </p>
            <button
              type="button"
              onClick={cargar}
              className="mt-3 inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-ink px-4 text-sm font-medium text-surface"
            >
              <RotateCw className="size-4" aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {carga.estado === "listo" && cartera.length === 0 && (
          <div className="rounded-xl border border-line bg-surface p-6 text-center">
            <h2 className="font-semibold">No hay proyectos activos</h2>
            <p className="mt-1 text-sm text-ink-2">Cuando se active un proyecto aparecerá aquí con sus 12 indicadores.</p>
          </div>
        )}

        {carga.estado === "listo" && cartera.length > 0 && (
          <>
            <Resumen cartera={cartera} riesgo={riesgo} foco={foco} onRiesgoAlto={() => setRiesgo((r) => (r === "alto" ? "todos" : "alto"))} onFoco={elegirFoco} />

            <section aria-label="Filtros" className="mt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-2">Buscar</span>
                  <span className="relative block">
                    <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-ink-3" aria-hidden="true" />
                    <input
                      type="search"
                      value={busqueda}
                      onChange={(e) => setBusqueda(e.target.value)}
                      placeholder="Nombre, código o gerente"
                      className="h-11 w-full rounded-lg border border-line bg-surface pr-3 pl-9 text-base sm:text-sm"
                    />
                  </span>
                </label>
                <label className="block">
                  <span className="mb-1 block text-xs font-medium text-ink-2">Gerente</span>
                  <select
                    value={gerente}
                    onChange={(e) => setGerente(e.target.value)}
                    className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-base sm:w-44 sm:text-sm"
                  >
                    <option value="todos">Todos</option>
                    {gerentes.map((g) => (
                      <option key={g}>{g}</option>
                    ))}
                  </select>
                </label>
                <fieldset>
                  <legend className="mb-1 text-xs font-medium text-ink-2">Riesgo</legend>
                  <div className="grid grid-cols-4 rounded-lg border border-line bg-surface p-0.5">
                    {(["todos", "alto", "medio", "bajo"] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        aria-pressed={riesgo === r}
                        onClick={() => setRiesgo(r)}
                        className={cn(
                          "h-11 cursor-pointer rounded-md px-3 text-sm capitalize",
                          riesgo === r ? "bg-ink font-medium text-surface" : "text-ink-2 hover:bg-surface-2",
                        )}
                      >
                        {r === "todos" ? "Todos" : r}
                      </button>
                    ))}
                  </div>
                </fieldset>
              </div>

              {foco && (
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink-2">Mostrando solo:</span>
                  <button
                    type="button"
                    onClick={() => setFoco(null)}
                    className="inline-flex h-11 cursor-pointer items-center gap-1 rounded-full border border-accent bg-accent-soft/40 px-3 font-medium text-accent-ink"
                    aria-label={`Quitar filtro: ${FOCOS[foco].etiqueta}`}
                  >
                    {FOCOS[foco].etiqueta} <X className="size-4" aria-hidden="true" />
                  </button>
                </p>
              )}
            </section>

            <section aria-labelledby="titulo-comparacion" className="mt-5">
              <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <h2 id="titulo-comparacion" className="text-base font-semibold">
                    Comparación
                  </h2>
                  <p className="text-xs text-ink-3" aria-live="polite">
                    {filtrados.length} de {cartera.length} proyectos
                  </p>
                </div>
                <div className="grid grid-cols-2 rounded-lg border border-line bg-surface p-0.5" role="group" aria-label="Vista">
                  {(
                    [
                      ["ranking", "Ranking", LayoutList],
                      ["tabla", "Tabla", Table2],
                    ] as const
                  ).map(([v, texto, Icono]) => (
                    <button
                      key={v}
                      type="button"
                      aria-pressed={vista === v}
                      onClick={() => setVista(v)}
                      className={cn(
                        "inline-flex h-11 cursor-pointer items-center justify-center gap-1.5 rounded-md px-3 text-sm",
                        vista === v ? "bg-ink font-medium text-surface" : "text-ink-2 hover:bg-surface-2",
                      )}
                    >
                      <Icono className="size-4" aria-hidden="true" /> {texto}
                    </button>
                  ))}
                </div>
              </div>

              {vista === "ranking" && (
                <div className="mb-3 flex items-end gap-2">
                  <label className="block flex-1 sm:max-w-xs">
                    <span className="mb-1 block text-xs font-medium text-ink-2">Comparar por</span>
                    <select
                      value={clave}
                      onChange={(e) => {
                        setClave(e.target.value as ClaveRanking);
                        setInvertir(false);
                      }}
                      className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-base sm:text-sm"
                    >
                      <option value="alertas">Más alertas primero</option>
                      {INDICADORES.map((i) => (
                        <option key={i.clave} value={i.clave}>
                          {i.etiqueta}
                        </option>
                      ))}
                    </select>
                  </label>
                  <button
                    type="button"
                    onClick={() => setInvertir((v) => !v)}
                    aria-pressed={invertir}
                    className="inline-flex h-11 cursor-pointer items-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-sm text-ink-2 hover:bg-surface-2"
                    title="Invertir el orden"
                  >
                    <ArrowDownUp className="size-4" aria-hidden="true" />
                    {ordenTexto(clave, invertir)}
                  </button>
                </div>
              )}

              {filtrados.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line bg-surface p-6 text-center">
                  <h3 className="font-semibold">Ningún proyecto cumple estos filtros</h3>
                  <p className="mt-1 text-sm text-ink-2">Prueba con otro riesgo o gerente, o quita la búsqueda.</p>
                  <button
                    type="button"
                    onClick={limpiar}
                    className="mt-3 inline-flex h-11 cursor-pointer items-center rounded-lg bg-ink px-4 text-sm font-medium text-surface"
                  >
                    Limpiar filtros
                  </button>
                </div>
              ) : vista === "ranking" ? (
                <Ranking proyectos={enRanking} cartera={cartera} clave={clave} onAbrir={abrir} />
              ) : (
                <Tabla proyectos={enTabla} orden={ordenTabla} onOrdenar={ordenarTabla} onAbrir={abrir} />
              )}

              {hayFiltros && filtrados.length > 0 && (
                <button type="button" onClick={limpiar} className="mt-3 h-11 cursor-pointer text-sm font-medium text-accent-ink underline underline-offset-2">
                  Limpiar filtros
                </button>
              )}
            </section>
          </>
        )}
      </main>

      <Detalle proyecto={abierto} cartera={cartera} onCerrar={cerrar} />
    </div>
  );
}

function ordenTexto(clave: ClaveRanking, invertir: boolean) {
  const peorPrimero = !invertir;
  if (clave === "alertas" || indicador(clave).mejor !== "neutro") return peorPrimero ? "Peores primero" : "Mejores primero";
  return peorPrimero ? "Mayor primero" : "Menor primero";
}

interface ResumenProps {
  cartera: Proyecto[];
  riesgo: Riesgo | "todos";
  foco: Foco;
  onRiesgoAlto: () => void;
  onFoco: (f: Exclude<Foco, null>) => void;
}

/** Cinco cifras de la cartera completa. Las tres de alerta filtran la lista al pulsarlas. */
function Resumen({ cartera, riesgo, foco, onRiesgoAlto, onFoco }: ResumenProps) {
  const n = cartera.length;
  const alto = cartera.filter((p) => p.riesgo === "alto").length;
  const atraso = cartera.filter(FOCOS.atraso.prueba).length;
  const sobrecosto = cartera.filter(FOCOS.sobrecosto.prueba).length;
  const fisico = cartera.reduce((s, p) => s + p.avanceFisicoPct, 0) / n;
  const financiero = cartera.reduce((s, p) => s + p.avanceFinancieroPct, 0) / n;
  const presupuesto = cartera.reduce((s, p) => s + p.presupuestoUSD, 0);
  const ejecutado = cartera.reduce((s, p) => s + p.ejecutadoUSD, 0);

  return (
    <section aria-label="Resumen de la cartera" className="grid grid-cols-2 gap-3 md:grid-cols-5">
      <Cifra
        destacada
        etiqueta="Riesgo alto"
        valor={alto}
        nota={`de ${n} proyectos · ${pct.format(alto / n)}`}
        activa={riesgo === "alto"}
        onClick={onRiesgoAlto}
        accion="Ver solo los de riesgo alto"
      />
      <Cifra etiqueta="Atraso > 30 días" valor={atraso} nota={`de ${n} proyectos`} activa={foco === "atraso"} onClick={() => onFoco("atraso")} accion="Ver solo los atrasados más de 30 días" />
      <Cifra etiqueta="Sobrecosto > 10 %" valor={sobrecosto} nota={`de ${n} proyectos`} activa={foco === "sobrecosto"} onClick={() => onFoco("sobrecosto")} accion="Ver solo los de sobrecosto mayor a 10 %" />
      <Cifra
        etiqueta="Avance físico medio"
        valor={`${Math.round(fisico)} %`}
        nota={`financiero ${Math.round(financiero)} % (${financiero - fisico >= 0 ? "+" : "−"}${Math.abs(Math.round(financiero - fisico))} pts)`}
      />
      <Cifra
        etiqueta="Presupuesto ejecutado"
        valor={pct.format(ejecutado / presupuesto)}
        nota={`${formatoUSD(ejecutado)} de ${formatoUSD(presupuesto)}`}
        barra={ejecutado / presupuesto}
      />
    </section>
  );
}

interface CifraProps {
  etiqueta: string;
  valor: number | string;
  nota: string;
  destacada?: boolean;
  activa?: boolean;
  onClick?: () => void;
  accion?: string;
  barra?: number;
  className?: string;
}

function Cifra({ etiqueta, valor, nota, destacada, activa, onClick, accion, barra, className }: CifraProps) {
  const contenido = (
    <>
      <span className={cn("block text-xs font-medium", destacada ? "text-crit-ink" : "text-ink-2")}>{etiqueta}</span>
      <span className={cn("mt-1 block font-semibold tabular-nums", destacada ? "text-4xl" : "text-2xl")}>{valor}</span>
      <span className="mt-1 block text-xs text-ink-3">{nota}</span>
      {barra !== undefined && (
        <span className="mt-2 block h-1.5 rounded-full bg-surface-2" aria-hidden="true">
          <span className="block h-full rounded-full bg-accent" style={{ width: `${barra * 100}%` }} />
        </span>
      )}
      {onClick && <span className="mt-2 block text-xs font-medium text-accent-ink">{activa ? "Quitar filtro" : "Ver proyectos →"}</span>}
    </>
  );
  const base = cn(
    "rounded-xl border bg-surface p-3 text-left sm:p-4",
    destacada ? "col-span-2 border-crit/40 md:col-span-1" : "border-line",
    activa && "ring-2 ring-accent",
    className,
  );
  return onClick ? (
    <button type="button" onClick={onClick} aria-pressed={activa} title={accion} className={cn(base, "cursor-pointer transition-colors hover:bg-surface-2")}>
      {contenido}
    </button>
  ) : (
    <div className={base}>{contenido}</div>
  );
}

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando proyectos" className="animate-pulse space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className={cn("h-24 rounded-xl bg-surface-2", i === 0 && "col-span-2 md:col-span-1")} />
        ))}
      </div>
      <div className="h-11 rounded-lg bg-surface-2" />
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="h-16 rounded-lg bg-surface-2" />
      ))}
    </div>
  );
}
