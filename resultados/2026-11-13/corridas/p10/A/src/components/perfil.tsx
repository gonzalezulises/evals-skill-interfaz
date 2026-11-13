import { useState, type FormEvent } from "react";
import { Button, Field, Input, SectionCard, Select, Switch } from "@/components/ui";

type Perfil = { nombre: string; correo: string; cargo: string; telefono: string; zona: string };
const INICIAL: Perfil = {
  nombre: "Mariana Quispe",
  correo: "mariana.quispe@andeslogistica.com",
  cargo: "Jefa de operaciones",
  telefono: "+51 987 654 321",
  zona: "America/Lima",
};

function validar(p: Perfil) {
  const e: Partial<Record<keyof Perfil, string>> = {};
  if (p.nombre.trim().length < 2) e.nombre = "Escribe tu nombre completo.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.correo)) e.correo = "Escribe un correo válido, por ejemplo nombre@empresa.com.";
  if (p.telefono && !/^\+?[\d\s-]{7,}$/.test(p.telefono)) e.telefono = "Usa solo números, espacios y el prefijo con «+».";
  return e;
}

export function PerfilSection({ avisar }: { avisar: (m: string) => void }) {
  const [guardado, setGuardado] = useState(INICIAL);
  const [p, setP] = useState(INICIAL);
  const [tocado, setTocado] = useState<Partial<Record<keyof Perfil, boolean>>>({});
  const [guardando, setGuardando] = useState(false);
  const errores = validar(p);
  const sucio = JSON.stringify(p) !== JSON.stringify(guardado);

  const campo = (k: keyof Perfil) => ({
    id: `perfil-${k}`,
    value: p[k],
    onChange: (ev: { target: { value: string } }) => setP({ ...p, [k]: ev.target.value }),
    onBlur: () => setTocado({ ...tocado, [k]: true }),
    "aria-invalid": tocado[k] && errores[k] ? true : undefined,
    "aria-describedby": tocado[k] && errores[k] ? `perfil-${k}-error` : `perfil-${k}-ayuda`,
  });

  async function enviar(e: FormEvent) {
    e.preventDefault();
    setTocado({ nombre: true, correo: true, telefono: true });
    if (Object.keys(errores).length) return;
    setGuardando(true);
    await new Promise((r) => setTimeout(r, 700));
    setGuardando(false);
    setGuardado(p);
    avisar("Perfil actualizado.");
  }

  const iniciales = p.nombre.split(" ").filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase() || "?";

  return (
    <form onSubmit={enviar} noValidate>
      <SectionCard
        id="perfil"
        titulo="Perfil"
        descripcion="Así te ven tus compañeros en órdenes, despachos y comentarios."
        footer={
          <>
            <Button type="button" variant="ghost" disabled={!sucio || guardando} onClick={() => { setP(guardado); setTocado({}); }}>
              Descartar cambios
            </Button>
            <Button type="submit" disabled={!sucio} loading={guardando}>
              Guardar perfil
            </Button>
          </>
        }
      >
        <div className="mb-6 flex items-center gap-4">
          <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/10 text-lg font-semibold text-primary" aria-hidden>
            {iniciales}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium">{p.nombre || "Sin nombre"}</p>
            <p className="truncate text-sm text-muted-foreground">{p.cargo || "Sin cargo"}</p>
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field id="perfil-nombre" label="Nombre completo" error={tocado.nombre ? errores.nombre : undefined}>
            <Input {...campo("nombre")} autoComplete="name" />
          </Field>
          <Field id="perfil-correo" label="Correo" ayuda="Lo usas para iniciar sesión y recibir avisos." error={tocado.correo ? errores.correo : undefined}>
            <Input {...campo("correo")} type="email" autoComplete="email" />
          </Field>
          <Field id="perfil-cargo" label="Cargo" ayuda="Opcional.">
            <Input {...campo("cargo")} autoComplete="organization-title" />
          </Field>
          <Field id="perfil-telefono" label="Teléfono" ayuda="Para avisos urgentes por SMS. Opcional." error={tocado.telefono ? errores.telefono : undefined}>
            <Input {...campo("telefono")} type="tel" autoComplete="tel" inputMode="tel" />
          </Field>
          <Field id="perfil-zona" label="Zona horaria" ayuda="Define la hora de los reportes y del resumen diario." className="sm:col-span-2">
            <Select {...campo("zona")}>
              <option value="America/Lima">Lima, Bogotá, Quito (GMT−5)</option>
              <option value="America/Santiago">Santiago (GMT−3)</option>
              <option value="America/La_Paz">La Paz, Caracas (GMT−4)</option>
              <option value="America/Mexico_City">Ciudad de México (GMT−6)</option>
            </Select>
          </Field>
        </div>
      </SectionCard>
    </form>
  );
}

type Evento = { id: string; label: string; descripcion: string };
const EVENTOS: Evento[] = [
  { id: "despachos", label: "Despachos retrasados", descripcion: "Cuando un despacho supera su hora estimada de entrega." },
  { id: "stock", label: "Stock bajo", descripcion: "Cuando un artículo baja de su punto de reposición." },
  { id: "ordenes", label: "Órdenes por aprobar", descripcion: "Cuando una orden de compra espera tu aprobación." },
  { id: "menciones", label: "Menciones", descripcion: "Cuando alguien te menciona en un comentario." },
  { id: "resumen", label: "Resumen diario", descripcion: "Un correo a las 8:00 con lo pendiente del día." },
];
type Canal = "correo" | "app";
const CANALES: { id: Canal; label: string }[] = [
  { id: "correo", label: "Correo" },
  { id: "app", label: "En la app" },
];

export function NotificacionesSection({ avisar }: { avisar: (m: string) => void }) {
  const [prefs, setPrefs] = useState<Record<string, Record<Canal, boolean>>>({
    despachos: { correo: true, app: true },
    stock: { correo: true, app: true },
    ordenes: { correo: true, app: false },
    menciones: { correo: false, app: true },
    resumen: { correo: true, app: false },
  });
  const [pausa, setPausa] = useState(false);

  function cambiar(ev: string, canal: Canal, v: boolean) {
    setPrefs({ ...prefs, [ev]: { ...prefs[ev], [canal]: v } });
    const e = EVENTOS.find((x) => x.id === ev)!;
    avisar(`${e.label}: ${CANALES.find((c) => c.id === canal)!.label.toLowerCase()} ${v ? "activado" : "desactivado"}.`);
  }

  return (
    <SectionCard id="notificaciones" titulo="Notificaciones" descripcion="Elige qué avisos recibes y por qué canal. Los cambios se guardan al instante.">
      <div className="mb-5 flex items-center justify-between gap-4 rounded-md border border-border bg-muted/60 p-3">
        <div>
          <p className="text-sm font-medium">Pausar todas las notificaciones</p>
          <p className="text-xs text-muted-foreground">Útil en vacaciones. Los avisos de seguridad siempre llegan.</p>
        </div>
        <Switch id="notif-pausa" checked={pausa} onChange={(v) => { setPausa(v); avisar(v ? "Notificaciones en pausa." : "Notificaciones reanudadas."); }} label="Pausar todas las notificaciones" />
      </div>

      <fieldset disabled={pausa} className={pausa ? "opacity-50" : undefined}>
        <legend className="sr-only">Avisos por evento y canal</legend>
        <div className="hidden grid-cols-[1fr_6rem_6rem] gap-2 border-b border-border pb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:grid" aria-hidden>
          <span>Evento</span>
          {CANALES.map((c) => (
            <span key={c.id} className="text-center">{c.label}</span>
          ))}
        </div>
        <ul className="divide-y divide-border">
          {EVENTOS.map((e) => (
            <li key={e.id} className="grid gap-2 py-3 sm:grid-cols-[1fr_6rem_6rem] sm:items-center">
              <div>
                <p className="text-sm font-medium">{e.label}</p>
                <p className="text-xs text-muted-foreground">{e.descripcion}</p>
              </div>
              <div className="flex gap-6 sm:contents">
                {CANALES.map((c) => (
                  <div key={c.id} className="flex items-center gap-1 sm:justify-center">
                    <Switch id={`notif-${e.id}-${c.id}`} checked={prefs[e.id][c.id]} onChange={(v) => cambiar(e.id, c.id, v)} label={`${e.label} por ${c.label.toLowerCase()}`} />
                    <span className="text-xs text-muted-foreground sm:hidden" aria-hidden>{c.label}</span>
                  </div>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </fieldset>
    </SectionCard>
  );
}
