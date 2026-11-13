export type ClienteRaw = {
  cliente: string;
  saldo0a30: number;
  saldo31a60: number;
  saldo61a90: number;
  saldoMas90: number;
  limiteCredito: number;
};
export type MesRaw = { mes: string; facturado: number; cobrado: number };
export type Cartera = { clientes: ClienteRaw[]; cobradoMensual: MesRaw[] };

export const TRAMOS = [
  { key: "saldo0a30", label: "0–30 días", color: "var(--age-1)" },
  { key: "saldo31a60", label: "31–60 días", color: "var(--age-2)" },
  { key: "saldo61a90", label: "61–90 días", color: "var(--age-3)" },
  { key: "saldoMas90", label: "Más de 90 días", color: "var(--age-4)" },
] as const;
export type TramoKey = (typeof TRAMOS)[number]["key"];

export type Cliente = ClienteRaw & { total: number; uso: number };

export function enriquecer(c: ClienteRaw): Cliente {
  const total = c.saldo0a30 + c.saldo31a60 + c.saldo61a90 + c.saldoMas90;
  return { ...c, total, uso: c.limiteCredito > 0 ? total / c.limiteCredito : 0 };
}

/** Carga diferida de los datos, para tener estados reales de carga y error. */
export async function cargarCartera(): Promise<Cartera> {
  const mod = await import("@/data/cartera.json");
  return mod.default as Cartera;
}

const moneda = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", currencyDisplay: "narrowSymbol", maximumFractionDigits: 0 });
export const usd = (v: number) => moneda.format(v);
export function usdCorto(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toLocaleString("es-PA", { maximumFractionDigits: 2 })} M`;
  if (Math.abs(v) >= 1_000) return `$${Math.round(v / 1_000).toLocaleString("es-PA")} k`;
  return usd(v);
}
export const pct = (v: number, dec = 0) => `${(v * 100).toLocaleString("es-PA", { maximumFractionDigits: dec, minimumFractionDigits: dec })} %`;

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGO = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
export const mesCorto = (m: string) => MESES[Number(m.slice(5, 7)) - 1] ?? m;
export const mesLargo = (m: string) => `${MESES_LARGO[Number(m.slice(5, 7)) - 1] ?? m} ${m.slice(0, 4)}`;
