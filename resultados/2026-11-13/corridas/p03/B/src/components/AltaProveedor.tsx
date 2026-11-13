import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, ArrowLeft, Building2, CheckCircle2, FileText, Landmark, Loader2, Paperclip, UserRound } from "lucide-react";
import { CampoSelect, CampoTexto } from "@/components/Campo";
import { CampoArchivo } from "@/components/CampoArchivo";
import {
  BANCOS,
  CAMPOS_VACIOS,
  CATEGORIAS,
  ETIQUETAS,
  ORDEN,
  enviarSolicitud,
  formatoTamano,
  validarArchivo,
  validarCampo,
  validarTodo,
  type Archivos,
  type Campos,
  type Clave,
  type Errores,
} from "@/lib/proveedor";

type Paso = "formulario" | "revision" | "enviado";

function Seccion({ icono, titulo, descripcion, children }: { icono: ReactNode; titulo: string; descripcion: string; children: ReactNode }) {
  return (
    <fieldset className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
      <legend className="sr-only">{titulo}</legend>
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent" aria-hidden="true">
          {icono}
        </span>
        <div>
          <h2 className="text-base font-semibold text-ink">{titulo}</h2>
          <p className="text-sm text-muted">{descripcion}</p>
        </div>
      </div>
      {children}
    </fieldset>
  );
}

const btnPrimario =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-accent px-5 text-sm font-semibold text-white hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto";
const btnSecundario =
  "inline-flex min-h-11 w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-line-strong bg-surface px-5 text-sm font-semibold text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent sm:w-auto";

export function AltaProveedor() {
  const [campos, setCampos] = useState<Campos>(CAMPOS_VACIOS);
  const [archivos, setArchivos] = useState<Archivos>({ avisoOperacion: null, certificadoBancario: null });
  const [errores, setErrores] = useState<Errores>({});
  const [tocados, setTocados] = useState<Partial<Record<Clave, boolean>>>({});
  const [paso, setPaso] = useState<Paso>("formulario");
  const [enviando, setEnviando] = useState(false);
  const [errorEnvio, setErrorEnvio] = useState<string | null>(null);
  const [folio, setFolio] = useState("");
  const [mostrarResumen, setMostrarResumen] = useState(false);

  const resumenRef = useRef<HTMLDivElement>(null);
  const tituloPasoRef = useRef<HTMLHeadingElement>(null);

  // Al cambiar de paso, el foco va al título de la nueva vista (lector de pantalla y teclado).
  useEffect(() => {
    if (paso !== "formulario") {
      window.scrollTo({ top: 0 });
      tituloPasoRef.current?.focus();
    }
  }, [paso]);

  const cambiar = (clave: keyof Campos, valor: string) => {
    setCampos((c) => ({ ...c, [clave]: valor }));
    // Si el campo ya mostró un error, se revalida mientras se corrige.
    if (tocados[clave] || errores[clave]) setErrores((e) => ({ ...e, [clave]: validarCampo(clave, valor) }));
  };

  const salir = (clave: keyof Campos) => {
    setTocados((t) => ({ ...t, [clave]: true }));
    setErrores((e) => ({ ...e, [clave]: validarCampo(clave, campos[clave]) }));
  };

  const cambiarArchivo = (clave: keyof Archivos, archivo: File | null) => {
    setArchivos((a) => ({ ...a, [clave]: archivo }));
    setTocados((t) => ({ ...t, [clave]: true }));
    setErrores((e) => ({ ...e, [clave]: validarArchivo(archivo, ETIQUETAS[clave]) }));
  };

  const listaErrores = ORDEN.filter((c) => errores[c]);

  const enfocar = (clave: Clave) => {
    const el = document.getElementById(clave in archivos ? `${clave}-accion` : clave);
    el?.scrollIntoView({ block: "center" });
    el?.focus({ preventScroll: true });
  };

  const revisar = (e: FormEvent) => {
    e.preventDefault();
    const nuevos = validarTodo(campos, archivos);
    setErrores(nuevos);
    setTocados(Object.fromEntries(ORDEN.map((c) => [c, true])));
    if (Object.keys(nuevos).length > 0) {
      setMostrarResumen(true);
      requestAnimationFrame(() => {
        resumenRef.current?.scrollIntoView({ block: "start" });
        resumenRef.current?.focus({ preventScroll: true });
      });
      return;
    }
    setMostrarResumen(false);
    setErrorEnvio(null);
    setPaso("revision");
  };

  const confirmar = async () => {
    setEnviando(true);
    setErrorEnvio(null);
    try {
      const r = await enviarSolicitud(campos, archivos);
      setFolio(r.folio);
      setPaso("enviado");
    } catch {
      setErrorEnvio("No pudimos enviar la solicitud. Revisa tu conexión e inténtalo de nuevo; tus datos siguen aquí.");
    } finally {
      setEnviando(false);
    }
  };

  const reiniciar = () => {
    setCampos(CAMPOS_VACIOS);
    setArchivos({ avisoOperacion: null, certificadoBancario: null });
    setErrores({});
    setTocados({});
    setFolio("");
    setPaso("formulario");
    window.scrollTo({ top: 0 });
  };

  const p = (clave: keyof Campos) => ({
    name: clave,
    label: ETIQUETAS[clave],
    value: campos[clave],
    error: tocados[clave] ? errores[clave] : undefined,
    onBlur: () => salir(clave),
  });

  if (paso === "enviado") {
    return (
      <section className="rounded-xl border border-line bg-surface p-6 text-center shadow-sm sm:p-10" aria-live="polite">
        <CheckCircle2 className="mx-auto size-12 text-success" aria-hidden="true" />
        <h2 ref={tituloPasoRef} tabIndex={-1} className="mt-4 text-xl font-semibold text-ink outline-none sm:text-2xl">
          Solicitud enviada
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-muted">
          Registramos el alta de <strong className="text-ink">{campos.razonSocial.trim().replace(/\.$/, "")}</strong>. Compras revisará los documentos y
          escribirá a <strong className="text-ink">{campos.correo}</strong> cuando el proveedor quede habilitado.
        </p>
        <div className="mx-auto mt-6 inline-block rounded-lg border border-line bg-surface-2 px-5 py-3">
          <p className="text-xs uppercase tracking-wide text-muted">Número de solicitud</p>
          <p className="font-mono text-lg font-semibold text-ink">{folio}</p>
        </div>
        <div className="mt-8">
          <button type="button" onClick={reiniciar} className={btnPrimario}>
            Registrar otro proveedor
          </button>
        </div>
      </section>
    );
  }

  if (paso === "revision") {
    const filas: [string, string][] = [
      ["Razón social", campos.razonSocial],
      ["RUC", `${campos.ruc} DV ${campos.dv}`],
      ["Categoría", campos.categoria],
      ["Persona de contacto", campos.contacto],
      ["Correo", campos.correo],
      ["Teléfono", campos.telefono],
      ["Banco", campos.banco],
      ["Número de cuenta", campos.cuenta],
    ];
    return (
      <section className="rounded-xl border border-line bg-surface p-4 shadow-sm sm:p-6">
        <h2 ref={tituloPasoRef} tabIndex={-1} className="text-xl font-semibold text-ink outline-none">
          Revisa antes de enviar
        </h2>
        <p className="mt-1 text-sm text-muted">Confirma que los datos coinciden con el aviso de operación y el certificado bancario.</p>

        <dl className="mt-5 divide-y divide-line rounded-lg border border-line">
          {filas.map(([k, v]) => (
            <div key={k} className="grid gap-0.5 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="break-words text-sm font-medium text-ink">{v}</dd>
            </div>
          ))}
          {(Object.keys(archivos) as (keyof Archivos)[]).map((k) => (
            <div key={k} className="grid gap-0.5 px-4 py-3 sm:grid-cols-[12rem_1fr] sm:gap-4">
              <dt className="text-sm text-muted">{ETIQUETAS[k]}</dt>
              <dd className="flex min-w-0 items-center gap-2 text-sm font-medium text-ink">
                <FileText className="size-4 shrink-0 text-accent" aria-hidden="true" />
                <span className="truncate">{archivos[k]?.name}</span>
                <span className="shrink-0 font-normal text-muted">{archivos[k] && formatoTamano(archivos[k]!.size)}</span>
              </dd>
            </div>
          ))}
        </dl>

        {errorEnvio && (
          <div role="alert" className="mt-4 flex items-start gap-2 rounded-lg border border-danger/40 bg-danger-soft p-3 text-sm text-danger">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            {errorEnvio}
          </div>
        )}

        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={() => setPaso("formulario")} disabled={enviando} className={btnSecundario}>
            <ArrowLeft className="size-4" aria-hidden="true" />
            Corregir datos
          </button>
          <button type="button" onClick={confirmar} disabled={enviando} aria-busy={enviando} className={btnPrimario}>
            {enviando ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Enviando…
              </>
            ) : (
              "Confirmar y enviar"
            )}
          </button>
        </div>
        <p className="sr-only" aria-live="polite">
          {enviando ? "Enviando solicitud" : ""}
        </p>
      </section>
    );
  }

  return (
    <form noValidate onSubmit={revisar} className="space-y-5">
      <p className="text-sm text-muted">
        Todos los campos son obligatorios <span className="text-danger" aria-hidden="true">*</span>
      </p>

      {mostrarResumen && listaErrores.length > 0 && (
        <div
          ref={resumenRef}
          tabIndex={-1}
          role="alert"
          className="scroll-mt-4 rounded-xl border border-danger/40 bg-danger-soft p-4 outline-none focus-visible:ring-3 focus-visible:ring-danger/30"
        >
          <p className="flex items-center gap-2 text-sm font-semibold text-danger">
            <AlertTriangle className="size-4" aria-hidden="true" />
            {listaErrores.length === 1 ? "Falta corregir 1 campo" : `Faltan corregir ${listaErrores.length} campos`}
          </p>
          <ul className="mt-2 space-y-1 pl-6 text-sm">
            {listaErrores.map((c) => (
              <li key={c} className="list-disc text-danger">
                <a
                  href={`#${c}`}
                  onClick={(e) => {
                    e.preventDefault();
                    enfocar(c);
                  }}
                  className="cursor-pointer underline underline-offset-2 hover:no-underline focus-visible:outline-2 focus-visible:outline-accent"
                >
                  {ETIQUETAS[c]}
                </a>
                : {errores[c]}
              </li>
            ))}
          </ul>
        </div>
      )}

      <Seccion icono={<Building2 className="size-5" />} titulo="Empresa" descripcion="Datos tal como figuran en el aviso de operación.">
        <div className="grid gap-4 sm:grid-cols-6">
          <CampoTexto
            {...p("razonSocial")}
            className="sm:col-span-6"
            autoComplete="organization"
            placeholder="Ej.: Transportes del Istmo, S.A."
            onChange={(e) => cambiar("razonSocial", e.target.value)}
          />
          <CampoTexto
            {...p("ruc")}
            className="sm:col-span-4"
            ayuda="Con guiones, por ejemplo 155612345-2-2015."
            autoComplete="off"
            spellCheck={false}
            placeholder="Ej.: 155612345-2-2015"
            onChange={(e) => cambiar("ruc", e.target.value.toUpperCase())}
          />
          <CampoTexto
            {...p("dv")}
            className="sm:col-span-2"
            ayuda="Dígito verificador."
            inputMode="numeric"
            maxLength={2}
            autoComplete="off"
            placeholder="Ej.: 54"
            onChange={(e) => cambiar("dv", e.target.value)}
          />
          <CampoSelect
            {...p("categoria")}
            className="sm:col-span-6"
            opciones={CATEGORIAS}
            onChange={(e) => cambiar("categoria", e.target.value)}
          />
        </div>
      </Seccion>

      <Seccion icono={<UserRound className="size-5" />} titulo="Contacto" descripcion="Quien atenderá órdenes de compra y pagos.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto
            {...p("contacto")}
            className="sm:col-span-2"
            autoComplete="name"
            placeholder="Ej.: María Rodríguez"
            onChange={(e) => cambiar("contacto", e.target.value)}
          />
          <CampoTexto
            {...p("correo")}
            type="email"
            inputMode="email"
            autoComplete="email"
            spellCheck={false}
            placeholder="Ej.: compras@proveedor.com"
            onChange={(e) => cambiar("correo", e.target.value)}
          />
          <CampoTexto
            {...p("telefono")}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            ayuda="Celular de 8 dígitos o fijo de 7."
            placeholder="Ej.: 6123-4567"
            onChange={(e) => cambiar("telefono", e.target.value)}
          />
        </div>
      </Seccion>

      <Seccion icono={<Landmark className="size-5" />} titulo="Datos bancarios" descripcion="Cuenta a nombre de la razón social, donde recibirá los pagos.">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoSelect {...p("banco")} opciones={BANCOS} onChange={(e) => cambiar("banco", e.target.value)} />
          <CampoTexto
            {...p("cuenta")}
            inputMode="numeric"
            autoComplete="off"
            ayuda="Solo dígitos, sin espacios."
            placeholder="Ej.: 0401012345678"
            onChange={(e) => cambiar("cuenta", e.target.value)}
          />
        </div>
      </Seccion>

      <Seccion icono={<Paperclip className="size-5" />} titulo="Documentos" descripcion="Copias legibles y vigentes.">
        <div className="grid gap-5">
          <CampoArchivo
            name="avisoOperacion"
            label={ETIQUETAS.avisoOperacion}
            ayuda="Emitido por el MICI a nombre de la razón social."
            archivo={archivos.avisoOperacion}
            error={tocados.avisoOperacion ? errores.avisoOperacion : undefined}
            onChange={(f) => cambiarArchivo("avisoOperacion", f)}
          />
          <CampoArchivo
            name="certificadoBancario"
            label={ETIQUETAS.certificadoBancario}
            ayuda="Con el número de cuenta indicado arriba."
            archivo={archivos.certificadoBancario}
            error={tocados.certificadoBancario ? errores.certificadoBancario : undefined}
            onChange={(f) => cambiarArchivo("certificadoBancario", f)}
          />
        </div>
      </Seccion>

      <div className="flex flex-col gap-3 pt-1 sm:flex-row sm:items-center sm:justify-end">
        <button type="submit" className={btnPrimario}>
          Revisar y enviar
        </button>
      </div>
    </form>
  );
}
