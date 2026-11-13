import { CalendarDays, Clock, MapPin, Users, ChevronDown, Check, UserRound } from "lucide-react";
import taller from "@/data/taller.json";
import { Inscripcion } from "@/components/Inscripcion";
import { cn } from "@/lib/utils";

const fmtDia = new Intl.DateTimeFormat("es-PA", { weekday: "long", day: "numeric", month: "long" });
const fmtMes = new Intl.DateTimeFormat("es-PA", { month: "long", year: "numeric" });
const fechas = taller.fechas.map((f) => {
  const [y, m, d] = f.split("-").map(Number);
  return new Date(y, m - 1, d);
});
const rangoFechas = `${fechas.map((f) => f.getDate()).join(" y ")} de ${fmtMes.format(fechas[0])}`;
const disponibles = Math.max(taller.cupo - taller.inscritos, 0);
const usd = (n: number) => `USD ${n.toLocaleString("es-PA")}`;

const NAV = [
  ["temario", "De qué trata"],
  ["agenda", "Agenda"],
  ["facilitadora", "Facilitadora"],
  ["precio", "Precio"],
  ["preguntas", "Preguntas"],
] as const;

export default function App() {
  return (
    <>
      <a
        href="#inscripcion"
        className="fixed left-4 top-0 z-50 inline-flex min-h-11 -translate-y-[150%] items-center rounded-md bg-surface px-4 font-medium shadow focus:translate-y-4"
      >
        Ir al formulario de inscripción
      </a>
      <Encabezado />
      <main>
        <Portada />
        <Temario />
        <Agenda />
        <div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
          <Facilitadora />
          <Precio />
        </div>
        <Preguntas />
        <Inscripcion
          precio={taller.precioUSD}
          precioGrupo={taller.precioGrupoUSD}
          disponibles={disponibles}
          fechas={rangoFechas}
        />
      </main>
      <footer className="border-t border-line py-8 text-center text-sm text-muted">
        Andes Logística · {taller.titulo} · {taller.sede}
      </footer>
    </>
  );
}

function Encabezado() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#" className="flex min-h-11 items-center text-base font-semibold tracking-tight">
          Andes Logística
        </a>
        <nav aria-label="Secciones" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV.map(([id, txt]) => (
              <li key={id}>
                <a
                  href={`#${id}`}
                  className="flex min-h-11 items-center rounded-md px-3 text-sm text-muted hover:bg-brand-soft hover:text-ink"
                >
                  {txt}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a
          href="#inscripcion"
          className="inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-brand-strong"
        >
          Inscribirme
        </a>
      </div>
    </header>
  );
}

function Portada() {
  const ocupado = Math.round((taller.inscritos / taller.cupo) * 100);
  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:grid-cols-[1.4fr_1fr] lg:items-end">
      <div>
        <p className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-soft px-3 py-1 text-sm font-medium text-brand-strong">
          Taller presencial · 2 días
        </p>
        <h1 className="text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
          {taller.titulo}
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted">{taller.subtitulo}.</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <a
            href="#inscripcion"
            className="inline-flex min-h-12 items-center rounded-lg bg-brand px-6 text-base font-semibold text-white hover:bg-brand-strong"
          >
            Reservar mi lugar
          </a>
          <a
            href="#agenda"
            className="inline-flex min-h-12 items-center rounded-lg border border-line bg-surface px-6 text-base font-medium hover:border-brand"
          >
            Ver la agenda
          </a>
        </div>
      </div>

      <aside aria-label="Datos del taller" className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <dl className="space-y-4 text-sm">
          <Dato icono={<CalendarDays />} titulo="Fechas" valor={rangoFechas} />
          <Dato icono={<Clock />} titulo="Horario" valor={`${taller.horario}, ambos días`} />
          <Dato icono={<MapPin />} titulo="Sede" valor={taller.sede} />
        </dl>
        <div className="mt-6 border-t border-line pt-5">
          <div className="flex items-baseline justify-between">
            <p className="text-sm text-muted">Lugares disponibles</p>
            <p className="text-2xl font-bold text-brand-strong">
              {disponibles}
              <span className="text-sm font-normal text-muted"> de {taller.cupo}</span>
            </p>
          </div>
          <div
            className="mt-3 h-2 overflow-hidden rounded-full bg-brand-soft"
            role="progressbar"
            aria-label="Cupo ocupado"
            aria-valuenow={taller.inscritos}
            aria-valuemin={0}
            aria-valuemax={taller.cupo}
          >
            <div className="h-full rounded-full bg-brand" style={{ width: `${ocupado}%` }} />
          </div>
          <p className="mt-2 text-xs text-muted">{taller.inscritos} personas ya inscritas.</p>
        </div>
      </aside>
    </section>
  );
}

function Dato({ icono, titulo, valor }: { icono: React.ReactNode; titulo: string; valor: string }) {
  return (
    <div className="flex gap-3">
      <span aria-hidden className="mt-0.5 text-brand [&_svg]:h-5 [&_svg]:w-5">
        {icono}
      </span>
      <div>
        <dt className="text-muted">{titulo}</dt>
        <dd className="font-medium first-letter:uppercase">{valor}</dd>
      </div>
    </div>
  );
}

function Seccion({ id, titulo, intro, children, className }: {
  id: string; titulo: string; intro?: string; children: React.ReactNode; className?: string;
}) {
  return (
    <section id={id} aria-labelledby={`${id}-t`} className={cn("mx-auto max-w-6xl px-4 py-14 sm:px-6", className)}>
      <h2 id={`${id}-t`} className="text-2xl font-bold tracking-tight sm:text-3xl">{titulo}</h2>
      {intro && <p className="mt-2 max-w-2xl text-muted">{intro}</p>}
      <div className="mt-8">{children}</div>
    </section>
  );
}

const APRENDES = [
  "Distinguir qué tareas operativas puede resolver un modelo de lenguaje y cuáles no.",
  "Escribir prompts que produzcan reportes operativos útiles.",
  "Automatizar el seguimiento de entregas y conciliar órdenes con casos reales.",
  "Salir con el diseño de un piloto propio, cuidando riesgos, datos y privacidad.",
];

function Temario() {
  return (
    <Seccion
      id="temario"
      titulo="De qué trata"
      intro="Dos días de práctica para equipos de operaciones: casos de logística reales, trabajo en equipos y herramientas sin código."
      className="border-t border-line"
    >
      <ul className="grid gap-4 sm:grid-cols-2">
        {APRENDES.map((t) => (
          <li key={t} className="flex gap-3 rounded-xl border border-line bg-surface p-5">
            <span aria-hidden className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <Check className="h-4 w-4" />
            </span>
            <span>{t}</span>
          </li>
        ))}
      </ul>
    </Seccion>
  );
}

function Agenda() {
  return (
    <Seccion id="agenda" titulo="Agenda" intro={`De ${taller.horario} ambos días.`}>
      <div className="grid gap-6 md:grid-cols-2">
        {taller.agenda.map((d, i) => (
          <article key={d.dia} className="rounded-2xl border border-line bg-surface p-6">
            <header className="mb-6">
              <p className="text-sm font-semibold uppercase tracking-wide text-brand">Día {d.dia}</p>
              <h3 className="text-lg font-semibold first-letter:uppercase">{fmtDia.format(fechas[i])}</h3>
            </header>
            {/* Patrón Timeline vertical de 21st (slide-cn/timeline, id 28298), sin dependencias. */}
            <ol>
              {d.bloques.map(([hora, tema], j) => {
                const ultimo = j === d.bloques.length - 1;
                return (
                  <li key={hora} className="flex items-stretch">
                    <div className="mr-4 flex shrink-0 flex-col items-center">
                      <span className="relative z-10 mt-1.5 h-3 w-3 rounded-full bg-brand ring-4 ring-surface" />
                      <span className={cn("mt-1 w-px flex-1 bg-line", ultimo && "opacity-0")} />
                    </div>
                    <div className={cn("flex flex-col gap-1 sm:flex-row sm:gap-4", ultimo ? "pb-0" : "pb-6")}>
                      <time className="w-14 shrink-0 font-mono text-sm font-semibold tabular-nums text-muted">{hora}</time>
                      <span className="font-medium">{tema}</span>
                    </div>
                  </li>
                );
              })}
            </ol>
          </article>
        ))}
      </div>
    </Seccion>
  );
}

function Facilitadora() {
  const f = taller.facilitador;
  return (
    <section id="facilitadora" aria-labelledby="facilitadora-t" className="py-14">
      <h2 id="facilitadora-t" className="text-2xl font-bold tracking-tight sm:text-3xl">Quién lo facilita</h2>
      <div className="mt-8 flex gap-5 rounded-2xl border border-line bg-surface p-6">
        <span aria-hidden className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
          <UserRound className="h-8 w-8" />
        </span>
        <div>
          <h3 className="text-lg font-semibold">{f.nombre}</h3>
          <p className="mt-1 text-muted">{f.bio}</p>
        </div>
      </div>
    </section>
  );
}

function Precio() {
  return (
    <section id="precio" aria-labelledby="precio-t" className="py-14">
      <h2 id="precio-t" className="text-2xl font-bold tracking-tight sm:text-3xl">Precio</h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm font-medium text-muted">Individual</p>
          <p className="mt-2 text-3xl font-bold">{usd(taller.precioUSD)}</p>
          <p className="mt-1 text-sm text-muted">por persona</p>
        </div>
        <div className="relative rounded-2xl border-2 border-brand bg-surface p-6">
          <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-0.5 text-xs font-semibold text-white">
            Ahorras {usd(taller.precioUSD - taller.precioGrupoUSD)}
          </span>
          <p className="text-sm font-medium text-muted">Grupo (2 o más)</p>
          <p className="mt-2 text-3xl font-bold">{usd(taller.precioGrupoUSD)}</p>
          <p className="mt-1 text-sm text-muted">por persona</p>
        </div>
      </div>
      <p className="mt-4 flex items-center gap-2 text-sm text-muted">
        <Users aria-hidden className="h-4 w-4" /> Incluye los dos días y certificado de participación.
      </p>
    </section>
  );
}

function Preguntas() {
  return (
    <Seccion id="preguntas" titulo="Preguntas frecuentes" className="border-t border-line">
      {/* Patrón Accordion de 21st (wensity/accordion, id 31351) con <details> nativo: teclado y lector de pantalla incluidos. */}
      <div className="divide-y divide-line rounded-2xl border border-line bg-surface">
        {taller.preguntas.map(([p, r]) => (
          <details key={p} className="group">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 px-6 py-4 font-medium">
              {p}
              <ChevronDown aria-hidden className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180" />
            </summary>
            <p className="px-6 pb-5 text-muted">{r}</p>
          </details>
        ))}
      </div>
    </Seccion>
  );
}
