import data from "@/data/facturas.json";

export type Estado = "pendiente" | "vencida" | "pagada" | "anulada";

export interface Linea {
  descripcion: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Factura {
  numero: string;
  emision: string;
  vencimiento: string;
  estado: Estado;
  lineas: Linea[];
  subtotal: number;
  itbms: number;
  total: number;
}

export const facturas: Factura[] = (data as Factura[])
  .slice()
  .sort((a, b) => b.emision.localeCompare(a.emision) || b.numero.localeCompare(a.numero));

export const ESTADOS: { value: Estado; label: string; plural: string }[] = [
  { value: "pendiente", label: "Pendiente", plural: "Pendientes" },
  { value: "vencida", label: "Vencida", plural: "Vencidas" },
  { value: "pagada", label: "Pagada", plural: "Pagadas" },
  { value: "anulada", label: "Anulada", plural: "Anuladas" },
];

const money = new Intl.NumberFormat("es-PA", { style: "currency", currency: "PAB" });
const number = new Intl.NumberFormat("es-PA", { maximumFractionDigits: 2 });
const date = new Intl.DateTimeFormat("es-PA", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export const fmtMoney = (n: number) => money.format(n);
export const fmtNumber = (n: number) => number.format(n);
export const fmtDate = (iso: string) => date.format(new Date(iso));

export const importeLinea = (l: Linea) => Math.round(l.cantidad * l.precioUnitario * 100) / 100;

/** Tasa de ITBMS aplicada, derivada de los montos de la factura (p. ej. 7). */
export const tasaItbms = (f: Factura) =>
  f.subtotal > 0 ? Math.round((f.itbms / f.subtotal) * 100) : 0;

export const esEstado = (v: string | null): v is Estado =>
  ESTADOS.some((e) => e.value === v);
