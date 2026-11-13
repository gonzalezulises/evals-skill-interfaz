#!/usr/bin/env node
// Calificación automática de cada corrida: compila (tsc + vite build), sirve el build y corre
// verificar-interfaz.mjs a 390/768/1440. Si se le pasa agentes.json ({ "p01/A": "<ruta transcript .jsonl>" }),
// cuenta en el transcript qué herramientas usó el agente de verdad (no lo que dice PROCESO.md).
// Uso: [SKILL_DIR=<dir del skill>] node evaluar.mjs <workdir> [agentes.json]
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";

const skillDir = process.env.SKILL_DIR ?? join(homedir(), ".agents/skills/estandar-interfaz");
const verificador = join(skillDir, "scripts", "verificar-interfaz.mjs");
const [work, agentesPath] = process.argv.slice(2);
const agentes = agentesPath && existsSync(agentesPath) ? JSON.parse(readFileSync(agentesPath, "utf8")) : {};
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

function herramientas(transcript) {
  if (!transcript || !existsSync(transcript)) return null;
  const cuenta = {};
  let verifico = 0;
  for (const linea of readFileSync(transcript, "utf8").split("\n")) {
    if (!linea.includes('"tool_use"')) continue;
    let j; try { j = JSON.parse(linea); } catch { continue; }
    for (const b of j?.message?.content ?? []) {
      if (b.type !== "tool_use") continue;
      cuenta[b.name] = (cuenta[b.name] ?? 0) + 1;
      if (b.name === "Bash" && /verificar-interfaz/.test(b.input?.command ?? "")) verifico++;
      if (b.name === "Skill") cuenta[`Skill:${b.input?.skill}`] = (cuenta[`Skill:${b.input?.skill}`] ?? 0) + 1;
    }
  }
  const de21st = Object.entries(cuenta).filter(([k]) => k.startsWith("mcp__plugin_21st")).reduce((a, [, v]) => a + v, 0);
  return { llamadas21st: de21st, corrioVerificador: verifico, porHerramienta: cuenta };
}

function leerFallos(texto) {
  const r = { scrollHorizontal: 0, erroresConsolaRed: 0, tactilChico: 0, sinNombre: 0, sinAlt: 0, textoChico: 0, porAncho: {} };
  for (const l of texto.split("\n")) {
    const ancho = l.match(/@(\d+)px/)?.[1]; if (!ancho) continue;
    const suma = (k, n) => { r[k] += n; (r.porAncho[ancho] ??= {})[k] = n; };
    let m;
    if ((m = l.match(/scroll horizontal de (\d+)px/))) suma("scrollHorizontal", 1);
    if ((m = l.match(/: (\d+) errores de consola/))) suma("erroresConsolaRed", +m[1]);
    if ((m = l.match(/: (\d+) controles </))) suma("tactilChico", +m[1]);
    if ((m = l.match(/: (\d+) botones\/enlaces sin nombre/))) suma("sinNombre", +m[1]);
    if ((m = l.match(/: (\d+) imágenes sin alt/))) suma("sinAlt", +m[1]);
    if ((m = l.match(/: (\d+) elementos con texto </))) suma("textoChico", +m[1]);
  }
  return r;
}

const resultados = [];
let puerto = 5900;
for (const id of readdirSync(join(work, "runs")).sort()) {
  for (const cond of ["A", "B"]) {
    const dir = join(work, "runs", id, cond);
    if (!existsSync(dir)) continue;
    const build = spawnSync("npm", ["run", "build"], { cwd: dir, encoding: "utf8" });
    const salida = build.stdout + build.stderr;
    const res = { id, cond, compila: build.status === 0, erroresTS: (salida.match(/error TS\d+/g) ?? []).length };
    if (res.compila) {
      const p = puerto++;
      const srv = spawn("npx", ["vite", "preview", "--port", String(p), "--strictPort"], { cwd: dir, stdio: "ignore" });
      await espera(2500);
      const v = spawnSync("node", [verificador, `http://localhost:${p}/`, "--esperar", "3000", "--out", join(dir, "_eval", "capturas")], { encoding: "utf8" });
      srv.kill();
      res.verificadorOK = v.status === 0;
      res.fallos = leerFallos(v.stdout + v.stderr);
      res.verificadorSalida = (v.stdout + v.stderr).trim().split("\n").slice(0, 12);
    }
    const src = spawnSync("bash", ["-c", "find src -type f \\( -name '*.ts' -o -name '*.tsx' -o -name '*.css' \\) -not -path 'src/data/*' | xargs wc -l | tail -1"], { cwd: dir, encoding: "utf8" });
    res.lineasCodigo = Number(src.stdout.trim().split(/\s+/)[0]) || 0;
    res.herramientas = herramientas(agentes[`${id}/${cond}`]);
    writeFileSync(join(dir, "_eval.json"), JSON.stringify(res, null, 2));
    resultados.push(res);
    console.log(`${id}/${cond}: compila=${res.compila} verificador=${res.verificadorOK ?? "-"} 21st=${res.herramientas?.llamadas21st ?? "?"}`);
  }
}
writeFileSync(join(work, "resultados-auto.json"), JSON.stringify(resultados, null, 2));
