export const CATEGORIAS = [
  "Transporte de carga",
  "Almacenaje y bodegas",
  "Agencia de aduanas",
  "Combustible y lubricantes",
  "Mantenimiento de flota",
  "Material de empaque",
  "Tecnología y software",
  "Servicios profesionales",
  "Otro",
] as const;

export const BANCOS = [
  "Banco General",
  "Banistmo",
  "BAC Credomatic",
  "Banco Nacional de Panamá",
  "Caja de Ahorros",
  "Global Bank",
  "Multibank",
  "Credicorp Bank",
  "Banesco",
  "St. Georges Bank",
] as const;

export const TIPOS_ARCHIVO = ["application/pdf", "image/jpeg", "image/png"];
export const MAX_MB = 5;

export type Campos = {
  razonSocial: string;
  ruc: string;
  dv: string;
  categoria: string;
  contacto: string;
  correo: string;
  telefono: string;
  banco: string;
  cuenta: string;
};

export type Archivos = {
  avisoOperacion: File | null;
  certificadoBancario: File | null;
};

export type Clave = keyof Campos | keyof Archivos;
export type Errores = Partial<Record<Clave, string>>;

export const CAMPOS_VACIOS: Campos = {
  razonSocial: "",
  ruc: "",
  dv: "",
  categoria: "",
  contacto: "",
  correo: "",
  telefono: "",
  banco: "",
  cuenta: "",
};

export const ETIQUETAS: Record<Clave, string> = {
  razonSocial: "Razón social",
  ruc: "RUC",
  dv: "DV",
  categoria: "Categoría del proveedor",
  contacto: "Persona de contacto",
  correo: "Correo electrónico",
  telefono: "Teléfono",
  banco: "Banco",
  cuenta: "Número de cuenta",
  avisoOperacion: "Aviso de operación",
  certificadoBancario: "Certificado bancario",
};

/** Orden en que aparecen los campos en pantalla: define el foco tras un envío con errores. */
export const ORDEN: Clave[] = [
  "razonSocial",
  "ruc",
  "dv",
  "categoria",
  "contacto",
  "correo",
  "telefono",
  "banco",
  "cuenta",
  "avisoOperacion",
  "certificadoBancario",
];

const soloDigitos = (v: string) => v.replace(/\D/g, "");

export function validarCampo(clave: keyof Campos, valor: string): string | undefined {
  const v = valor.trim();
  switch (clave) {
    case "razonSocial":
      if (!v) return "Escribe la razón social tal como aparece en el aviso de operación.";
      if (v.length < 3) return "La razón social debe tener al menos 3 caracteres.";
      return;
    case "ruc":
      if (!v) return "Escribe el RUC.";
      // Persona natural (8-123-4567, PE-12-345, E-8-12345) o jurídica (155612345-2-2015).
      if (!/^[0-9A-Z]{1,10}-\d{1,5}-\d{1,7}$/i.test(v))
        return "Usa el formato con guiones, por ejemplo 155612345-2-2015 o 8-123-4567.";
      return;
    case "dv":
      if (!v) return "Escribe el dígito verificador.";
      if (!/^\d{1,2}$/.test(v)) return "El DV tiene 1 o 2 dígitos.";
      return;
    case "categoria":
      if (!v) return "Elige una categoría.";
      return;
    case "contacto":
      if (!v) return "Escribe el nombre de la persona de contacto.";
      if (!/^[\p{L}][\p{L}'.\- ]+$/u.test(v) || v.split(/\s+/).length < 2)
        return "Escribe nombre y apellido, solo con letras.";
      return;
    case "correo":
      if (!v) return "Escribe el correo de contacto.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) return "Revisa el correo: debe verse como nombre@empresa.com.";
      return;
    case "telefono": {
      if (!v) return "Escribe un teléfono de contacto.";
      if (!/^[+\d\s()-]+$/.test(v)) return "El teléfono solo admite números, espacios, guiones y el prefijo +507.";
      let d = soloDigitos(v);
      if (d.startsWith("507") && d.length > 8) d = d.slice(3);
      if (d.length === 8 && d.startsWith("6")) return;
      if (d.length === 7) return;
      return "Escribe un celular de 8 dígitos (empieza con 6) o un fijo de 7 dígitos.";
    }
    case "banco":
      if (!v) return "Elige el banco.";
      return;
    case "cuenta": {
      if (!v) return "Escribe el número de cuenta.";
      if (!/^[\d\s-]+$/.test(v)) return "El número de cuenta solo admite dígitos.";
      const n = soloDigitos(v).length;
      if (n < 8 || n > 20) return "El número de cuenta tiene entre 8 y 20 dígitos.";
      return;
    }
  }
}

export function validarArchivo(archivo: File | null, etiqueta: string): string | undefined {
  if (!archivo) return `Adjunta el ${etiqueta.toLowerCase()}.`;
  if (!TIPOS_ARCHIVO.includes(archivo.type)) return "Solo se aceptan archivos PDF, JPG o PNG.";
  if (archivo.size > MAX_MB * 1024 * 1024) return `El archivo pesa más de ${MAX_MB} MB.`;
  if (archivo.size === 0) return "El archivo está vacío.";
}

export function validarTodo(campos: Campos, archivos: Archivos): Errores {
  const errores: Errores = {};
  for (const clave of Object.keys(campos) as (keyof Campos)[]) {
    const e = validarCampo(clave, campos[clave]);
    if (e) errores[clave] = e;
  }
  for (const clave of Object.keys(archivos) as (keyof Archivos)[]) {
    const e = validarArchivo(archivos[clave], ETIQUETAS[clave]);
    if (e) errores[clave] = e;
  }
  return errores;
}

export function formatoTamano(bytes: number) {
  return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Simula el envío al backend: tarda ~1,4 s y devuelve un número de solicitud. */
export async function enviarSolicitud(_campos: Campos, _archivos: Archivos): Promise<{ folio: string }> {
  await new Promise((r) => setTimeout(r, 1400));
  const folio = `PRV-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 100000)).padStart(5, "0")}`;
  return { folio };
}
