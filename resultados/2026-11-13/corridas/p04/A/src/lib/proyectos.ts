import datos from "@/data/proyectos.json";

export type Proyecto = (typeof datos.proyectos)[number];
export type Riesgo = "bajo" | "medio" | "alto";
export type Estado = "ok" | "alerta" | "critico";

/** Clave por la que se puede comparar y ordenar (hitos se compara por los cumplidos). */
export type ClaveIndicador =
  | "avanceFisicoPct"
  | "avanceFinancieroPct"
  | "desviacionCostoPct"
  | "diasAtraso"
  | "hitosCumplidos"
  | "incidentesSeguridad"
  | "satisfaccionCliente"
  | "riesgo"
  | "presupuestoUSD"
  | "ejecutadoUSD"
  | "personalAsignado";

const RANGO_RIESGO: Record<Riesgo, number> = { bajo: 0, medio: 1, alto: 2 };

const usd = new Intl.NumberFormat("es-PA", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 2,
});
const num = (d = 0) => new Intl.NumberFormat("es-PA", { maximumFractionDigits: d, minimumFractionDigits: d });

export const formatoUSD = (v: number) => usd.format(v);

export interface Indicador {
  clave: ClaveIndicador;
  etiqueta: string;
  /** Rótulo corto para la cabecera de la tabla. */
  corta: string;
  /** Qué es «mejor»: define el orden por defecto del ranking (lo peor primero). */
  mejor: "alto" | "bajo" | "neutro";
  valor: (p: Proyecto) => number;
  texto: (p: Proyecto) => string;
  estado: (p: Proyecto) => Estado;
  /** Umbral explicado al pie del detalle. */
  criterio?: string;
}

export const INDICADORES: Indicador[] = [
  {
    clave: "riesgo",
    etiqueta: "Riesgo",
    corta: "Riesgo",
    mejor: "bajo",
    valor: (p) => RANGO_RIESGO[p.riesgo as Riesgo],
    texto: (p) => p.riesgo.charAt(0).toUpperCase() + p.riesgo.slice(1),
    estado: (p) => (p.riesgo === "alto" ? "critico" : p.riesgo === "medio" ? "alerta" : "ok"),
  },
  {
    clave: "avanceFisicoPct",
    etiqueta: "Avance físico",
    corta: "Av. físico",
    mejor: "alto",
    valor: (p) => p.avanceFisicoPct,
    texto: (p) => `${p.avanceFisicoPct} %`,
    estado: (p) => (p.avanceFinancieroPct - p.avanceFisicoPct > 15 ? "alerta" : "ok"),
    criterio: "Alerta si el avance financiero supera al físico en más de 15 puntos.",
  },
  {
    clave: "avanceFinancieroPct",
    etiqueta: "Avance financiero",
    corta: "Av. financ.",
    mejor: "neutro",
    valor: (p) => p.avanceFinancieroPct,
    texto: (p) => `${p.avanceFinancieroPct} %`,
    estado: (p) => (p.avanceFinancieroPct - p.avanceFisicoPct > 15 ? "alerta" : "ok"),
    criterio: "Alerta si supera al avance físico en más de 15 puntos.",
  },
  {
    clave: "desviacionCostoPct",
    etiqueta: "Desviación de costo",
    corta: "Desv. costo",
    mejor: "bajo",
    valor: (p) => p.desviacionCostoPct,
    texto: (p) => `${p.desviacionCostoPct > 0 ? "+" : ""}${num(1).format(p.desviacionCostoPct)} %`,
    estado: (p) => (p.desviacionCostoPct > 10 ? "critico" : p.desviacionCostoPct > 0 ? "alerta" : "ok"),
    criterio: "Crítico por encima de +10 %; alerta entre 0 y +10 %.",
  },
  {
    clave: "diasAtraso",
    etiqueta: "Días de atraso",
    corta: "Atraso",
    mejor: "bajo",
    valor: (p) => p.diasAtraso,
    texto: (p) => (p.diasAtraso === 0 ? "Al día" : `${p.diasAtraso} d`),
    estado: (p) => (p.diasAtraso > 30 ? "critico" : p.diasAtraso > 0 ? "alerta" : "ok"),
    criterio: "Crítico con más de 30 días; alerta con cualquier atraso.",
  },
  {
    clave: "hitosCumplidos",
    etiqueta: "Hitos cumplidos",
    corta: "Hitos",
    mejor: "alto",
    valor: (p) => p.hitosCumplidos / p.hitosTotales,
    texto: (p) => `${p.hitosCumplidos} de ${p.hitosTotales}`,
    estado: (p) => (p.avanceFisicoPct - (p.hitosCumplidos / p.hitosTotales) * 100 > 30 ? "alerta" : "ok"),
    criterio: "Alerta si los hitos van más de 30 puntos por detrás del avance físico.",
  },
  {
    clave: "incidentesSeguridad",
    etiqueta: "Incidentes de seguridad",
    corta: "Incid.",
    mejor: "bajo",
    valor: (p) => p.incidentesSeguridad,
    texto: (p) => String(p.incidentesSeguridad),
    estado: (p) => (p.incidentesSeguridad >= 2 ? "critico" : p.incidentesSeguridad === 1 ? "alerta" : "ok"),
    criterio: "Crítico con 2 o más; alerta con 1.",
  },
  {
    clave: "satisfaccionCliente",
    etiqueta: "Satisfacción del cliente",
    corta: "Satisf.",
    mejor: "alto",
    valor: (p) => p.satisfaccionCliente,
    texto: (p) => `${num(1).format(p.satisfaccionCliente)} / 5`,
    estado: (p) => (p.satisfaccionCliente < 3.5 ? "critico" : p.satisfaccionCliente < 4 ? "alerta" : "ok"),
    criterio: "Crítico por debajo de 3,5; alerta por debajo de 4.",
  },
  {
    clave: "presupuestoUSD",
    etiqueta: "Presupuesto",
    corta: "Presup.",
    mejor: "neutro",
    valor: (p) => p.presupuestoUSD,
    texto: (p) => formatoUSD(p.presupuestoUSD),
    estado: () => "ok",
  },
  {
    clave: "ejecutadoUSD",
    etiqueta: "Ejecutado",
    corta: "Ejecutado",
    mejor: "neutro",
    valor: (p) => p.ejecutadoUSD,
    texto: (p) => formatoUSD(p.ejecutadoUSD),
    estado: () => "ok",
  },
  {
    clave: "personalAsignado",
    etiqueta: "Personal asignado",
    corta: "Personal",
    mejor: "neutro",
    valor: (p) => p.personalAsignado,
    texto: (p) => `${p.personalAsignado} pers.`,
    estado: () => "ok",
  },
];

export const indicador = (c: ClaveIndicador) => INDICADORES.find((i) => i.clave === c)!;

/** Indicadores en estado crítico o de alerta, sin contar el riesgo (que se muestra aparte). */
export function alertas(p: Proyecto) {
  let critico = 0;
  let alerta = 0;
  for (const i of INDICADORES) {
    // riesgo va en su insignia; avance financiero repite la regla de avance físico
    if (i.clave === "riesgo" || i.clave === "avanceFinancieroPct") continue;
    const e = i.estado(p);
    if (e === "critico") critico++;
    else if (e === "alerta") alerta++;
  }
  return { critico, alerta };
}

export function mediana(valores: number[]) {
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}
