import data from "@/data/ordenes.json";

export type Orden = (typeof data)[number];
export type Estado = "borrador" | "aprobada" | "enviada" | "recibida parcial" | "recibida" | "cancelada";

export const ordenes: Orden[] = data;

/** Estados en los que la orden ya compromete dinero y todavía no se cerró. */
export const ESTADOS_ABIERTOS: Estado[] = ["aprobada", "enviada", "recibida parcial"];

export const ESTADOS: Estado[] = ["borrador", "aprobada", "enviada", "recibida parcial", "recibida", "cancelada"];

const DAY = 86_400_000;

/** Fecha de corte: hoy, en la zona horaria del navegador, como YYYY-MM-DD. */
export function hoyISO(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function diffDias(a: string, b: string): number {
  return Math.round((Date.parse(a) - Date.parse(b)) / DAY);
}

export function esAbierta(o: Orden): boolean {
  return ESTADOS_ABIERTOS.includes(o.estado as Estado);
}

/** Días de atraso de una orden abierta a la fecha de corte (0 si está en plazo o cerrada). */
export function diasAtraso(o: Orden, corte: string): number {
  if (!esAbierta(o)) return 0;
  return Math.max(0, diffDias(corte, o.fechaEntregaPrometida));
}

/** Días entre la promesa y la recepción real (negativo = llegó antes). Null si no se ha recibido. */
export function desvioRecepcion(o: Orden): number | null {
  return o.fechaRecepcion ? diffDias(o.fechaRecepcion, o.fechaEntregaPrometida) : null;
}

export const TRAMOS = [
  { id: "1-30", label: "1–30 días", min: 1, max: 30 },
  { id: "31-60", label: "31–60 días", min: 31, max: 60 },
  { id: "61-90", label: "61–90 días", min: 61, max: 90 },
  { id: "90+", label: "Más de 90", min: 91, max: Infinity },
] as const;
export type TramoId = (typeof TRAMOS)[number]["id"];

export function tramoDe(dias: number): TramoId | null {
  return TRAMOS.find((t) => dias >= t.min && dias <= t.max)?.id ?? null;
}

const usd = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", minimumFractionDigits: 2 });
const usdCompact = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });

export const fmtUSD = (n: number) => usd.format(n);
export const fmtUSDcents = (n: number) => usdCents.format(n);
export const fmtUSDcompact = (n: number) => usdCompact.format(n);

const fecha = new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
export const fmtFecha = (iso: string) => fecha.format(new Date(`${iso}T00:00:00Z`));
