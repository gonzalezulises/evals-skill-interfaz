import type ordenesJson from "@/data/ordenes.json";

export type Orden = (typeof ordenesJson)[number];
export type Estado = "borrador" | "aprobada" | "enviada" | "recibida parcial" | "recibida" | "cancelada";

/** Estados en los que el dinero está comprometido con el proveedor y falta recibir mercancía. */
export const ESTADOS_ABIERTOS: readonly string[] = ["aprobada", "enviada", "recibida parcial"];

export const ESTADOS: { id: Estado; label: string }[] = [
  { id: "borrador", label: "Borrador" },
  { id: "aprobada", label: "Aprobada" },
  { id: "enviada", label: "Enviada" },
  { id: "recibida parcial", label: "Recibida parcial" },
  { id: "recibida", label: "Recibida" },
  { id: "cancelada", label: "Cancelada" },
];

const DIA = 86_400_000;

export function hoyISO(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function diasEntre(desdeISO: string, hastaISO: string): number {
  return Math.round((Date.parse(hastaISO) - Date.parse(desdeISO)) / DIA);
}

export function esAbierta(o: Orden): boolean {
  return ESTADOS_ABIERTOS.includes(o.estado);
}

/** Días de atraso de una orden abierta cuya fecha prometida ya pasó; 0 si no está atrasada. */
export function diasAtraso(o: Orden, hoy: string): number {
  if (!esAbierta(o)) return 0;
  return Math.max(0, diasEntre(o.fechaEntregaPrometida, hoy));
}

export const TRAMOS = [
  { id: "1-30", label: "1–30 días", min: 1, max: 30 },
  { id: "31-60", label: "31–60 días", min: 31, max: 60 },
  { id: "61-90", label: "61–90 días", min: 61, max: 90 },
  { id: "90+", label: "Más de 90 días", min: 91, max: Infinity },
] as const;
export type TramoId = (typeof TRAMOS)[number]["id"];

export function tramoDe(dias: number): TramoId | null {
  return TRAMOS.find((t) => dias >= t.min && dias <= t.max)?.id ?? null;
}

export function resumen(ordenes: Orden[], hoy: string) {
  const abiertas = ordenes.filter(esAbierta);
  const atrasadas = abiertas.filter((o) => diasAtraso(o, hoy) > 0);
  const suma = (xs: Orden[]) => xs.reduce((s, o) => s + o.monto, 0);
  const recibidas = ordenes.filter((o) => o.fechaRecepcion);
  const aTiempo = recibidas.filter((o) => o.fechaRecepcion! <= o.fechaEntregaPrometida);

  const porMes = new Map<string, number>();
  for (const o of abiertas) porMes.set(o.fechaEmision.slice(0, 7), (porMes.get(o.fechaEmision.slice(0, 7)) ?? 0) + o.monto);

  const porCentro = new Map<string, number>();
  for (const o of abiertas) porCentro.set(o.centroCosto, (porCentro.get(o.centroCosto) ?? 0) + o.monto);

  const porTramo = TRAMOS.map((t) => {
    const xs = atrasadas.filter((o) => tramoDe(diasAtraso(o, hoy)) === t.id);
    return { ...t, ordenes: xs.length, monto: suma(xs) };
  });

  return {
    comprometido: suma(abiertas),
    abiertas: abiertas.length,
    atrasadas: atrasadas.length,
    montoAtrasado: suma(atrasadas),
    atrasoPromedio: atrasadas.length ? atrasadas.reduce((s, o) => s + diasAtraso(o, hoy), 0) / atrasadas.length : 0,
    recibidas: recibidas.length,
    aTiempo: aTiempo.length,
    porMes: [...porMes.entries()].sort(([a], [b]) => a.localeCompare(b)),
    porCentro: [...porCentro.entries()].sort(([, a], [, b]) => b - a),
    porTramo,
  };
}

export async function cargarOrdenes(): Promise<Orden[]> {
  const mod = await import("@/data/ordenes.json");
  return mod.default as Orden[];
}

const usd = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 2, minimumFractionDigits: 2 });
const usdCompacto = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 2 });
const fechaCorta = new Intl.DateTimeFormat("es-PA", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const mesCorto = new Intl.DateTimeFormat("es-PA", { month: "short", timeZone: "UTC" });

export const fmt = {
  usd: (n: number) => usd.format(n),
  usdCompacto: (n: number) => usdCompacto.format(n),
  fecha: (iso: string) => fechaCorta.format(new Date(`${iso}T00:00:00Z`)),
  mes: (yyyyMm: string) => mesCorto.format(new Date(`${yyyyMm}-01T00:00:00Z`)).replace(".", ""),
  pct: (n: number) => `${Math.round(n * 100)} %`,
};
