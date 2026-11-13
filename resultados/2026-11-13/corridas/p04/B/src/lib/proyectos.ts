import data from "@/data/proyectos.json";

export type Proyecto = (typeof data.proyectos)[number];
export type Riesgo = "bajo" | "medio" | "alto";

export const proyectos: Proyecto[] = data.proyectos;

/** higher = mejor, lower = mejor, neutral = solo magnitud */
type Sentido = "higher" | "lower" | "neutral";

export type IndicadorId =
  | "avanceFisicoPct"
  | "avanceFinancieroPct"
  | "presupuestoUSD"
  | "ejecutadoUSD"
  | "desviacionCostoPct"
  | "diasAtraso"
  | "hitos"
  | "incidentesSeguridad"
  | "satisfaccionCliente"
  | "personalAsignado"
  | "riesgo";

export interface Indicador {
  id: IndicadorId;
  label: string;
  corto: string;
  sentido: Sentido;
  valor: (p: Proyecto) => number;
  formato: (p: Proyecto) => string;
}

const usd = new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const usdLargo = new Intl.NumberFormat("es-PA", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const num1 = new Intl.NumberFormat("es-PA", { maximumFractionDigits: 1 });
const num2 = new Intl.NumberFormat("es-PA", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const formatoUSDLargo = (n: number) => usdLargo.format(n);
export const formatoUSD = (n: number) => usd.format(n);

const RIESGO_NUM: Record<Riesgo, number> = { bajo: 0, medio: 1, alto: 2 };
export const riesgoDe = (p: Proyecto) => p.riesgo as Riesgo;

/**
 * Los 12 indicadores del archivo. «Hitos cumplidos» y «hitos totales» se muestran juntos
 * (todos los proyectos tienen 10 hitos), así que la lista tiene 11 columnas.
 */
export const INDICADORES: Indicador[] = [
  { id: "avanceFisicoPct", label: "Avance físico", corto: "Físico", sentido: "higher", valor: (p) => p.avanceFisicoPct, formato: (p) => `${p.avanceFisicoPct} %` },
  { id: "avanceFinancieroPct", label: "Avance financiero", corto: "Financ.", sentido: "neutral", valor: (p) => p.avanceFinancieroPct, formato: (p) => `${p.avanceFinancieroPct} %` },
  { id: "desviacionCostoPct", label: "Desviación de costo", corto: "Desv. costo", sentido: "lower", valor: (p) => p.desviacionCostoPct, formato: (p) => `${p.desviacionCostoPct >= 0.05 ? "+" : ""}${num1.format(p.desviacionCostoPct)} %` },
  { id: "diasAtraso", label: "Días de atraso", corto: "Atraso", sentido: "lower", valor: (p) => p.diasAtraso, formato: (p) => `${p.diasAtraso} d` },
  { id: "hitos", label: "Hitos cumplidos", corto: "Hitos", sentido: "higher", valor: (p) => p.hitosCumplidos / p.hitosTotales, formato: (p) => `${p.hitosCumplidos}/${p.hitosTotales}` },
  { id: "incidentesSeguridad", label: "Incidentes de seguridad", corto: "Incid.", sentido: "lower", valor: (p) => p.incidentesSeguridad, formato: (p) => String(p.incidentesSeguridad) },
  { id: "satisfaccionCliente", label: "Satisfacción del cliente", corto: "Satisf.", sentido: "higher", valor: (p) => p.satisfaccionCliente, formato: (p) => num2.format(p.satisfaccionCliente) },
  { id: "presupuestoUSD", label: "Presupuesto", corto: "Presup.", sentido: "neutral", valor: (p) => p.presupuestoUSD, formato: (p) => usd.format(p.presupuestoUSD) },
  { id: "ejecutadoUSD", label: "Ejecutado", corto: "Ejecut.", sentido: "neutral", valor: (p) => p.ejecutadoUSD, formato: (p) => usd.format(p.ejecutadoUSD) },
  { id: "personalAsignado", label: "Personal asignado", corto: "Personal", sentido: "neutral", valor: (p) => p.personalAsignado, formato: (p) => String(p.personalAsignado) },
  { id: "riesgo", label: "Riesgo", corto: "Riesgo", sentido: "lower", valor: (p) => RIESGO_NUM[riesgoDe(p)], formato: (p) => p.riesgo },
];

export const indicadorPorId = (id: IndicadorId) => INDICADORES.find((i) => i.id === id)!;

export type Tono = "bien" | "alerta" | "mal" | "neutro";

/** Umbrales de semáforo por indicador. Solo los que tienen un "mejor" claro. */
export function tono(id: IndicadorId, p: Proyecto): Tono {
  switch (id) {
    case "desviacionCostoPct":
      return p.desviacionCostoPct > 10 ? "mal" : p.desviacionCostoPct > 0 ? "alerta" : "bien";
    case "diasAtraso":
      return p.diasAtraso > 30 ? "mal" : p.diasAtraso > 0 ? "alerta" : "bien";
    case "incidentesSeguridad":
      return p.incidentesSeguridad >= 2 ? "mal" : p.incidentesSeguridad === 1 ? "alerta" : "bien";
    case "satisfaccionCliente":
      return p.satisfaccionCliente < 3.5 ? "mal" : p.satisfaccionCliente < 4 ? "alerta" : "bien";
    case "riesgo":
      return p.riesgo === "alto" ? "mal" : p.riesgo === "medio" ? "alerta" : "bien";
    default:
      return "neutro";
  }
}

export function rango(id: IndicadorId) {
  const ind = indicadorPorId(id);
  const vals = proyectos.map(ind.valor);
  return { min: Math.min(...vals), max: Math.max(...vals) };
}

export function mediana(id: IndicadorId) {
  const ind = indicadorPorId(id);
  const vals = proyectos.map(ind.valor).sort((a, b) => a - b);
  const m = Math.floor(vals.length / 2);
  return vals.length % 2 ? vals[m] : (vals[m - 1] + vals[m]) / 2;
}
