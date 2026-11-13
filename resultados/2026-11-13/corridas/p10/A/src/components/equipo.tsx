import { useCallback, useEffect, useState, type FormEvent } from "react";
import { AlertCircle, RotateCw, Trash2, UserPlus, Users } from "lucide-react";
import { Button, Field, Input, SectionCard, Select, Skeleton } from "@/components/ui";
import { ETIQUETA_ROL, ROLES, fetchEquipo, type Miembro, type Rol } from "@/lib/equipo";
import { cn } from "@/lib/utils";

type Estado = { tipo: "cargando" } | { tipo: "error"; mensaje: string } | { tipo: "listo"; miembros: Miembro[] };

function Avatar({ m }: { m: Miembro }) {
  const base = m.nombre || m.correo;
  const ini = base.split(/[\s.@]/).filter(Boolean).slice(0, 2).map((s) => s[0]).join("").toUpperCase();
  return (
    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold", m.estado === "pendiente" ? "border border-dashed border-input text-muted-foreground" : "bg-primary/10 text-primary")} aria-hidden>
      {ini}
    </span>
  );
}

function EstadoBadge({ m }: { m: Miembro }) {
  return m.estado === "pendiente" ? (
    <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-warning">Invitación pendiente</span>
  ) : (
    <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-success">Activo</span>
  );
}

function RolControl({ m, onRol }: { m: Miembro; onRol: (r: Rol) => void }) {
  if (m.rol === "propietario")
    return <span className="inline-flex min-h-11 items-center text-sm font-medium sm:min-h-10" title="El propietario no se puede cambiar desde aquí">Propietario</span>;
  return (
    <Select aria-label={`Rol de ${m.nombre || m.correo}`} value={m.rol} onChange={(e) => onRol(e.target.value as Rol)} className="sm:w-40">
      {ROLES.map((r) => (
        <option key={r.value} value={r.value}>{r.label}</option>
      ))}
    </Select>
  );
}

export function EquipoSection({ avisar }: { avisar: (m: string) => void }) {
  const [estado, setEstado] = useState<Estado>({ tipo: "cargando" });
  const [correo, setCorreo] = useState("");
  const [rol, setRol] = useState<Rol>("editor");
  const [errorCorreo, setErrorCorreo] = useState<string>();
  const [invitando, setInvitando] = useState(false);

  const cargar = useCallback(() => {
    setEstado({ tipo: "cargando" });
    fetchEquipo()
      .then((miembros) => setEstado({ tipo: "listo", miembros }))
      .catch((e: Error) => setEstado({ tipo: "error", mensaje: e.message }));
  }, []);
  useEffect(cargar, [cargar]);

  const miembros = estado.tipo === "listo" ? estado.miembros : [];
  const setMiembros = (fn: (m: Miembro[]) => Miembro[]) => setEstado((s) => (s.tipo === "listo" ? { tipo: "listo", miembros: fn(s.miembros) } : s));

  function cambiarRol(m: Miembro, r: Rol) {
    setMiembros((ms) => ms.map((x) => (x.id === m.id ? { ...x, rol: r } : x)));
    avisar(`${m.nombre || m.correo} ahora es ${ETIQUETA_ROL[r].toLowerCase()}.`);
  }
  function quitar(m: Miembro) {
    if (!window.confirm(`¿Quitar a ${m.nombre || m.correo} del equipo? Perderá el acceso de inmediato.`)) return;
    setMiembros((ms) => ms.filter((x) => x.id !== m.id));
    avisar(m.estado === "pendiente" ? "Invitación cancelada." : `${m.nombre} ya no tiene acceso.`);
  }

  async function invitar(e: FormEvent) {
    e.preventDefault();
    const c = correo.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c)) return setErrorCorreo("Escribe un correo válido.");
    if (miembros.some((m) => m.correo === c)) return setErrorCorreo("Esa persona ya está en el equipo o tiene una invitación pendiente.");
    setErrorCorreo(undefined);
    setInvitando(true);
    await new Promise((r) => setTimeout(r, 600));
    setInvitando(false);
    setMiembros((ms) => [...ms, { id: crypto.randomUUID(), nombre: "", correo: c, rol, estado: "pendiente", ultimoAcceso: "" }]);
    setCorreo("");
    avisar(`Invitación enviada a ${c}.`);
  }

  const activos = miembros.filter((m) => m.estado === "activo").length;
  const pendientes = miembros.length - activos;
  const soloPropietario = estado.tipo === "listo" && miembros.every((m) => m.rol === "propietario");

  return (
    <SectionCard
      id="equipo"
      titulo="Usuarios del equipo"
      descripcion={estado.tipo === "listo" ? `${activos} ${activos === 1 ? "usuario activo" : "usuarios activos"}${pendientes ? ` · ${pendientes} ${pendientes === 1 ? "invitación pendiente" : "invitaciones pendientes"}` : ""}. Asigna el rol de cada persona.` : "Invita personas y asigna el rol de cada una."}
    >
      <form onSubmit={invitar} noValidate className="mb-6 grid gap-3 rounded-md border border-border bg-muted/60 p-3 sm:grid-cols-[1fr_11rem_auto] sm:items-start sm:p-4">
        <Field id="invitar-correo" label="Invitar por correo" error={errorCorreo} ayuda="Recibirá un enlace válido por 7 días.">
          <Input id="invitar-correo" type="email" placeholder="nombre@andeslogistica.com" value={correo} onChange={(e) => setCorreo(e.target.value)} aria-invalid={errorCorreo ? true : undefined} aria-describedby={errorCorreo ? "invitar-correo-error" : "invitar-correo-ayuda"} />
        </Field>
        <Field id="invitar-rol" label="Rol" ayuda={ROLES.find((r) => r.value === rol)?.ayuda}>
          <Select id="invitar-rol" value={rol} onChange={(e) => setRol(e.target.value as Rol)} aria-describedby="invitar-rol-ayuda">
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </Select>
        </Field>
        <Button type="submit" variant="outline" loading={invitando} disabled={estado.tipo !== "listo"} className="sm:mt-[1.625rem]">
          <UserPlus className="size-4" aria-hidden /> Enviar invitación
        </Button>
      </form>

      {estado.tipo === "cargando" && (
        <div role="status" aria-label="Cargando usuarios del equipo" className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="hidden h-10 w-40 sm:block" />
            </div>
          ))}
        </div>
      )}

      {estado.tipo === "error" && (
        <div role="alert" className="flex flex-col items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 sm:flex-row sm:items-center">
          <AlertCircle className="size-5 shrink-0 text-destructive" aria-hidden />
          <div className="flex-1">
            <p className="text-sm font-medium">No pudimos cargar los usuarios del equipo.</p>
            <p className="text-xs text-muted-foreground">{estado.mensaje} Tus cambios de perfil y notificaciones no se ven afectados.</p>
          </div>
          <Button variant="outline" onClick={cargar}>
            <RotateCw className="size-4" aria-hidden /> Reintentar
          </Button>
        </div>
      )}

      {soloPropietario && (
        <div className="mb-4 flex flex-col items-center gap-2 rounded-md border border-dashed border-input px-4 py-6 text-center">
          <Users className="size-6 text-muted-foreground" aria-hidden />
          <p className="text-sm font-medium">Aún trabajas solo en esta cuenta</p>
          <p className="max-w-sm text-xs text-muted-foreground">Invita a tu equipo con el formulario de arriba para repartir órdenes, inventario y despachos.</p>
        </div>
      )}

      {estado.tipo === "listo" && (
        <>
          {/* Escritorio y tableta: tabla */}
          <table className="hidden w-full text-left text-sm md:table">
            <caption className="sr-only">Usuarios del equipo y sus roles</caption>
            <thead className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
              <tr>
                <th scope="col" className="py-2 font-medium">Persona</th>
                <th scope="col" className="py-2 font-medium">Estado</th>
                <th scope="col" className="py-2 font-medium">Último acceso</th>
                <th scope="col" className="py-2 font-medium">Rol</th>
                <th scope="col" className="py-2"><span className="sr-only">Acciones</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {miembros.map((m) => (
                <tr key={m.id}>
                  <td className="py-3 pr-3">
                    <div className="flex items-center gap-3">
                      <Avatar m={m} />
                      <div className="min-w-0">
                        <p className="truncate font-medium">{m.nombre || "Sin aceptar"}</p>
                        <p className="truncate text-xs text-muted-foreground">{m.correo}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 pr-3"><EstadoBadge m={m} /></td>
                  <td className="py-3 pr-3 text-muted-foreground">{m.ultimoAcceso || "—"}</td>
                  <td className="py-3 pr-3"><RolControl m={m} onRol={(r) => cambiarRol(m, r)} /></td>
                  <td className="py-3 text-right">
                    {m.rol !== "propietario" && (
                      <Button variant="ghost" className="min-w-11 px-3 text-muted-foreground hover:text-destructive" aria-label={`Quitar a ${m.nombre || m.correo}`} title="Quitar del equipo" onClick={() => quitar(m)}>
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Móvil: tarjetas */}
          <ul className="space-y-3 md:hidden" aria-label="Usuarios del equipo y sus roles">
            {miembros.map((m) => (
              <li key={m.id} className="rounded-md border border-border p-3">
                <div className="flex items-start gap-3">
                  <Avatar m={m} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{m.nombre || "Sin aceptar"}</p>
                    <p className="truncate text-xs text-muted-foreground">{m.correo}</p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <EstadoBadge m={m} />
                      {m.ultimoAcceso && <span className="text-xs text-muted-foreground">Último acceso: {m.ultimoAcceso}</span>}
                    </div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <div className="flex-1"><RolControl m={m} onRol={(r) => cambiarRol(m, r)} /></div>
                  {m.rol !== "propietario" && (
                    <Button variant="ghost" className="min-w-11 px-3 text-muted-foreground" aria-label={`Quitar a ${m.nombre || m.correo}`} onClick={() => quitar(m)}>
                      <Trash2 className="size-4" aria-hidden />
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </SectionCard>
  );
}
