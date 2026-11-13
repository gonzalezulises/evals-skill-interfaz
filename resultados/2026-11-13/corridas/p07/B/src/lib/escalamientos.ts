import tickets from "@/data/tickets.json";

export type Ticket = (typeof tickets)[number];
export type Prioridad = "crítica" | "alta" | "media" | "baja";

export const PRIORIDADES: Prioridad[] = ["crítica", "alta", "media", "baja"];
export const TODOS: Ticket[] = tickets;

/** Un ticket sigue abierto mientras no esté resuelto. */
export const estaAbierto = (t: Ticket) => t.estado !== "resuelto";
/** El SLA mide la primera respuesta contra el objetivo de su prioridad. */
export const cumpleSla = (t: Ticket) => t.primeraRespuestaHoras <= t.slaHoras;

export function mediana(valores: number[]): number | null {
  if (valores.length === 0) return null;
  const v = [...valores].sort((a, b) => a - b);
  const m = Math.floor(v.length / 2);
  return v.length % 2 ? v[m] : (v[m - 1] + v[m]) / 2;
}

export function pct(parte: number, total: number): number | null {
  return total === 0 ? null : (parte / total) * 100;
}

export const fechaCorte = TODOS.reduce((max, t) => (t.abierto > max ? t.abierto : max), "");

export function resumenPorPrioridad() {
  return PRIORIDADES.map((p) => {
    const delGrupo = TODOS.filter((t) => t.prioridad === p);
    const abiertos = delGrupo.filter(estaAbierto);
    return {
      prioridad: p,
      slaHoras: delGrupo[0]?.slaHoras ?? null,
      total: delGrupo.length,
      abiertos: abiertos.length,
      cumplen: delGrupo.filter(cumpleSla).length,
    };
  });
}

export type FilaAgente = {
  agente: string;
  total: number;
  abiertos: number;
  medianaRespuesta: number | null;
  cumplimiento: number | null;
  fueraSla: number;
};

export function resumenPorAgente(): FilaAgente[] {
  const agentes = [...new Set(TODOS.map((t) => t.agente))];
  return agentes.map((agente) => {
    const suyos = TODOS.filter((t) => t.agente === agente);
    const cumplen = suyos.filter(cumpleSla).length;
    return {
      agente,
      total: suyos.length,
      abiertos: suyos.filter(estaAbierto).length,
      medianaRespuesta: mediana(suyos.map((t) => t.primeraRespuestaHoras)),
      cumplimiento: pct(cumplen, suyos.length),
      fueraSla: suyos.length - cumplen,
    };
  });
}

const nf1 = new Intl.NumberFormat("es-PA", { maximumFractionDigits: 1, minimumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("es-PA", { maximumFractionDigits: 0 });
export const fmtHoras = (h: number | null) => (h === null ? "—" : `${nf1.format(h)} h`);
export const fmtPct = (p: number | null) => (p === null ? "—" : `${nf0.format(p)} %`);
export const fmtNum = (n: number) => nf0.format(n);
export function fmtFecha(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-PA", { day: "numeric", month: "short", year: "numeric" });
}
