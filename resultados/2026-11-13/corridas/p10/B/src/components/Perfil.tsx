import { useState, type FormEvent } from "react";
import { guardar, perfilInicial, type Perfil } from "@/data/cuenta";
import { Button, Card, Field, Input, Select } from "./ui";

type Errores = Partial<Record<keyof Perfil, string>>;

function validar(p: Perfil): Errores {
  const e: Errores = {};
  if (!p.nombre.trim()) e.nombre = "Escribe tu nombre.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.correo.trim())) e.correo = "Escribe un correo válido, por ejemplo nombre@empresa.com.";
  if (p.telefono && !/^\+?[\d\s()-]{7,20}$/.test(p.telefono)) e.telefono = "Usa solo números, espacios y el prefijo +.";
  return e;
}

function iniciales(nombre: string) {
  return (
    nombre
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]!.toUpperCase())
      .join("") || "?"
  );
}

export function PerfilSection({ notify }: { notify: (msg: string) => void }) {
  const [guardado, setGuardado] = useState<Perfil>(perfilInicial);
  const [perfil, setPerfil] = useState<Perfil>(perfilInicial);
  const [errores, setErrores] = useState<Errores>({});
  const [enviando, setEnviando] = useState(false);

  const sucio = JSON.stringify(perfil) !== JSON.stringify(guardado);

  const set = <K extends keyof Perfil>(k: K, v: Perfil[K]) => {
    setPerfil((p) => ({ ...p, [k]: v }));
    if (errores[k]) setErrores((e) => ({ ...e, [k]: undefined }));
  };

  const onSubmit = async (ev: FormEvent) => {
    ev.preventDefault();
    const e = validar(perfil);
    setErrores(e);
    if (Object.keys(e).length) {
      document.getElementById(`perfil-${Object.keys(e)[0]}`)?.focus();
      return;
    }
    setEnviando(true);
    const nuevo = await guardar(perfil);
    setGuardado(nuevo);
    setEnviando(false);
    notify("Perfil actualizado.");
  };

  const describedBy = (k: keyof Perfil, hint = false) =>
    errores[k] ? `perfil-${k}-error` : hint ? `perfil-${k}-hint` : undefined;

  return (
    <form onSubmit={onSubmit} noValidate>
      <Card
        id="perfil"
        title="Perfil"
        description="Tus datos de contacto. Tu equipo ve tu nombre y correo."
        footer={
          <>
            <Button type="button" variant="ghost" disabled={!sucio || enviando} onClick={() => { setPerfil(guardado); setErrores({}); }}>
              Descartar cambios
            </Button>
            <Button type="submit" disabled={!sucio} loading={enviando}>
              {enviando ? "Guardando…" : "Guardar cambios"}
            </Button>
          </>
        }
      >
        <div className="mb-6 flex items-center gap-4">
          <div
            aria-hidden
            className="grid size-14 shrink-0 place-items-center rounded-full bg-primary/15 text-lg font-semibold text-primary"
          >
            {iniciales(perfil.nombre)}
          </div>
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{perfil.nombre || "Sin nombre"}</p>
            <p className="truncate text-sm text-fg-muted">{perfil.cargo || "Sin cargo"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Field id="perfil-nombre" label="Nombre completo" error={errores.nombre}>
            <Input id="perfil-nombre" autoComplete="name" value={perfil.nombre} invalid={!!errores.nombre}
              aria-describedby={describedBy("nombre")} onChange={(e) => set("nombre", e.target.value)} />
          </Field>
          <Field id="perfil-correo" label="Correo" error={errores.correo} hint="Lo usas para iniciar sesión.">
            <Input id="perfil-correo" type="email" autoComplete="email" value={perfil.correo} invalid={!!errores.correo}
              aria-describedby={describedBy("correo", true)} onChange={(e) => set("correo", e.target.value)} />
          </Field>
          <Field id="perfil-cargo" label="Cargo">
            <Input id="perfil-cargo" autoComplete="organization-title" value={perfil.cargo} onChange={(e) => set("cargo", e.target.value)} />
          </Field>
          <Field id="perfil-telefono" label="Teléfono" error={errores.telefono} hint="Opcional. Se usa para avisos por SMS.">
            <Input id="perfil-telefono" type="tel" autoComplete="tel" inputMode="tel" value={perfil.telefono} invalid={!!errores.telefono}
              aria-describedby={describedBy("telefono", true)} onChange={(e) => set("telefono", e.target.value)} />
          </Field>
          <Field id="perfil-idioma" label="Idioma">
            <Select id="perfil-idioma" value={perfil.idioma} onChange={(e) => set("idioma", e.target.value)}>
              <option value="es">Español</option>
              <option value="en">English</option>
              <option value="pt">Português</option>
            </Select>
          </Field>
          <Field id="perfil-zonaHoraria" label="Zona horaria">
            <Select id="perfil-zonaHoraria" value={perfil.zonaHoraria} onChange={(e) => set("zonaHoraria", e.target.value)}>
              <option value="America/Lima">Lima (GMT−5)</option>
              <option value="America/Bogota">Bogotá (GMT−5)</option>
              <option value="America/Panama">Panamá (GMT−5)</option>
              <option value="America/La_Paz">La Paz (GMT−4)</option>
              <option value="America/Santiago">Santiago (GMT−3)</option>
            </Select>
          </Field>
        </div>
      </Card>
    </form>
  );
}
