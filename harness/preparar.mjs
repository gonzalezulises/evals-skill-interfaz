#!/usr/bin/env node
// Prepara una corrida: copia el proyecto base (clon APFS, copia en escritura) a runs/<pedido>/<A|B>,
// asigna un puerto por corrida y escribe el prompt de cada agente constructor en prompt.md.
// A = con el skill estandar-interfaz; B = sin skills. El texto del pedido es idéntico en ambas.
// La asignación A/B → X/Y para el juez se sortea y se guarda en clave.json (el juez nunca la ve).
// Uso: [SKILL_DIR=<dir del skill>] node preparar.mjs <workdir> <fixture> [p01,p03,…|piloto|todos]
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join, dirname } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

const aqui = dirname(fileURLToPath(import.meta.url));
// Skill que se evalúa en la condición A (por defecto, el instalado en ~/.agents).
const skillDir = process.env.SKILL_DIR ?? join(homedir(), ".agents/skills/estandar-interfaz");
const [work, fixture, sel = "piloto"] = process.argv.slice(2);
if (!work || !fixture) { console.error("uso: preparar.mjs <workdir> <fixture> [ids|piloto|todos]"); process.exit(2); }
const bat = JSON.parse(readFileSync(join(aqui, "pedidos.json"), "utf8"));
const ids = sel === "todos" ? bat.pedidos.map((p) => p.id) : sel === "piloto" ? bat.piloto : sel.split(",");

const comun = (dir, port, pedido, extra) => `Eres desarrollador frontend. Trabajas en el proyecto ${dir} (explóralo para ubicarte). Solo puedes crear o modificar archivos dentro de ese directorio, incluidos tus scripts de prueba y capturas. No hagas commits, PR ni despliegues.
Para ver tu trabajo: \`npm run build\` y \`npm run preview -- --port ${port} --strictPort\` (ese puerto es solo tuyo); apaga el servidor al terminar. La pantalla queda en la ruta \`/\`.
${extra}
## Encargo

${pedido}

## Al terminar

Escribe en ${dir}/PROCESO.md qué herramientas, skills o fuentes de diseño consultaste (con ids o enlaces) y qué verificaste. Responde con una línea: LISTO o NO LISTO, y por qué.
`;
const extraA = `
Antes de empezar, lee y sigue \`${join(skillDir, "SKILL.md")}\`, el estándar de interfaz del equipo. Los pasos de PR, merge y revisión por otro agente no aplican aquí: omítelos.
`;
// La condición B excluye solo los skills; el resto de herramientas (MCP de 21st.dev, Playwright, etc.) siguen
// disponibles igual que en A. En el piloto del 2026-11-13, «no uses Skill ni leas ~/.agents» llevó a 2 de 3
// agentes B a creer que 21st también estaba prohibido: la condición medía otra cosa.
const extraB = `
No uses el tool Skill ni leas archivos de ~/.agents ni de ~/.claude. Todas las demás herramientas que tengas (incluidos los MCP) están permitidas.
`;
// Ambas condiciones: los archivos auxiliares (scripts de prueba, capturas) también van dentro del proyecto.

const clave = existsSync(join(work, "clave.json")) ? JSON.parse(readFileSync(join(work, "clave.json"), "utf8")) : {};
for (const id of ids) {
  const p = bat.pedidos.find((x) => x.id === id);
  if (!p) throw new Error(`pedido desconocido: ${id}`);
  const n = Number(id.slice(1));
  for (const cond of ["A", "B"]) {
    const dir = join(work, "runs", id, cond);
    if (existsSync(dir)) { console.log(`ya existe, no se toca: ${dir}`); continue; }
    mkdirSync(dirname(dir), { recursive: true });
    execFileSync("cp", ["-cR", fixture, dir]);
    const port = 4800 + n * 2 + (cond === "A" ? 0 : 1);
    writeFileSync(join(dir, "..", `prompt-${cond}.md`), comun(dir, port, p.texto, cond === "A" ? extraA : extraB));
    writeFileSync(join(dir, "..", `puerto-${cond}`), String(port));
  }
  clave[id] ??= Math.random() < 0.5 ? { X: "A", Y: "B" } : { X: "B", Y: "A" };
}
writeFileSync(join(work, "clave.json"), JSON.stringify(clave, null, 2));
console.log(`preparados: ${ids.join(", ")} en ${join(work, "runs")}`);
