import raw from "@/data/clima.json";

export interface Dimension {
  dimension: string;
  puntaje: number;
  anterior: number;
}
export interface Celda {
  area: string;
  dimension: string;
  puntaje: number;
  n: number;
}
export interface Comentario {
  area: string;
  tema: string;
  texto: string;
}
export interface Clima {
  respuestas: number;
  invitados: number;
  enps: { promotores: number; pasivos: number; detractores: number };
  dimensiones: Dimension[];
  porArea: Celda[];
  comentarios: Comentario[];
}

export type Carga =
  | { estado: "ok"; datos: Clima }
  | { estado: "vacio" }
  | { estado: "error"; motivo: string };

const esNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

/** Valida la forma del archivo antes de pintar: un dato roto se muestra como error, no como un cero. */
export function cargarClima(fuente: unknown = raw): Carga {
  const d = fuente as Partial<Clima> | null;
  if (!d || typeof d !== "object") return { estado: "error", motivo: "El archivo de resultados no tiene el formato esperado." };
  if (!esNum(d.respuestas) || !esNum(d.invitados)) return { estado: "error", motivo: "Faltan el total de respuestas o de invitados." };
  if (d.respuestas === 0) return { estado: "vacio" };
  const e = d.enps;
  if (!e || !esNum(e.promotores) || !esNum(e.pasivos) || !esNum(e.detractores))
    return { estado: "error", motivo: "Faltan los conteos de eNPS (promotores, pasivos y detractores)." };
  if (!Array.isArray(d.dimensiones) || !d.dimensiones.every((x) => esNum(x?.puntaje) && esNum(x?.anterior)))
    return { estado: "error", motivo: "Los puntajes por dimensión están incompletos." };
  return {
    estado: "ok",
    datos: {
      respuestas: d.respuestas,
      invitados: d.invitados,
      enps: e,
      dimensiones: d.dimensiones,
      porArea: Array.isArray(d.porArea) ? d.porArea : [],
      comentarios: Array.isArray(d.comentarios) ? d.comentarios : [],
    },
  };
}

export function calcEnps({ promotores, pasivos, detractores }: Clima["enps"]) {
  const total = promotores + pasivos + detractores;
  const pct = (v: number) => (total ? (v / total) * 100 : 0);
  return {
    total,
    valor: Math.round(pct(promotores) - pct(detractores)),
    pProm: pct(promotores),
    pPas: pct(pasivos),
    pDet: pct(detractores),
  };
}

const fmt2 = new Intl.NumberFormat("es", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt1 = new Intl.NumberFormat("es", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt0 = new Intl.NumberFormat("es", { maximumFractionDigits: 0 });

export const f2 = (v: number) => fmt2.format(v);
export const f1 = (v: number) => fmt1.format(v);
export const f0 = (v: number) => fmt0.format(v);
/** Diferencia con signo explícito y menos tipográfico. */
export const fDelta = (v: number) => {
  const r = Math.round(v * 100) / 100;
  if (r === 0) return "±0,00";
  return `${r > 0 ? "+" : "−"}${fmt2.format(Math.abs(r))}`;
};
export const fSigned = (v: number) => (v > 0 ? `+${f0(v)}` : v < 0 ? `−${f0(Math.abs(v))}` : "0");

export const media = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

/** Banda de la escala 1–5 para el mapa de calor (divergente, centro gris en 3,0–3,5). */
export function banda(v: number): 1 | 2 | 3 | 4 | 5 {
  if (v < 2.5) return 1;
  if (v < 3) return 2;
  if (v < 3.5) return 3;
  if (v < 4) return 4;
  return 5;
}
export const BANDAS: { b: 1 | 2 | 3 | 4 | 5; label: string }[] = [
  { b: 1, label: "< 2,5" },
  { b: 2, label: "2,5–2,9" },
  { b: 3, label: "3,0–3,4" },
  { b: 4, label: "3,5–3,9" },
  { b: 5, label: "≥ 4,0" },
];
