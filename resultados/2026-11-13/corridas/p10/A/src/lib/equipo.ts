import equipo from "@/data/equipo.json";

export type Rol = "propietario" | "administrador" | "editor" | "lector";
export type Miembro = {
  id: string;
  nombre: string;
  correo: string;
  rol: Rol;
  estado: "activo" | "pendiente";
  ultimoAcceso: string;
};

export const ROLES: { value: Exclude<Rol, "propietario">; label: string; ayuda: string }[] = [
  { value: "administrador", label: "Administrador", ayuda: "Gestiona usuarios, facturación y toda la configuración." },
  { value: "editor", label: "Editor", ayuda: "Crea y modifica órdenes, inventario y despachos." },
  { value: "lector", label: "Lector", ayuda: "Solo consulta; no puede modificar datos." },
];

export const ETIQUETA_ROL: Record<Rol, string> = {
  propietario: "Propietario",
  administrador: "Administrador",
  editor: "Editor",
  lector: "Lector",
};

/** Simula la API de usuarios del equipo (0,6–1,4 s). Con `?equipo=error` o `?equipo=vacio` fuerza esos estados. */
export async function fetchEquipo(): Promise<Miembro[]> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 800));
  const modo = new URLSearchParams(window.location.search).get("equipo");
  if (modo === "error") throw new Error("El servicio de usuarios no respondió (tiempo de espera agotado).");
  if (modo === "vacio") return (equipo as Miembro[]).filter((m) => m.rol === "propietario");
  return equipo as Miembro[];
}
