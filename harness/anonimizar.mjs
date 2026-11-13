#!/usr/bin/env node
// Prepara el material del juez: por pedido, dos carpetas X e Y (según clave.json) con las capturas
// y el código de src/ (sin datos ni PROCESO.md). Borra del código las menciones que delatan la
// condición (21st, el nombre del estándar). El juez nunca ve clave.json.
// Uso: node anonimizar.mjs <workdir>
import { readFileSync, readdirSync, mkdirSync, cpSync, writeFileSync, statSync, existsSync } from "node:fs";
import { join } from "node:path";

const work = process.argv[2];
const clave = JSON.parse(readFileSync(join(work, "clave.json"), "utf8"));
const aqui = new URL(".", import.meta.url).pathname;
const pedidos = JSON.parse(readFileSync(join(aqui, "pedidos.json"), "utf8")).pedidos;
const plantilla = readFileSync(join(aqui, "juez.md"), "utf8");
const delata = /21st(\.dev)?|estandar-interfaz|est[aá]ndar de interfaz|verificar-interfaz/gi;
const limpiar = (dir) => { for (const f of readdirSync(dir)) { const p = join(dir, f); if (statSync(p).isDirectory()) limpiar(p); else if (/\.(tsx?|css)$/.test(f)) writeFileSync(p, readFileSync(p, "utf8").replace(delata, "[ref]")); } };
for (const [id, map] of Object.entries(clave)) {
  for (const [etq, cond] of Object.entries(map)) {
    const origen = join(work, "runs", id, cond);
    const dest = join(work, "juez", id, etq);
    mkdirSync(dest, { recursive: true });
    const caps = join(origen, "_eval", "capturas");
    if (existsSync(caps)) cpSync(caps, join(dest, "capturas"), { recursive: true });
    cpSync(join(origen, "src"), join(dest, "src"), { recursive: true, filter: (s) => !s.includes("/src/data") });
    limpiar(join(dest, "src"));
  }
  const dir = join(work, "juez", id);
  const encargo = pedidos.find((p) => p.id === id).texto;
  writeFileSync(join(dir, "prompt.md"), plantilla.replace("{{ENCARGO}}", encargo).replaceAll("{{DIR}}", dir).replace("{{SALIDA}}", join(dir, "juicio.json")));
}
console.log("material del juez en", join(work, "juez"));
