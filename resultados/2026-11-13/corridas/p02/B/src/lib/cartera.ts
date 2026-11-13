import data from "@/data/cartera.json";

export type ClienteRaw = (typeof data.clientes)[number];

export const TRAMOS = [
  { key: "saldo0a30", label: "0–30 días", short: "0–30", color: "var(--age-1)" },
  { key: "saldo31a60", label: "31–60 días", short: "31–60", color: "var(--age-2)" },
  { key: "saldo61a90", label: "61–90 días", short: "61–90", color: "var(--age-3)" },
  { key: "saldoMas90", label: "Más de 90 días", short: "+90", color: "var(--age-4)" },
] as const;

export type TramoKey = (typeof TRAMOS)[number]["key"];

export interface Cliente extends ClienteRaw {
  total: number;
  vencido60: number;
  usoLimite: number;
  sobreLimite: boolean;
}

export const clientes: Cliente[] = data.clientes.map((c) => {
  const total = c.saldo0a30 + c.saldo31a60 + c.saldo61a90 + c.saldoMas90;
  return {
    ...c,
    total,
    vencido60: c.saldo61a90 + c.saldoMas90,
    usoLimite: c.limiteCredito > 0 ? total / c.limiteCredito : 0,
    sobreLimite: total > c.limiteCredito,
  };
});

export const totalCartera = clientes.reduce((n, c) => n + c.total, 0);

export const porTramo = TRAMOS.map((t) => {
  const valor = clientes.reduce((n, c) => n + c[t.key], 0);
  return { ...t, valor, pct: totalCartera ? valor / totalCartera : 0 };
});

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MESES_LARGOS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export const mesCorto = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES[m - 1]} ${String(y).slice(2)}`;
};
export const mesLargo = (ym: string) => {
  const [y, m] = ym.split("-").map(Number);
  return `${MESES_LARGOS[m - 1]} ${y}`;
};

export const mensual = data.cobradoMensual.map((m) => ({
  ...m,
  etiqueta: mesCorto(m.mes),
  tasa: m.facturado ? m.cobrado / m.facturado : 0,
}));

const nf0 = new Intl.NumberFormat("es-419", { maximumFractionDigits: 0 });
const nf1 = new Intl.NumberFormat("es-419", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const nf2 = new Intl.NumberFormat("es-419", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** $2,607,796 */
export const money = (v: number) => `$${nf0.format(v)}`;
/** $2.61 M · $383 k */
export const moneyShort = (v: number) => {
  const a = Math.abs(v);
  if (a >= 1e6) return `$${nf2.format(v / 1e6)} M`;
  if (a >= 1e3) return `$${nf0.format(v / 1e3)} k`;
  return `$${nf0.format(v)}`;
};
export const pct = (v: number) => `${nf1.format(v * 100)} %`;
