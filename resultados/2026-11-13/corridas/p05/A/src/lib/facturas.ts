import type { Factura } from "@/lib/api";

export type Estado = "pendiente" | "vencida" | "pagada" | "anulada";

export const ESTADOS: { id: Estado; plural: string; singular: string }[] = [
  { id: "vencida", plural: "Vencidas", singular: "Vencida" },
  { id: "pendiente", plural: "Pendientes", singular: "Pendiente" },
  { id: "pagada", plural: "Pagadas", singular: "Pagada" },
  { id: "anulada", plural: "Anuladas", singular: "Anulada" },
];

export const estadoInfo = (e: string) => ESTADOS.find((x) => x.id === e) ?? ESTADOS[1];

export const ESTILO_ESTADO: Record<Estado, string> = {
  pendiente: "bg-pendiente-suave text-pendiente",
  vencida: "bg-vencida-suave text-vencida",
  pagada: "bg-pagada-suave text-pagada",
  anulada: "bg-anulada-suave text-anulada",
};

const moneda = new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
  currencyDisplay: "narrowSymbol",
});
export const dinero = (n: number) => moneda.format(n);

const fechaLarga = new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const fechaCorta = new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", timeZone: "UTC" });
export const fecha = (iso: string) => fechaLarga.format(new Date(iso));
export const fechaSinAnio = (iso: string) => fechaCorta.format(new Date(iso));

/** Tasa de ITBMS de la factura en %, deducida de sus propios montos (7 % en Panamá). */
export const tasaItbms = (f: Factura) => (f.subtotal ? Math.round((f.itbms / f.subtotal) * 1000) / 10 : 0);

/** Lo que el cliente debe: facturas pendientes y vencidas. Las anuladas y pagadas no suman. */
export function resumen(facturas: Factura[]) {
  const vencidas = facturas.filter((f) => f.estado === "vencida");
  const pendientes = facturas.filter((f) => f.estado === "pendiente");
  const suma = (l: Factura[]) => l.reduce((s, f) => s + f.total, 0);
  const proxima = [...pendientes].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))[0];
  const masAntigua = [...vencidas].sort((a, b) => a.vencimiento.localeCompare(b.vencimiento))[0];
  return {
    vencido: suma(vencidas),
    porVencer: suma(pendientes),
    nVencidas: vencidas.length,
    nPendientes: pendientes.length,
    proxima,
    masAntigua,
  };
}
