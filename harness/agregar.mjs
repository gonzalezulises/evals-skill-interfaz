#!/usr/bin/env node
// Une la calificación automática y el juicio ciego, deshace el anonimato con clave.json y
// escribe resumen.json con la diferencia A (con skill) − B (sin skill) por pedido y en total.
// Uso: node agregar.mjs <workdir>
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const work = process.argv[2];
const clave = JSON.parse(readFileSync(join(work, "clave.json"), "utf8"));
const auto = JSON.parse(readFileSync(join(work, "resultados-auto.json"), "utf8"));
const CRIT = ["responsive", "jerarquia", "intencion", "estados", "accesibilidad", "graficos", "formularios", "calidad_visual"];
const fallosTot = (r) => r?.fallos ? r.fallos.scrollHorizontal + r.fallos.erroresConsolaRed + r.fallos.tactilChico + r.fallos.sinNombre + r.fallos.sinAlt + r.fallos.textoChico : null;
const media = (o) => { const v = CRIT.map((c) => o?.[c]).filter((x) => typeof x === "number"); return v.length ? +(v.reduce((a, b) => a + b, 0) / v.length).toFixed(2) : null; };

const filas = [];
for (const [id, map] of Object.entries(clave)) {
  const inv = Object.fromEntries(Object.entries(map).map(([etq, cond]) => [cond, etq]));
  const jp = join(work, "juez", id, "juicio.json");
  const j = existsSync(jp) ? JSON.parse(readFileSync(jp, "utf8")) : null;
  const fila = { id };
  for (const cond of ["A", "B"]) {
    const a = auto.find((r) => r.id === id && r.cond === cond);
    fila[cond] = {
      compila: a?.compila ?? null,
      verificadorOK: a?.verificadorOK ?? null,
      fallosVerificador: fallosTot(a),
      detalleFallos: a?.fallos ? Object.fromEntries(Object.entries(a.fallos).filter(([k, v]) => k !== "porAncho" && v)) : null,
      llamadas21st: a?.herramientas?.llamadas21st ?? null,
      corrioVerificador: a?.herramientas?.corrioVerificador ?? null,
      lineasCodigo: a?.lineasCodigo ?? null,
      juez: j ? j[inv[cond]] : null,
      mediaJuez: j ? media(j[inv[cond]]) : null,
      defectos: j ? j[`defectos_${inv[cond]}`] : null,
    };
  }
  fila.preferencia = j ? (j.preferencia === "empate" ? "empate" : map[j.preferencia]) : null;
  fila.motivo = j?.motivo ?? null;
  filas.push(fila);
}
const conJuez = filas.filter((f) => f.preferencia);
const total = {
  pedidos: filas.length,
  prefiereA: conJuez.filter((f) => f.preferencia === "A").length,
  prefiereB: conJuez.filter((f) => f.preferencia === "B").length,
  empates: conJuez.filter((f) => f.preferencia === "empate").length,
  mediaJuezA: +(conJuez.reduce((s, f) => s + (f.A.mediaJuez ?? 0), 0) / (conJuez.length || 1)).toFixed(2),
  mediaJuezB: +(conJuez.reduce((s, f) => s + (f.B.mediaJuez ?? 0), 0) / (conJuez.length || 1)).toFixed(2),
  verificadorOK_A: filas.filter((f) => f.A.verificadorOK).length,
  verificadorOK_B: filas.filter((f) => f.B.verificadorOK).length,
  porCriterio: Object.fromEntries(CRIT.map((c) => { const d = conJuez.map((f) => [f.A.juez?.[c], f.B.juez?.[c]]).filter(([a, b]) => typeof a === "number" && typeof b === "number"); return [c, d.length ? +(d.reduce((s, [a, b]) => s + a - b, 0) / d.length).toFixed(2) : null]; })),
};
writeFileSync(join(work, "resumen.json"), JSON.stringify({ total, filas }, null, 2));
console.log(JSON.stringify(total, null, 2));
