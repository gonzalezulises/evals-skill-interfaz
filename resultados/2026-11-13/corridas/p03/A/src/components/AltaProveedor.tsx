import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { AlertTriangle, Building2, CheckCircle2, Circle, CreditCard, FileCheck2, Loader2, RotateCcw, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { Field, Input, Select, describedBy } from "@/components/ui/field";
import { FileField } from "@/components/FileField";
import {
  BANCOS, CATEGORIAS, ORDEN_CAMPOS, VACIO, enviarSolicitud, formatoBytes, posibleDuplicado,
  validarCampo, validarTodo, type Campo, type Errores, type Valores,
} from "@/lib/proveedor";

type Estado =
  | { tipo: "editando" }
  | { tipo: "enviando" }
  | { tipo: "error"; mensaje: string }
  | { tipo: "enviado"; folio: string; fecha: Date; datos: Valores };

const SECCIONES: { id: string; titulo: string; icono: typeof Building2; campos: Campo[] }[] = [
  { id: "empresa", titulo: "Empresa", icono: Building2, campos: ["razonSocial", "ruc", "dv", "categoria"] },
  { id: "contacto", titulo: "Contacto", icono: UserRound, campos: ["contacto", "correo", "telefono"] },
  { id: "banco", titulo: "Datos bancarios", icono: CreditCard, campos: ["banco", "tipoCuenta", "numeroCuenta"] },
  { id: "documentos", titulo: "Documentos", icono: FileCheck2, campos: ["avisoOperacion", "certificadoBancario"] },
];

const ETIQUETAS: Record<Campo, string> = {
  razonSocial: "Razón social", ruc: "RUC", dv: "DV", categoria: "Categoría",
  contacto: "Persona de contacto", correo: "Correo", telefono: "Teléfono",
  banco: "Banco", tipoCuenta: "Tipo de cuenta", numeroCuenta: "Número de cuenta",
  avisoOperacion: "Aviso de operación", certificadoBancario: "Certificado bancario",
};

export function AltaProveedor() {
  const [v, setV] = useState<Valores>(VACIO);
  const [tocados, setTocados] = useState<Partial<Record<Campo, boolean>>>({});
  const [errores, setErrores] = useState<Errores>({});
  const [intentos, setIntentos] = useState(0);
  const [estado, setEstado] = useState<Estado>({ tipo: "editando" });
  const resumenRef = useRef<HTMLDivElement>(null);
  const exitoRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => { if (estado.tipo === "enviado") exitoRef.current?.focus(); }, [estado.tipo]);
  // Tras un envío con errores, el foco va al resumen para que el lector de pantalla lo anuncie.
  useEffect(() => { if (intentos > 0) resumenRef.current?.focus(); }, [intentos]);

  const visible = (c: Campo) => (tocados[c] || intentos > 0 ? errores[c] : undefined);

  function cambiar<K extends Campo>(c: K, valor: Valores[K]) {
    const next = { ...v, [c]: valor };
    setV(next);
    // Un campo ya marcado se revalida al escribir; uno nuevo espera al blur. Los archivos, al elegirlos.
    if (tocados[c] || intentos > 0 || c === "avisoOperacion" || c === "certificadoBancario" || c === "banco" || c === "categoria" || c === "tipoCuenta") {
      setErrores((e) => ({ ...e, [c]: validarCampo(c, next) }));
      if (c === "avisoOperacion" || c === "certificadoBancario") setTocados((t) => ({ ...t, [c]: true }));
    }
    if (estado.tipo === "error") setEstado({ tipo: "editando" });
  }

  function salir(c: Campo) {
    setTocados((t) => ({ ...t, [c]: true }));
    setErrores((e) => ({ ...e, [c]: validarCampo(c, v) }));
  }

  async function enviar(ev: FormEvent) {
    ev.preventDefault();
    if (estado.tipo === "enviando") return;
    const e = validarTodo(v);
    setErrores(e);
    setIntentos((n) => n + 1);
    const primero = ORDEN_CAMPOS.find((c) => e[c]);
    if (primero) return;
    setEstado({ tipo: "enviando" });
    try {
      const r = await enviarSolicitud(v);
      setEstado({ tipo: "enviado", ...r, datos: v });
    } catch (err) {
      setEstado({ tipo: "error", mensaje: err instanceof Error ? err.message : "Error desconocido." });
    }
  }

  function reiniciar() {
    setV(VACIO); setTocados({}); setErrores({}); setIntentos(0); setEstado({ tipo: "editando" });
    window.scrollTo({ top: 0 });
  }

  if (estado.tipo === "enviado") return <Confirmacion estado={estado} onNuevo={reiniciar} headingRef={exitoRef} />;

  const pendientes = ORDEN_CAMPOS.filter((c) => errores[c]);
  const completa = (s: (typeof SECCIONES)[number]) => s.campos.every((c) => !validarCampo(c, v));
  const listas = SECCIONES.filter(completa).length;
  const enviando = estado.tipo === "enviando";
  const duplicado = posibleDuplicado(v.razonSocial)
    ? "Ya existe un proveedor con este nombre en órdenes de compra. Revisa que no sea un duplicado antes de enviar."
    : undefined;

  const p = (c: Campo, conAyuda: boolean, aviso?: string) => ({
    id: c,
    name: c,
    invalid: !!visible(c),
    onBlur: () => salir(c),
    "aria-describedby": describedBy(c, { help: conAyuda, error: visible(c), warning: aviso }),
  });

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 pt-6 pb-28 sm:px-6 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-10 lg:pb-12">
      {/* Índice de secciones con su estado (escritorio) */}
      <nav aria-label="Secciones del formulario" className="hidden lg:block">
        <div className="sticky top-6">
        <ol className="flex flex-col gap-1">
          {SECCIONES.map((s, i) => {
            const ok = completa(s);
            const conError = s.campos.some((c) => visible(c));
            return (
              <li key={s.id}>
                <a href={`#sec-${s.id}`} className="flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-ink hover:bg-surface">
                  {ok ? <CheckCircle2 aria-hidden className="size-5 text-success" />
                    : conError ? <AlertTriangle aria-hidden className="size-5 text-danger" />
                    : <Circle aria-hidden className="size-5 text-line-strong" />}
                  <span>{i + 1}. {s.titulo}</span>
                  <span className="sr-only">{ok ? "(completa)" : conError ? "(con errores)" : "(pendiente)"}</span>
                </a>
              </li>
            );
          })}
        </ol>
        <p className="mt-4 px-3 text-sm text-muted">{listas} de {SECCIONES.length} secciones completas</p>
        </div>
      </nav>

      <form noValidate onSubmit={enviar} aria-busy={enviando} className="flex min-w-0 flex-col gap-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-primary">Compras · Proveedores</p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink sm:text-3xl">Alta de proveedor</h1>
          <p className="max-w-prose text-base text-muted">
            Todos los campos son obligatorios. Compras revisa la solicitud antes de habilitar pagos al proveedor.
          </p>
        </header>

        {intentos > 0 && pendientes.length > 0 ? (
          <div ref={resumenRef} tabIndex={-1} role="alert" className="rounded-xl border border-danger/40 bg-danger-soft p-4">
            <p className="flex items-center gap-2 font-semibold text-danger">
              <AlertTriangle aria-hidden className="size-5" />
              {pendientes.length === 1 ? "Falta corregir 1 campo" : `Faltan corregir ${pendientes.length} campos`}
            </p>
            <ul className="mt-2 flex flex-wrap gap-x-1 gap-y-1">
              {pendientes.map((c) => (
                <li key={c}>
                  <a
                    href={`#${c}`}
                    onClick={(e) => { e.preventDefault(); const el = document.getElementById(c); ((el as HTMLInputElement | null)?.type === "file" ? el?.parentElement?.querySelector("button") : el)?.focus(); el?.closest("section")?.scrollIntoView({ block: "start" }); }}
                    className="inline-flex min-h-11 items-center rounded-md px-2 text-sm font-medium text-danger underline underline-offset-2 hover:bg-surface"
                  >
                    {ETIQUETAS[c]}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <Seccion id="sec-empresa" n={1} titulo="Empresa" icono={Building2}>
          <Field id="razonSocial" label="Razón social" className="sm:col-span-2" help="Tal como aparece en el aviso de operación." error={visible("razonSocial")} warning={duplicado}>
            <Input {...p("razonSocial", true, duplicado)} autoComplete="organization" value={v.razonSocial} onChange={(e) => cambiar("razonSocial", e.target.value)} placeholder="Transportes del Istmo, S.A." />
          </Field>
          <div className="grid grid-cols-[minmax(0,1fr)_5.5rem] gap-3 sm:col-span-2 sm:grid-cols-[minmax(0,1fr)_7rem]">
            <Field id="ruc" label="RUC" help="Con guiones, p. ej. 155712345-2-2021." error={visible("ruc")}>
              <Input {...p("ruc", true)} value={v.ruc} onChange={(e) => cambiar("ruc", e.target.value)} placeholder="155712345-2-2021" autoCapitalize="characters" spellCheck={false} />
            </Field>
            <Field id="dv" label="DV" help="Dígito verificador." error={visible("dv")}>
              <Input {...p("dv", true)} value={v.dv} inputMode="numeric" maxLength={2} onChange={(e) => cambiar("dv", e.target.value.replace(/\D/g, ""))} placeholder="45" />
            </Field>
          </div>
          <Field id="categoria" label="Categoría del proveedor" className="sm:col-span-2" help="Define qué centros de costo pueden emitirle órdenes." error={visible("categoria")}>
            <Select {...p("categoria", true)} value={v.categoria} onChange={(e) => cambiar("categoria", e.target.value)} placeholder="Elige una categoría" options={CATEGORIAS} />
          </Field>
        </Seccion>

        <Seccion id="sec-contacto" n={2} titulo="Contacto" icono={UserRound}>
          <Field id="contacto" label="Persona de contacto" className="sm:col-span-2" help="Quien atiende órdenes y cobros." error={visible("contacto")}>
            <Input {...p("contacto", true)} autoComplete="name" value={v.contacto} onChange={(e) => cambiar("contacto", e.target.value)} placeholder="Ana Rodríguez" />
          </Field>
          <Field id="correo" label="Correo" help="Aquí llegará la confirmación." error={visible("correo")}>
            <Input {...p("correo", true)} type="email" autoComplete="email" inputMode="email" spellCheck={false} value={v.correo} onChange={(e) => cambiar("correo", e.target.value)} placeholder="ana@empresa.com" />
          </Field>
          <Field id="telefono" label="Teléfono" help="Fijo de 7 dígitos o celular de 8." error={visible("telefono")}>
            <Input {...p("telefono", true)} type="tel" autoComplete="tel" inputMode="tel" value={v.telefono} onChange={(e) => cambiar("telefono", e.target.value)} placeholder="6123-4567" />
          </Field>
        </Seccion>

        <Seccion id="sec-banco" n={3} titulo="Datos bancarios" icono={CreditCard} nota="La cuenta debe estar a nombre de la razón social.">
          <Field id="banco" label="Banco" error={visible("banco")}>
            <Select {...p("banco", false)} value={v.banco} onChange={(e) => cambiar("banco", e.target.value)} placeholder="Elige el banco" options={BANCOS} />
          </Field>
          <fieldset className="flex flex-col gap-1.5" aria-describedby={visible("tipoCuenta") ? "tipoCuenta-error" : undefined}>
            <legend className="mb-1.5 text-sm font-medium text-ink">Tipo de cuenta</legend>
            <div className="grid grid-cols-2 gap-2">
              {(["corriente", "ahorros"] as const).map((t, i) => (
                <label
                  key={t}
                  className={cn(
                    "flex h-11 cursor-pointer items-center gap-2 rounded-lg border px-3 text-base has-[:checked]:border-primary has-[:checked]:bg-primary-soft has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/30",
                    visible("tipoCuenta") ? "border-danger" : "border-line-strong",
                  )}
                >
                  <input
                    type="radio"
                    name="tipoCuenta"
                    id={i === 0 ? "tipoCuenta" : undefined}
                    value={t}
                    checked={v.tipoCuenta === t}
                    onChange={() => cambiar("tipoCuenta", t)}
                    className="size-4 accent-primary focus-visible:outline-none"
                  />
                  {t === "corriente" ? "Corriente" : "Ahorros"}
                </label>
              ))}
            </div>
            {visible("tipoCuenta") ? (
              <p id="tipoCuenta-error" className="text-sm font-medium text-danger">{visible("tipoCuenta")}</p>
            ) : null}
          </fieldset>
          <Field id="numeroCuenta" label="Número de cuenta" className="sm:col-span-2" help="Solo dígitos; puedes pegarlo con guiones." error={visible("numeroCuenta")}>
            <Input {...p("numeroCuenta", true)} inputMode="numeric" spellCheck={false} value={v.numeroCuenta} onChange={(e) => cambiar("numeroCuenta", e.target.value)} placeholder="04-01-01-123456-7" />
          </Field>
        </Seccion>

        <Seccion id="sec-documentos" n={4} titulo="Documentos" icono={FileCheck2} nota="PDF, JPG o PNG de hasta 5 MB cada uno.">
          <FileField
            id="avisoOperacion"
            label="Aviso de operación"
            help="Vigente, emitido por el MICI."
            file={v.avisoOperacion}
            error={visible("avisoOperacion")}
            onChange={(f) => cambiar("avisoOperacion", f)}
            onBlur={() => salir("avisoOperacion")}
          />
          <FileField
            id="certificadoBancario"
            label="Certificado bancario"
            help="Emitido en los últimos 90 días."
            file={v.certificadoBancario}
            error={visible("certificadoBancario")}
            onChange={(f) => cambiar("certificadoBancario", f)}
            onBlur={() => salir("certificadoBancario")}
          />
        </Seccion>

        {estado.tipo === "error" ? (
          <div role="alert" className="flex flex-col gap-3 rounded-xl border border-danger/40 bg-danger-soft p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-danger">No se pudo enviar la solicitud</p>
              <p className="text-sm text-ink">{estado.mensaje} Tus datos siguen aquí; vuelve a intentarlo cuando tengas conexión.</p>
            </div>
          </div>
        ) : null}

        {/* Barra de envío: fija abajo en móvil, al final del formulario en escritorio */}
        <div className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur lg:static lg:rounded-xl lg:border lg:px-5">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
            <p className="text-sm text-muted" aria-live="polite">
              {enviando ? "Enviando solicitud…" : `${listas} de ${SECCIONES.length} secciones completas`}
            </p>
            <button
              type="submit"
              disabled={enviando}
              className="inline-flex h-11 shrink-0 items-center gap-2 rounded-lg bg-primary px-5 text-base font-semibold text-white hover:bg-primary-hover disabled:cursor-wait disabled:opacity-80"
            >
              {enviando ? <Loader2 aria-hidden className="size-5 animate-spin" /> : estado.tipo === "error" ? <RotateCcw aria-hidden className="size-5" /> : null}
              {enviando ? "Enviando…" : estado.tipo === "error" ? "Reintentar envío" : "Enviar solicitud"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Seccion({ id, n, titulo, icono: Icono, nota, children }: {
  id: string; n: number; titulo: string; icono: typeof Building2; nota?: string; children: ReactNode;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-h`} className="scroll-mt-6 rounded-xl border border-line bg-surface p-4 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span aria-hidden className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary-soft text-primary">
          <Icono className="size-5" />
        </span>
        <div>
          <h2 id={`${id}-h`} className="text-lg font-semibold text-ink">
            <span className="text-muted">{n}.</span> {titulo}
          </h2>
          {nota ? <p className="text-sm text-muted">{nota}</p> : null}
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Confirmacion({ estado, onNuevo, headingRef }: {
  estado: Extract<Estado, { tipo: "enviado" }>;
  onNuevo: () => void;
  headingRef: React.RefObject<HTMLHeadingElement | null>;
}) {
  const d = estado.datos;
  const filas: [string, string][] = [
    ["Razón social", d.razonSocial.trim()],
    ["RUC", `${d.ruc.trim().toUpperCase()} DV ${d.dv}`],
    ["Categoría", d.categoria],
    ["Contacto", `${d.contacto.trim()} · ${d.correo.trim()}`],
    ["Cuenta", `${d.banco} · ${d.tipoCuenta === "corriente" ? "Corriente" : "Ahorros"} terminada en ${d.numeroCuenta.replace(/\D/g, "").slice(-4)}`],
    ["Documentos", [d.avisoOperacion, d.certificadoBancario].map((f) => `${f!.name} (${formatoBytes(f!.size)})`).join(", ")],
  ];
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <div className="rounded-xl border border-line bg-surface p-6 sm:p-8">
        <span aria-hidden className="grid size-12 place-items-center rounded-full bg-success-soft text-success">
          <CheckCircle2 className="size-7" />
        </span>
        <h1 ref={headingRef} tabIndex={-1} className="mt-4 text-2xl font-semibold text-ink focus:outline-none">Solicitud enviada</h1>
        <p className="mt-2 text-base text-muted">
          Compras revisará los documentos y avisará a <strong className="font-medium text-ink">{d.correo.trim()}</strong> cuando el proveedor quede habilitado.
        </p>
        <p className="mt-5 rounded-lg bg-canvas px-4 py-3 text-base">
          Folio <strong className="font-mono font-semibold">{estado.folio}</strong>
          <span className="text-muted"> · {estado.fecha.toLocaleString("es-PA", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit" })}</span>
        </p>
        <dl className="mt-6 divide-y divide-line border-y border-line">
          {filas.map(([k, val]) => (
            <div key={k} className="grid gap-1 py-3 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-4">
              <dt className="text-sm text-muted">{k}</dt>
              <dd className="text-sm break-words text-ink">{val}</dd>
            </div>
          ))}
        </dl>
        <button
          type="button"
          onClick={onNuevo}
          className="mt-6 inline-flex h-11 items-center rounded-lg border border-line-strong px-5 text-base font-medium text-ink hover:bg-canvas"
        >
          Registrar otro proveedor
        </button>
      </div>
    </div>
  );
}
