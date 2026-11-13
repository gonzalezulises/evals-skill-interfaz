import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertCircle, FileText, RotateCw } from "lucide-react";
import { fetchFacturas, type Factura } from "@/lib/api";
import { ESTADOS, estadoInfo, type Estado } from "@/lib/facturas";
import { Resumen } from "@/components/Resumen";
import { FiltroEstado } from "@/components/FiltroEstado";
import { ListaFacturas } from "@/components/ListaFacturas";
import { DetalleFactura } from "@/components/DetalleFactura";

type Carga = { tipo: "cargando" } | { tipo: "error"; mensaje: string } | { tipo: "listo"; facturas: Factura[] };
type Filtro = Estado | "todas";
const POR_TANDA = 15;

// El filtro y la factura abierta viven en la URL: se pueden compartir y el botón «atrás» cierra el detalle.
const leerUrl = () => {
  const p = new URLSearchParams(window.location.search);
  const e = p.get("estado");
  return {
    filtro: (ESTADOS.some((x) => x.id === e) ? e : "todas") as Filtro,
    abierta: p.get("factura"),
  };
};
const escribirUrl = (cambios: Record<string, string | null>, push: boolean) => {
  const p = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(cambios)) (v ? p.set(k, v) : p.delete(k));
  const qs = p.toString();
  const url = `${window.location.pathname}${qs ? `?${qs}` : ""}`;
  if (push) history.pushState(null, "", url);
  else history.replaceState(null, "", url);
};

export default function App() {
  const [carga, setCarga] = useState<Carga>({ tipo: "cargando" });
  const [filtro, setFiltro] = useState<Filtro>(() => leerUrl().filtro);
  const [abierta, setAbierta] = useState<string | null>(() => leerUrl().abierta);
  const [mostrar, setMostrar] = useState(POR_TANDA);

  const cargar = useCallback(() => {
    setCarga({ tipo: "cargando" });
    fetchFacturas()
      .then((facturas) => setCarga({ tipo: "listo", facturas }))
      .catch((e: Error) => setCarga({ tipo: "error", mensaje: e.message }));
  }, []);
  useEffect(cargar, [cargar]);

  useEffect(() => {
    const onPop = () => {
      const u = leerUrl();
      setFiltro(u.filtro);
      setAbierta(u.abierta);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const cambiarFiltro = (f: Filtro) => {
    setFiltro(f);
    setMostrar(POR_TANDA);
    escribirUrl({ estado: f === "todas" ? null : f }, false);
  };
  const filtrarYBajar = (f: Estado) => {
    cambiarFiltro(f);
    document.getElementById("listado")?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const abrir = (numero: string) => {
    setAbierta(numero);
    escribirUrl({ factura: numero }, true);
  };
  const cerrar = useCallback(() => {
    setAbierta(null);
    escribirUrl({ factura: null }, false);
  }, []);

  const facturas = carga.tipo === "listo" ? carga.facturas : [];
  const ordenadas = useMemo(() => [...facturas].sort((a, b) => b.emision.localeCompare(a.emision)), [facturas]);
  const visibles = filtro === "todas" ? ordenadas : ordenadas.filter((f) => f.estado === filtro);
  const conteos = useMemo(
    () => facturas.reduce<Record<string, number>>((c, f) => ({ ...c, [f.estado]: (c[f.estado] ?? 0) + 1 }), {}),
    [facturas],
  );
  const facturaAbierta = facturas.find((f) => f.numero === abierta);

  return (
    <div className="min-h-svh">
      <header className="border-b border-linea bg-superficie">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <span className="grid size-9 place-items-center rounded-lg bg-marca text-sm font-bold text-white" aria-hidden="true">
            AL
          </span>
          <div className="leading-tight">
            <p className="text-sm font-semibold">Andes Logística</p>
            <p className="text-xs text-tenue">Portal de clientes</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Mis facturas</h1>
        <p className="mt-1 text-sm text-tenue">Pulsa una factura para ver sus líneas e impuestos.</p>

        {carga.tipo === "cargando" && <Esqueleto />}

        {carga.tipo === "error" && (
          <div role="alert" className="mt-6 flex flex-col items-start gap-3 rounded-2xl border border-vencida/30 bg-vencida-suave/50 p-5 sm:flex-row sm:items-center">
            <AlertCircle className="size-6 shrink-0 text-vencida" aria-hidden="true" />
            <div className="flex-1">
              <p className="font-semibold">No pudimos cargar tus facturas.</p>
              <p className="text-sm text-tenue">{carga.mensaje} Tus datos no se perdieron: vuelve a intentarlo en unos segundos.</p>
            </div>
            <button
              type="button"
              onClick={cargar}
              className="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full bg-tinta px-5 text-sm font-semibold text-white"
            >
              <RotateCw className="size-4" aria-hidden="true" /> Reintentar
            </button>
          </div>
        )}

        {carga.tipo === "listo" && facturas.length === 0 && (
          <Vacio titulo="Aún no tienes facturas" texto="Cuando Andes Logística te emita una factura, aparecerá aquí." />
        )}

        {carga.tipo === "listo" && facturas.length > 0 && (
          <>
            <div className="mt-6">
              <Resumen facturas={facturas} onFiltrar={filtrarYBajar} onAbrir={abrir} />
            </div>

            <section id="listado" aria-labelledby="listado-titulo" className="mt-8 scroll-mt-4">
              <h2 id="listado-titulo" className="sr-only">Listado de facturas</h2>
              <FiltroEstado valor={filtro} conteos={conteos} total={facturas.length} onCambiar={cambiarFiltro} />
              <p className="mt-4 mb-3 text-sm text-tenue" aria-live="polite">
                {Math.min(mostrar, visibles.length) < visibles.length && `${Math.min(mostrar, visibles.length)} de `}
                {visibles.length} {visibles.length === 1 ? "factura" : "facturas"}
                {filtro !== "todas" && ` ${estadoInfo(filtro).plural.toLowerCase()}`} · más recientes primero
              </p>
              {visibles.length ? (
                <>
                  <ListaFacturas facturas={visibles.slice(0, mostrar)} onAbrir={abrir} />
                  {visibles.length > mostrar && (
                    <div className="mt-4 flex justify-center">
                      <button
                        type="button"
                        onClick={() => setMostrar((m) => m + POR_TANDA)}
                        className="inline-flex min-h-11 cursor-pointer items-center rounded-full border border-linea bg-superficie px-5 text-sm font-semibold hover:border-tenue/50"
                      >
                        Ver {Math.min(POR_TANDA, visibles.length - mostrar)} más · quedan {visibles.length - mostrar}
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <Vacio
                  titulo={`No tienes facturas ${estadoInfo(filtro).plural.toLowerCase()}`}
                  texto="Prueba con otro estado o mira todas tus facturas."
                  accion={{ texto: "Ver todas", onClick: () => cambiarFiltro("todas") }}
                />
              )}
            </section>
          </>
        )}
      </main>

      {facturaAbierta && <DetalleFactura factura={facturaAbierta} onCerrar={cerrar} />}
    </div>
  );
}

function Esqueleto() {
  return (
    <div aria-busy="true" aria-label="Cargando facturas" className="mt-6 animate-pulse">
      <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
        <div className="h-44 rounded-2xl bg-linea" />
        <div className="h-44 rounded-2xl bg-linea/70" />
        <div className="h-44 rounded-2xl bg-linea/70" />
      </div>
      <div className="mt-8 flex gap-2">
        {Array.from({ length: 4 }, (_, i) => <div key={i} className="h-11 w-24 rounded-full bg-linea/70" />)}
      </div>
      <div className="mt-6 grid gap-3">
        {Array.from({ length: 5 }, (_, i) => <div key={i} className="h-16 rounded-2xl bg-linea/60" />)}
      </div>
      <span className="sr-only">Cargando tus facturas…</span>
    </div>
  );
}

function Vacio({ titulo, texto, accion }: { titulo: string; texto: string; accion?: { texto: string; onClick: () => void } }) {
  return (
    <div className="mt-2 flex flex-col items-center rounded-2xl border border-dashed border-linea bg-superficie px-6 py-12 text-center">
      <FileText className="size-8 text-tenue" aria-hidden="true" />
      <p className="mt-3 font-semibold">{titulo}</p>
      <p className="mt-1 max-w-sm text-sm text-tenue">{texto}</p>
      {accion && (
        <button
          type="button"
          onClick={accion.onClick}
          className="mt-4 inline-flex min-h-11 cursor-pointer items-center rounded-full border border-linea px-5 text-sm font-semibold hover:border-tenue/50"
        >
          {accion.texto}
        </button>
      )}
    </div>
  );
}
