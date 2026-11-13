import { MailPlus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { guardar, miembrosIniciales, ROLES, USUARIO_ACTUAL, type Miembro, type Rol } from "@/data/cuenta";
import { cn } from "@/lib/utils";
import { Dialog } from "./Dialog";
import { Button, Card, Field, Input, Select } from "./ui";

const fecha = new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" });

function nombreVisible(m: Miembro) {
  return m.nombre || m.correo.split("@")[0]!;
}

function Avatar({ m }: { m: Miembro }) {
  const txt = nombreVisible(m)
    .split(/[\s.]+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
  return (
    <span
      aria-hidden
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold",
        m.estado === "invitado" ? "border border-dashed border-border text-fg-muted" : "bg-muted text-fg",
      )}
    >
      {txt}
    </span>
  );
}

export function EquipoSection({ notify }: { notify: (msg: string) => void }) {
  const [miembros, setMiembros] = useState<Miembro[]>(miembrosIniciales);
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Rol>("editor");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [invitando, setInvitando] = useState(false);
  const [quitar, setQuitar] = useState<Miembro | null>(null);

  const rolLabel = (r: Rol) => ROLES.find((x) => x.value === r)!.label;

  const invitar = async (ev: FormEvent) => {
    ev.preventDefault();
    const c = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c)) {
      setErrorCorreo("Escribe un correo válido.");
      return;
    }
    if (miembros.some((m) => m.correo === c)) {
      setErrorCorreo("Esa persona ya está en el equipo o tiene una invitación pendiente.");
      return;
    }
    setInvitando(true);
    await guardar(null);
    setMiembros((ms) => [...ms, { id: crypto.randomUUID(), nombre: "", correo: c, rol, estado: "invitado", ultimoAcceso: null }]);
    setInvitando(false);
    setCorreo("");
    notify(`Invitación enviada a ${c}.`);
  };

  const cambiarRol = (m: Miembro, r: Rol) => {
    setMiembros((ms) => ms.map((x) => (x.id === m.id ? { ...x, rol: r } : x)));
    notify(`${nombreVisible(m)} ahora es ${rolLabel(r).toLowerCase()}.`);
  };

  const confirmarQuitar = () => {
    if (!quitar) return;
    setMiembros((ms) => ms.filter((x) => x.id !== quitar.id));
    notify(quitar.estado === "invitado" ? `Invitación a ${quitar.correo} cancelada.` : `${nombreVisible(quitar)} ya no tiene acceso.`);
    setQuitar(null);
  };

  const activos = miembros.filter((m) => m.estado === "activo").length;
  const pendientes = miembros.length - activos;

  return (
    <Card
      id="equipo"
      title="Equipo"
      description="Invita personas y define qué puede hacer cada una."
    >
      <form onSubmit={invitar} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_11rem_auto] sm:items-start">
        <Field id="invitar-correo" label="Correo de la persona" error={errorCorreo}>
          <Input
            id="invitar-correo"
            type="email"
            autoComplete="off"
            placeholder="nombre@andeslogistica.com"
            value={correo}
            invalid={!!errorCorreo}
            aria-describedby={errorCorreo ? "invitar-correo-error" : undefined}
            onChange={(e) => {
              setCorreo(e.target.value);
              setErrorCorreo(undefined);
            }}
          />
        </Field>
        <Field id="invitar-rol" label="Rol">
          <Select id="invitar-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)}>
            {ROLES.filter((r) => r.value !== "propietario").map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit" loading={invitando} className="sm:mt-[1.625rem]">
          {!invitando && <MailPlus className="size-4" aria-hidden />}
          {invitando ? "Enviando…" : "Invitar"}
        </Button>
      </form>

      <details className="mt-3 text-sm text-fg-muted">
        <summary className="w-fit cursor-pointer rounded text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          ¿Qué puede hacer cada rol?
        </summary>
        <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-1 sm:grid-cols-[8rem_1fr]">
          {ROLES.map((r) => (
            <div key={r.value} className="contents">
              <dt className="font-medium text-fg">{r.label}</dt>
              <dd className="mb-1 sm:mb-0">{r.descripcion}</dd>
            </div>
          ))}
        </dl>
      </details>

      <div className="mt-6 flex items-baseline justify-between">
        <h3 className="text-sm font-semibold text-fg">Miembros</h3>
        <p className="text-xs text-fg-muted">
          {activos} activos{pendientes ? ` · ${pendientes} pendientes` : ""}
        </p>
      </div>

      <ul className="mt-2 divide-y divide-border rounded-lg border border-border">
        {miembros.map((m) => {
          const esYo = m.id === USUARIO_ACTUAL;
          const bloqueado = m.rol === "propietario";
          return (
            <li key={m.id} className="grid grid-cols-[auto_1fr_auto] items-center gap-x-3 gap-y-3 p-3 sm:grid-cols-[auto_1fr_10rem_auto] sm:px-4">
              <Avatar m={m} />
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-x-2 text-sm font-medium text-fg">
                  <span className="truncate">{nombreVisible(m)}</span>
                  {esYo && <span className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-medium text-fg-muted">Tú</span>}
                  {m.estado === "invitado" && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[11px] font-medium text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                      Invitación pendiente
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-fg-muted">{m.correo}</p>
                <p className="text-xs text-fg-muted">
                  {m.ultimoAcceso ? `Último acceso: ${fecha.format(new Date(m.ultimoAcceso + "T12:00:00"))}` : "Aún no ha entrado"}
                </p>
              </div>

              {/* En móvil, rol y acción bajan a una segunda fila */}
              <div className="col-span-3 col-start-1 flex items-center gap-2 sm:contents">
                {bloqueado ? (
                  <p className="flex-1 text-sm text-fg-muted sm:px-3" title="El rol de propietario no se cambia desde aquí">
                    {rolLabel(m.rol)}
                  </p>
                ) : (
                  <Select
                    aria-label={`Rol de ${nombreVisible(m)}`}
                    value={m.rol}
                    onChange={(e) => cambiarRol(m, e.target.value as Rol)}
                    className="flex-1 sm:flex-none"
                  >
                    {ROLES.filter((r) => r.value !== "propietario").map((r) => (
                      <option key={r.value} value={r.value}>{r.label}</option>
                    ))}
                  </Select>
                )}
                {bloqueado ? (
                  <span className="size-10" aria-hidden />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={m.estado === "invitado" ? `Cancelar invitación a ${m.correo}` : `Quitar a ${nombreVisible(m)} del equipo`}
                    title={m.estado === "invitado" ? "Cancelar invitación" : "Quitar del equipo"}
                    onClick={() => setQuitar(m)}
                    className="hover:text-danger"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <Dialog
        open={!!quitar}
        onClose={() => setQuitar(null)}
        labelledBy="quitar-title"
        title={quitar?.estado === "invitado" ? "¿Cancelar la invitación?" : `¿Quitar a ${quitar ? nombreVisible(quitar) : ""}?`}
      >
        <p className="mt-2 text-sm text-fg-muted">
          {quitar?.estado === "invitado"
            ? `El enlace enviado a ${quitar.correo} dejará de funcionar.`
            : "Perderá el acceso de inmediato. Lo que creó se conserva y puedes volver a invitarlo cuando quieras."}
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="secondary" onClick={() => setQuitar(null)} autoFocus>
            Cancelar
          </Button>
          <Button variant="danger" onClick={confirmarQuitar}>
            {quitar?.estado === "invitado" ? "Cancelar invitación" : "Quitar del equipo"}
          </Button>
        </div>
      </Dialog>
    </Card>
  );
}
