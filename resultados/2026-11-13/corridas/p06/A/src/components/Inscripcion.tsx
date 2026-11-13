import { useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/*
 * Formulario adaptado del patrón "Multi-Field Form" de 21st (cnippet-dev/v-field-17, id 25085):
 * etiqueta visible, ayuda inline, error en el campo y un único botón principal con estado de carga.
 * Reimplementado con elementos nativos para no sumar Radix ni react-hook-form.
 */

type Campos = { nombre: string; correo: string; empresa: string; telefono: string; personas: string };
type Errores = Partial<Record<keyof Campos, string>>;
type Estado = "editando" | "enviando" | "enviado" | "error";

const VACIO: Campos = { nombre: "", correo: "", empresa: "", telefono: "", personas: "1" };

function validar(c: Campos, disponibles: number): Errores {
  const e: Errores = {};
  if (c.nombre.trim().length < 3) e.nombre = "Escribe tu nombre y apellido.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo.trim())) e.correo = "Escribe un correo válido, por ejemplo nombre@empresa.com.";
  if (!c.empresa.trim()) e.empresa = "Indica la empresa u organización.";
  if (c.telefono && !/^[+\d][\d\s-]{6,}$/.test(c.telefono.trim())) e.telefono = "Usa solo números, espacios o guiones.";
  const n = Number(c.personas);
  if (!Number.isInteger(n) || n < 1) e.personas = "Indica al menos 1 persona.";
  else if (n > disponibles) e.personas = `Solo quedan ${disponibles} lugares.`;
  return e;
}

export function Inscripcion({ precio, precioGrupo, disponibles, fechas }: {
  precio: number; precioGrupo: number; disponibles: number; fechas: string;
}) {
  const [c, setC] = useState<Campos>(VACIO);
  const [tocado, setTocado] = useState<Partial<Record<keyof Campos, boolean>>>({});
  const [estado, setEstado] = useState<Estado>("editando");

  const errores = validar(c, disponibles);
  const n = Math.max(Number(c.personas) || 1, 1);
  const unitario = n >= 2 ? precioGrupo : precio;
  const total = unitario * n;

  const set = (k: keyof Campos) => (v: string) => setC((p) => ({ ...p, [k]: v }));
  const tocar = (k: keyof Campos) => () => setTocado((p) => ({ ...p, [k]: true }));
  const err = (k: keyof Campos) => (tocado[k] ? errores[k] : undefined);

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    setTocado({ nombre: true, correo: true, empresa: true, telefono: true, personas: true });
    if (Object.keys(errores).length) {
      const primero = Object.keys(errores)[0];
      document.getElementById(`f-${primero}`)?.focus();
      return;
    }
    setEstado("enviando");
    try {
      // Sin backend en este proyecto: se simula el envío. Conectar aquí el endpoint real.
      await new Promise((r) => setTimeout(r, 900));
      setEstado("enviado");
    } catch {
      setEstado("error");
    }
  }

  return (
    <section id="inscripcion" aria-labelledby="inscripcion-t" className="border-t border-line bg-brand-soft/60">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1fr_1.3fr]">
        <div>
          <h2 id="inscripcion-t" className="text-2xl font-bold tracking-tight sm:text-3xl">Inscríbete</h2>
          <p className="mt-3 text-muted">
            Reserva tu lugar para el {fechas}. Te enviaremos por correo la confirmación y los datos para el pago;
            puedes pagar por transferencia hasta 5 días antes del inicio.
          </p>
          <p className="mt-6 text-sm font-medium text-brand-strong">
            {disponibles > 0 ? `Quedan ${disponibles} lugares.` : "El cupo está completo."}
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm sm:p-8">
          {disponibles === 0 ? (
            <Aviso tipo="info" titulo="Cupo completo">
              Ya no quedan lugares para esta edición. Escríbenos para avisarte cuando abramos la próxima.
            </Aviso>
          ) : estado === "enviado" ? (
            <div role="status" className="text-center">
              <CheckCircle2 aria-hidden className="mx-auto h-12 w-12 text-ok" />
              <h3 className="mt-4 text-xl font-semibold">¡Solicitud recibida!</h3>
              <p className="mt-2 text-muted">
                Reservamos {n === 1 ? "1 lugar" : `${n} lugares`} a nombre de {c.nombre.trim()}. En breve llegará a{" "}
                <strong className="text-ink">{c.correo.trim()}</strong> la confirmación con los datos de pago.
              </p>
              <button
                type="button"
                onClick={() => { setC(VACIO); setTocado({}); setEstado("editando"); }}
                className="mt-6 inline-flex min-h-11 items-center rounded-lg border border-line px-5 text-sm font-medium hover:border-brand"
              >
                Inscribir a otra persona
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={enviar} className="flex flex-col gap-5">
              {estado === "error" && (
                <Aviso tipo="error" titulo="No pudimos enviar tu inscripción">
                  Revisa tu conexión y vuelve a intentarlo. Tus datos siguen en el formulario.
                </Aviso>
              )}
              <Campo id="nombre" label="Nombre completo" requerido valor={c.nombre} onChange={set("nombre")} onBlur={tocar("nombre")}
                error={err("nombre")} autoComplete="name" />
              <Campo id="correo" label="Correo electrónico" requerido tipo="email" valor={c.correo} onChange={set("correo")}
                onBlur={tocar("correo")} error={err("correo")} autoComplete="email" ayuda="Aquí te llega la confirmación." />
              <div className="grid gap-5 sm:grid-cols-2">
                <Campo id="empresa" label="Empresa" requerido valor={c.empresa} onChange={set("empresa")} onBlur={tocar("empresa")}
                  error={err("empresa")} autoComplete="organization" />
                <Campo id="telefono" label="Teléfono" tipo="tel" valor={c.telefono} onChange={set("telefono")} onBlur={tocar("telefono")}
                  error={err("telefono")} autoComplete="tel" ayuda="Opcional." />
              </div>
              <Campo id="personas" label="Número de personas" requerido tipo="number" valor={c.personas} onChange={set("personas")}
                onBlur={tocar("personas")} error={err("personas")} min={1} max={disponibles}
                ayuda={`Desde 2 personas aplica la tarifa de grupo (USD ${precioGrupo} c/u).`} />

              <div className="flex items-center justify-between rounded-xl bg-bg px-4 py-3" aria-live="polite">
                <span className="text-sm text-muted">
                  {n} × USD {unitario.toLocaleString("es-PA")}
                </span>
                <span className="text-lg font-bold">Total: USD {total.toLocaleString("es-PA")}</span>
              </div>

              <button
                type="submit"
                disabled={estado === "enviando"}
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-brand px-6 text-base font-semibold text-white hover:bg-brand-strong disabled:cursor-wait disabled:opacity-70"
              >
                {estado === "enviando" && <Loader2 aria-hidden className="h-5 w-5 animate-spin" />}
                {estado === "enviando" ? "Enviando…" : "Reservar mi lugar"}
              </button>
              <p className="text-xs text-muted">Los campos con * son obligatorios. No se cobra nada al enviar.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}

function Campo({ id, label, valor, onChange, onBlur, error, ayuda, requerido, tipo = "text", autoComplete, min, max }: {
  id: string; label: string; valor: string; onChange: (v: string) => void; onBlur: () => void; error?: string;
  ayuda?: string; requerido?: boolean; tipo?: string; autoComplete?: string; min?: number; max?: number;
}) {
  const fid = `f-${id}`;
  const desc = [ayuda && !error && `${fid}-ayuda`, error && `${fid}-error`].filter(Boolean).join(" ") || undefined;
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={fid} className="text-sm font-medium">
        {label} {requerido && <span aria-hidden className="text-danger">*</span>}
      </label>
      <input
        id={fid}
        name={id}
        type={tipo}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        required={requerido}
        aria-invalid={!!error}
        aria-describedby={desc}
        autoComplete={autoComplete}
        inputMode={tipo === "number" ? "numeric" : undefined}
        min={min}
        max={max}
        className={cn(
          "min-h-12 w-full rounded-lg border bg-surface px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-brand",
          error ? "border-danger" : "border-line hover:border-muted",
        )}
      />
      {ayuda && !error && <p id={`${fid}-ayuda`} className="text-sm text-muted">{ayuda}</p>}
      {error && (
        <p id={`${fid}-error`} className="flex items-center gap-1.5 text-sm text-danger">
          <AlertCircle aria-hidden className="h-4 w-4 shrink-0" /> {error}
        </p>
      )}
    </div>
  );
}

function Aviso({ tipo, titulo, children }: { tipo: "error" | "info"; titulo: string; children: React.ReactNode }) {
  return (
    <div role={tipo === "error" ? "alert" : "status"}
      className={cn("rounded-xl border p-4 text-sm", tipo === "error" ? "border-danger/40 bg-danger/5" : "border-line bg-bg")}>
      <p className="font-semibold">{titulo}</p>
      <p className="mt-1 text-muted">{children}</p>
    </div>
  );
}
