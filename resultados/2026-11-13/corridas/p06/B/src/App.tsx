import { useId, useState, type FormEvent } from "react";
import {
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock,
  Loader2,
  MapPin,
  Users,
} from "lucide-react";
import taller from "@/data/taller.json";
import { cn } from "@/lib/utils";

const fmtDia = new Intl.DateTimeFormat("es-PA", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});
const fmtMes = new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric", timeZone: "UTC" });
const fechas = taller.fechas.map((f) => new Date(`${f}T00:00:00Z`));
const rangoFechas = `${fechas.map((d) => d.getUTCDate()).join(" y ")} de ${fmtMes.format(fechas[0])}`;
const cuposLibres = Math.max(taller.cupo - taller.inscritos, 0);
const agotado = cuposLibres === 0;
const usd = (n: number) => `USD ${n.toLocaleString("es-PA")}`;

export default function App() {
  return (
    <div className="min-h-dvh bg-stone-50 text-stone-900 antialiased">
      <a
        href="#inscripcion"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:shadow"
      >
        Ir al formulario de inscripción
      </a>

      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 md:py-14 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-700">Andes Logística · Taller</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl lg:text-5xl">
            {taller.titulo}
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-stone-600">{taller.subtitulo}</p>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-3 text-sm text-stone-700">
            <Dato icon={CalendarDays}>{rangoFechas}</Dato>
            <Dato icon={Clock}>{taller.horario}</Dato>
            <Dato icon={MapPin}>{taller.sede}</Dato>
            <Dato icon={Users}>
              {agotado ? "Cupo agotado" : `Quedan ${cuposLibres} de ${taller.cupo} cupos`}
            </Dato>
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-4 lg:hidden">
            <a
              href="#inscripcion"
              className="inline-flex min-h-11 items-center rounded-lg bg-teal-700 px-5 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
            >
              Inscribirme · {usd(taller.precioUSD)}
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8 lg:py-14">
        <main className="min-w-0 space-y-14">
          <Seccion id="de-que-trata" titulo="De qué trata">
            <p className="text-stone-700">
              Dos días de trabajo práctico para que tu equipo de operaciones sepa qué puede y qué no puede hacer
              un modelo de lenguaje, lo aplique a casos reales —conciliación de órdenes, reportes operativos y
              seguimiento de entregas— y salga con el diseño de un piloto propio.
            </p>
            <ul className="mt-5 grid gap-3 sm:grid-cols-3">
              {[
                "Sin programar: herramientas sin código",
                "Casos de la operación logística",
                "Sales con un piloto diseñado",
              ].map((t) => (
                <li key={t} className="flex gap-2 rounded-lg border border-stone-200 bg-white p-3 text-sm">
                  <CheckCircle2 aria-hidden className="mt-0.5 size-4 shrink-0 text-teal-700" />
                  {t}
                </li>
              ))}
            </ul>
          </Seccion>

          <Seccion id="agenda" titulo="Agenda">
            <div className="grid gap-6 md:grid-cols-2">
              {taller.agenda.map((d, i) => (
                <div key={d.dia} className="rounded-xl border border-stone-200 bg-white p-5">
                  <h3 className="font-semibold">
                    Día {d.dia}
                    <span className="ml-2 font-normal text-stone-500 first-letter:uppercase inline-block">{fmtDia.format(fechas[i])}</span>
                  </h3>
                  <ol className="mt-4 border-l border-stone-200">
                    {d.bloques.map(([hora, tema]) => (
                      <li key={hora} className="relative pb-4 pl-5 last:pb-0">
                        <span aria-hidden className="absolute -left-[5px] top-1.5 size-2.5 rounded-full bg-teal-700" />
                        <time className="block text-sm font-medium tabular-nums text-teal-800">{hora}</time>
                        <span className="text-stone-800">{tema}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm text-stone-500">Horario de ambos días: {taller.horario}.</p>
          </Seccion>

          <Seccion id="facilitadora" titulo="Quién lo facilita">
            <div className="flex items-start gap-4 rounded-xl border border-stone-200 bg-white p-5">
              <div
                aria-hidden
                className="grid size-14 shrink-0 place-items-center rounded-full bg-teal-100 text-lg font-bold text-teal-800"
              >
                {taller.facilitador.nombre
                  .split(" ")
                  .map((p) => p[0])
                  .join("")}
              </div>
              <div>
                <p className="font-semibold">{taller.facilitador.nombre}</p>
                <p className="mt-1 text-stone-700">{taller.facilitador.bio}</p>
              </div>
            </div>
          </Seccion>

          <Seccion id="precio" titulo="Precio">
            <div className="grid gap-4 sm:grid-cols-2">
              <Precio etiqueta="Individual" monto={taller.precioUSD} nota="Por persona" />
              <Precio
                etiqueta="Grupal"
                monto={taller.precioGrupoUSD}
                nota="Por persona, al inscribir a 2 o más de la misma empresa"
                destacado
              />
            </div>
            <p className="mt-3 text-sm text-stone-500">
              Incluye los dos días de taller y certificado de participación. Pago por transferencia hasta 5 días antes
              del inicio.
            </p>
          </Seccion>

          <Seccion id="preguntas" titulo="Preguntas frecuentes">
            <div className="divide-y divide-stone-200 rounded-xl border border-stone-200 bg-white">
              {taller.preguntas.map(([p, r]) => (
                <details key={p} className="group">
                  <summary className="flex min-h-12 cursor-pointer list-none items-center justify-between gap-4 px-5 py-3 font-medium hover:bg-stone-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-teal-700 [&::-webkit-details-marker]:hidden">
                    {p}
                    <ChevronDown aria-hidden className="size-4 shrink-0 text-stone-500 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-5 pb-4 text-stone-700">{r}</p>
                </details>
              ))}
            </div>
          </Seccion>
        </main>

        <aside id="inscripcion" aria-labelledby="titulo-inscripcion" className="scroll-mt-6 lg:sticky lg:top-6 lg:self-start">
          <Formulario />
        </aside>
      </div>

      <footer className="border-t border-stone-200 bg-white">
        <p className="mx-auto max-w-6xl px-4 py-6 text-sm text-stone-500 sm:px-6 lg:px-8">
          © Andes Logística · {taller.sede}
        </p>
      </footer>
    </div>
  );
}

function Dato({ icon: Icon, children }: { icon: typeof Clock; children: React.ReactNode }) {
  return (
    <li className="flex items-center gap-2">
      <Icon aria-hidden className="size-4 text-teal-700" />
      {children}
    </li>
  );
}

function Seccion({ id, titulo, children }: { id: string; titulo: string; children: React.ReactNode }) {
  return (
    <section id={id} aria-labelledby={`${id}-t`}>
      <h2 id={`${id}-t`} className="mb-5 text-2xl font-bold tracking-tight">
        {titulo}
      </h2>
      {children}
    </section>
  );
}

function Precio({ etiqueta, monto, nota, destacado }: { etiqueta: string; monto: number; nota: string; destacado?: boolean }) {
  return (
    <div className={cn("rounded-xl border bg-white p-5", destacado ? "border-teal-700 ring-1 ring-teal-700" : "border-stone-200")}>
      <p className="text-sm font-medium text-stone-600">{etiqueta}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums">{usd(monto)}</p>
      <p className="mt-1 text-sm text-stone-600">{nota}</p>
    </div>
  );
}

type Campos = { nombre: string; correo: string; empresa: string; cargo: string; telefono: string; personas: string };
type Errores = Partial<Record<keyof Campos, string>>;
const vacio: Campos = { nombre: "", correo: "", empresa: "", cargo: "", telefono: "", personas: "1" };

function validar(c: Campos): Errores {
  const e: Errores = {};
  if (!c.nombre.trim()) e.nombre = "Escribe tu nombre completo.";
  if (!c.correo.trim()) e.correo = "Escribe tu correo.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.correo.trim())) e.correo = "Revisa el correo: falta la @ o el dominio.";
  if (!c.empresa.trim()) e.empresa = "Escribe el nombre de tu empresa.";
  const n = Number(c.personas);
  if (!Number.isInteger(n) || n < 1) e.personas = "Indica al menos 1 persona.";
  else if (n > cuposLibres) e.personas = `Solo quedan ${cuposLibres} cupos.`;
  return e;
}

function Formulario() {
  const uid = useId();
  const [campos, setCampos] = useState<Campos>(vacio);
  const [errores, setErrores] = useState<Errores>({});
  const [estado, setEstado] = useState<"editando" | "enviando" | "enviado">("editando");

  const personas = Math.max(Number(campos.personas) || 1, 1);
  const precioUnit = personas >= 2 ? taller.precioGrupoUSD : taller.precioUSD;
  const total = precioUnit * personas;

  const set = (k: keyof Campos) => (v: string) => {
    setCampos((c) => ({ ...c, [k]: v }));
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  async function enviar(ev: FormEvent<HTMLFormElement>) {
    ev.preventDefault();
    const e = validar(campos);
    setErrores(e);
    const primero = Object.keys(e)[0];
    if (primero) {
      document.getElementById(`${uid}-${primero}`)?.focus();
      return;
    }
    setEstado("enviando");
    await new Promise((r) => setTimeout(r, 900));
    setEstado("enviado");
  }

  if (estado === "enviado") {
    return (
      <div role="status" className="rounded-xl border border-teal-700 bg-white p-6 shadow-sm">
        <CheckCircle2 aria-hidden className="size-8 text-teal-700" />
        <h2 id="titulo-inscripcion" className="mt-3 text-xl font-bold">
          Recibimos tu inscripción
        </h2>
        <p className="mt-2 text-stone-700">
          Enviaremos a <strong className="break-all">{campos.correo}</strong> los datos para la transferencia de{" "}
          <strong>{usd(total)}</strong>. El cupo se confirma al recibir el pago, hasta 5 días antes del inicio.
        </p>
        <button
          type="button"
          onClick={() => {
            setCampos(vacio);
            setEstado("editando");
          }}
          className="mt-5 min-h-11 rounded-lg border border-stone-300 px-4 font-medium hover:bg-stone-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700"
        >
          Inscribir a otra persona
        </button>
      </div>
    );
  }

  const enviando = estado === "enviando";

  return (
    <form noValidate onSubmit={enviar} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
      <h2 id="titulo-inscripcion" className="text-xl font-bold">
        Inscripción
      </h2>
      <p className="mt-1 text-sm text-stone-600">
        {agotado ? "El cupo está completo." : `Quedan ${cuposLibres} cupos de ${taller.cupo}.`}
      </p>
      <div
        className="mt-3 h-2 overflow-hidden rounded-full bg-stone-200"
        role="progressbar"
        aria-label="Cupos ocupados"
        aria-valuemin={0}
        aria-valuemax={taller.cupo}
        aria-valuenow={taller.inscritos}
      >
        <div className="h-full bg-teal-700" style={{ width: `${(taller.inscritos / taller.cupo) * 100}%` }} />
      </div>

      <fieldset disabled={agotado || enviando} className="mt-5 space-y-4">
        <Campo uid={uid} k="nombre" label="Nombre completo" autoComplete="name" valor={campos.nombre} onChange={set("nombre")} error={errores.nombre} />
        <Campo uid={uid} k="correo" label="Correo" type="email" autoComplete="email" inputMode="email" valor={campos.correo} onChange={set("correo")} error={errores.correo} />
        <Campo uid={uid} k="empresa" label="Empresa" autoComplete="organization" valor={campos.empresa} onChange={set("empresa")} error={errores.empresa} />
        <Campo uid={uid} k="cargo" label="Cargo" opcional autoComplete="organization-title" valor={campos.cargo} onChange={set("cargo")} />
        <Campo uid={uid} k="telefono" label="Teléfono" opcional type="tel" autoComplete="tel" inputMode="tel" valor={campos.telefono} onChange={set("telefono")} />
        <Campo
          uid={uid}
          k="personas"
          label="Personas a inscribir"
          type="number"
          inputMode="numeric"
          min={1}
          max={Math.max(cuposLibres, 1)}
          valor={campos.personas}
          onChange={set("personas")}
          error={errores.personas}
          ayuda="Desde 2 personas aplica el precio grupal."
        />
      </fieldset>

      <div className="mt-5 flex items-baseline justify-between border-t border-stone-200 pt-4" aria-live="polite">
        <span className="text-sm text-stone-600">
          {personas} × {usd(precioUnit)}
        </span>
        <span className="text-xl font-bold tabular-nums">{usd(total)}</span>
      </div>

      <button
        type="submit"
        disabled={agotado || enviando}
        className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-teal-700 px-5 font-semibold text-white hover:bg-teal-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:bg-stone-400"
      >
        {enviando && <Loader2 aria-hidden className="size-4 animate-spin" />}
        {agotado ? "Cupo agotado" : enviando ? "Enviando…" : "Reservar mi cupo"}
      </button>
      <p className="mt-3 text-xs text-stone-500">Pago por transferencia hasta 5 días antes del inicio.</p>
    </form>
  );
}

function Campo({
  uid,
  k,
  label,
  valor,
  onChange,
  error,
  ayuda,
  opcional,
  ...rest
}: {
  uid: string;
  k: keyof Campos;
  label: string;
  valor: string;
  onChange: (v: string) => void;
  error?: string;
  ayuda?: string;
  opcional?: boolean;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value" | "id">) {
  const id = `${uid}-${k}`;
  const desc = [error && `${id}-err`, ayuda && `${id}-ayuda`].filter(Boolean).join(" ") || undefined;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium">
        {label} {opcional && <span className="font-normal text-stone-500">(opcional)</span>}
      </label>
      <input
        id={id}
        name={k}
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        required={!opcional}
        aria-invalid={!!error}
        aria-describedby={desc}
        className={cn(
          "mt-1 block min-h-11 w-full rounded-lg border bg-white px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-teal-700 disabled:bg-stone-100",
          error ? "border-red-600" : "border-stone-300",
        )}
        {...rest}
      />
      {ayuda && (
        <p id={`${id}-ayuda`} className="mt-1 text-xs text-stone-500">
          {ayuda}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
