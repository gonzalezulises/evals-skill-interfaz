import ordenes from "@/data/ordenes.json";

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

export const CATEGORIAS = [
  "Combustible",
  "Llantas y repuestos",
  "Mantenimiento y talleres",
  "Transporte y fletes",
  "Materiales de construcción",
  "Tecnología y telecomunicaciones",
  "Papelería y oficina",
  "Servicios generales",
] as const;

export const ARCHIVO_TIPOS = [".pdf", ".jpg", ".jpeg", ".png"];
export const ARCHIVO_MAX = 5 * 1024 * 1024;

export type Valores = {
  razonSocial: string;
  ruc: string;
  dv: string;
  contacto: string;
  correo: string;
  telefono: string;
  banco: string;
  tipoCuenta: "" | "corriente" | "ahorros";
  numeroCuenta: string;
  categoria: string;
  avisoOperacion: File | null;
  certificadoBancario: File | null;
};

export type Campo = keyof Valores;
export type Errores = Partial<Record<Campo, string>>;

export const VACIO: Valores = {
  razonSocial: "",
  ruc: "",
  dv: "",
  contacto: "",
  correo: "",
  telefono: "",
  banco: "",
  tipoCuenta: "",
  numeroCuenta: "",
  categoria: "",
  avisoOperacion: null,
  certificadoBancario: null,
};

const PROVEEDORES_EXISTENTES = new Set(ordenes.map((o) => normalizar(o.proveedor)));

function normalizar(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}

/** Aviso no bloqueante: la razón social ya aparece en órdenes de compra. */
export function posibleDuplicado(razonSocial: string) {
  const n = normalizar(razonSocial).replace(/,?\s*(s\.?\s*a\.?|inc\.?|corp\.?)$/, "");
  return n.length > 2 && PROVEEDORES_EXISTENTES.has(n);
}

export function formatoBytes(b: number) {
  if (b < 1024 * 1024) return `${Math.max(1, Math.round(b / 1024))} KB`;
  return `${(b / 1024 / 1024).toFixed(1).replace(".", ",")} MB`;
}

export function validarArchivo(f: File | null): string | undefined {
  if (!f) return "Adjunta el documento.";
  const ext = "." + (f.name.split(".").pop() ?? "").toLowerCase();
  if (!ARCHIVO_TIPOS.includes(ext)) return `El formato ${ext.slice(1).toUpperCase()} no se acepta. Usa PDF, JPG o PNG.`;
  if (f.size > ARCHIVO_MAX) return `Pesa ${formatoBytes(f.size)}; el máximo es 5 MB.`;
  if (f.size === 0) return "El archivo está vacío.";
  return undefined;
}

const soloDigitos = (s: string) => s.replace(/[\s-]/g, "");

export function validarCampo(campo: Campo, v: Valores): string | undefined {
  switch (campo) {
    case "razonSocial": {
      const s = v.razonSocial.trim();
      if (!s) return "Escribe la razón social como aparece en el aviso de operación.";
      if (s.length < 3) return "La razón social debe tener al menos 3 caracteres.";
      return undefined;
    }
    case "ruc": {
      const s = v.ruc.trim().toUpperCase();
      if (!s) return "Escribe el RUC.";
      if (!/^[0-9A-Z]{1,12}(-[0-9]{1,8}){2,3}$/.test(s))
        return "Formato no válido. Ejemplos: 155712345-2-2021 (empresa) u 8-123-4567 (persona natural).";
      return undefined;
    }
    case "dv":
      if (!v.dv.trim()) return "Escribe el dígito verificador.";
      if (!/^\d{1,2}$/.test(v.dv.trim())) return "El DV son 1 o 2 dígitos.";
      return undefined;
    case "contacto":
      if (!v.contacto.trim()) return "Escribe el nombre de la persona de contacto.";
      if (!/^[\p{L}][\p{L} .'-]{2,}$/u.test(v.contacto.trim())) return "Usa solo letras: nombre y apellido.";
      return undefined;
    case "correo":
      if (!v.correo.trim()) return "Escribe el correo de contacto.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.correo.trim())) return "Revisa el correo; debe tener la forma nombre@empresa.com.";
      return undefined;
    case "telefono": {
      const d = soloDigitos(v.telefono).replace(/^\+?507/, "");
      if (!d) return "Escribe un teléfono de contacto.";
      if (!/^(\d{7}|6\d{7})$/.test(d)) return "Usa 7 dígitos (fijo) u 8 dígitos que empiecen con 6 (celular).";
      return undefined;
    }
    case "banco":
      return v.banco ? undefined : "Elige el banco.";
    case "tipoCuenta":
      return v.tipoCuenta ? undefined : "Elige si la cuenta es corriente o de ahorros.";
    case "numeroCuenta": {
      const d = soloDigitos(v.numeroCuenta);
      if (!d) return "Escribe el número de cuenta.";
      if (!/^\d{6,20}$/.test(d)) return "El número de cuenta lleva solo dígitos (entre 6 y 20).";
      return undefined;
    }
    case "categoria":
      return v.categoria ? undefined : "Elige la categoría del proveedor.";
    case "avisoOperacion":
      return validarArchivo(v.avisoOperacion);
    case "certificadoBancario":
      return validarArchivo(v.certificadoBancario);
  }
}

export const ORDEN_CAMPOS: Campo[] = [
  "razonSocial", "ruc", "dv", "categoria",
  "contacto", "correo", "telefono",
  "banco", "tipoCuenta", "numeroCuenta",
  "avisoOperacion", "certificadoBancario",
];

export function validarTodo(v: Valores): Errores {
  const e: Errores = {};
  for (const c of ORDEN_CAMPOS) {
    const m = validarCampo(c, v);
    if (m) e[c] = m;
  }
  return e;
}

/** No hay backend: simula el envío (1,2 s). Falla si el navegador está sin conexión. */
export async function enviarSolicitud(v: Valores): Promise<{ folio: string; fecha: Date }> {
  await new Promise((r) => setTimeout(r, 1200));
  if (typeof navigator !== "undefined" && navigator.onLine === false)
    throw new Error("Sin conexión a internet.");
  void v;
  const folio = `PRV-${new Date().getFullYear()}-${String(Math.floor(1000 + Math.random() * 9000))}`;
  return { folio, fecha: new Date() };
}
