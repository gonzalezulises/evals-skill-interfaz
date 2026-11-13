import tickets from "@/data/tickets.json";

export type Ticket = (typeof tickets)[number];
export type Prioridad = "crítica" | "alta" | "media" | "baja";

export const PRIORIDADES: Prioridad[] = ["crítica", "alta", "media", "baja"];

/** Fecha de corte: el último día con tickets en el archivo (no la fecha de hoy). */
export const CORTE = tickets.reduce((max, t) => (t.abierto > max ? t.abierto : max), "");

const DIA = 86_400_000;

/**
 * Simula la API de tickets. `?estado=error|vacio|cargando` en la URL fuerza cada estado de la
 * pantalla para poder revisarlos.
 */
export async function fetchTickets(): Promise<Ticket[]> {
  const forzado = new URLSearchParams(window.location.search).get("estado");
  await new Promise((r) => setTimeout(r, forzado === "cargando" ? 1e9 : 350));
  if (forzado === "error") throw new Error("La API de soporte no respondió (tiempo de espera agotado).");
  if (forzado === "vacio") return [];
  return tickets;
}

export const estaAbierto = (t: Ticket) => t.estado !== "resuelto";
/** El SLA se mide sobre la primera respuesta: cumple si llegó dentro de las horas de su prioridad. */
export const cumpleSla = (t: Ticket) => t.primeraRespuestaHoras <= t.slaHoras;
/** Días desde la apertura hasta la fecha de corte. */
export const diasAbierto = (t: Ticket) =>
  Math.round((Date.parse(CORTE) - Date.parse(t.abierto)) / DIA);
/** Solo cuenta la resolución de tickets resueltos que traen el dato. */
export const resolucionValida = (t: Ticket) =>
  t.estado === "resuelto" && t.resolucionHoras !== null ? t.resolucionHoras : null;

export function mediana(xs: number[]): number | null {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

export const pctSla = (ts: Ticket[]) => (ts.length ? ts.filter(cumpleSla).length / ts.length : null);

/** Tickets abiertos en una ventana de días antes del corte: [desde, hasta). */
export const ventana = (ts: Ticket[], desde: number, hasta: number) =>
  ts.filter((t) => {
    const d = diasAbierto(t);
    return d >= desde && d < hasta;
  });

/** Cumplimiento de SLA por semana de apertura, de la más antigua a la más reciente. */
export function slaSemanal(ts: Ticket[]): { semana: string; pct: number; n: number }[] {
  const grupos = new Map<number, Ticket[]>();
  for (const t of ts) {
    const k = Math.floor(diasAbierto(t) / 7);
    grupos.set(k, [...(grupos.get(k) ?? []), t]);
  }
  return [...grupos.entries()]
    .sort((a, b) => b[0] - a[0])
    .map(([k, g]) => ({
      semana: new Date(Date.parse(CORTE) - (k * 7 + 6) * DIA).toISOString().slice(0, 10),
      pct: (pctSla(g) ?? 0) * 100,
      n: g.length,
    }));
}

const RIESGO: Record<Prioridad, number> = { crítica: 0, alta: 1, media: 2, baja: 3 };
/** Orden de atención: fuera de SLA primero, luego prioridad, luego antigüedad. */
export const porRiesgo = (a: Ticket, b: Ticket) =>
  Number(cumpleSla(a)) - Number(cumpleSla(b)) ||
  RIESGO[a.prioridad as Prioridad] - RIESGO[b.prioridad as Prioridad] ||
  diasAbierto(b) - diasAbierto(a);

export const horas = (h: number | null) =>
  h === null ? "—" : `${h.toLocaleString("es", { maximumFractionDigits: 1 })} h`;
export const pct = (p: number | null) =>
  p === null ? "—" : `${(p * 100).toLocaleString("es", { maximumFractionDigits: 0 })} %`;
export const fecha = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("es", { day: "numeric", month: "short", year: "numeric" });
