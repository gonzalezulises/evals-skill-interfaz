#!/usr/bin/env node
/**
 * Verificador de interfaz (skill `estandar-interfaz`). Abre cada URL en Chromium headless a 390, 768 y
 * 1440 px y falla (exit 1) si encuentra:
 *   - scroll horizontal de la página (algo se sale del ancho),
 *   - errores de consola o peticiones fallidas (4xx/5xx) del propio origen,
 *   - controles clicables con área táctil < 44×44 px en móvil (WCAG 2.5.5 / Apple HIG),
 *   - imágenes sin `alt`, botones o enlaces sin nombre accesible,
 *   - texto por debajo de 12 px.
 * Guarda una captura por ancho en --out (por defecto ./capturas-interfaz) para adjuntarla al PR.
 *
 * Uso: node verificar-interfaz.mjs <url> [<url>…] [--out dir] [--cookie nombre=valor] [--ignorar <regex>] [--esperar <ms>]
 */
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const ANCHOS_BASE = [
  { nombre: "movil", width: 390, height: 844 },
  { nombre: "tableta", width: 768, height: 1024 },
  { nombre: "escritorio", width: 1440, height: 900 },
];
const TACTIL_MIN = 44;
const TEXTO_MIN = 12;

const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 ? args.splice(i, 2)[1] : undefined; };
const out = opt("--out") ?? "capturas-interfaz";
const cookie = opt("--cookie");
const ignorar = opt("--ignorar"); // regex de mensajes de consola conocidos y ajenos (p. ej. el eval de React en modo dev)
const ruido = ignorar ? new RegExp(ignorar) : null;
// --anchos 390,768,1024,1440: anchos extra o distintos (por defecto 390, 768 y 1440).
// --esperar <ms>: espera extra tras `networkidle`, para páginas que traen datos después de cargar (setTimeout,
// fetch diferido). Sin ella, la captura y las comprobaciones pueden ver solo el esqueleto de carga.
const esperarMs = Number(opt("--esperar") ?? 0);
const anchosArg = opt("--anchos");
const ANCHOS = anchosArg
  ? anchosArg.split(",").map(Number).filter(Boolean).map((w) => ANCHOS_BASE.find((a) => a.width === w) ?? { nombre: `ancho${w}`, width: w, height: 900 })
  : ANCHOS_BASE;
const urls = args;
if (!urls.length) { console.error("uso: verificar-interfaz.mjs <url>… [--out dir] [--cookie n=v]"); process.exit(2); }
mkdirSync(out, { recursive: true });

const fallos = [];
const browser = await chromium.launch();
try {
  for (const url of urls) {
    const origen = new URL(url).origin;
    for (const a of ANCHOS) {
      const ctx = await browser.newContext({ viewport: { width: a.width, height: a.height }, reducedMotion: "reduce" });
      if (cookie) { const [n, ...v] = cookie.split("="); await ctx.addCookies([{ name: n, value: v.join("="), url: origen }]); }
      const page = await ctx.newPage();
      const errores = [];
      page.on("console", (m) => { if (m.type() === "error" && !(ruido && ruido.test(m.text()))) errores.push(m.text()); });
      page.on("response", (r) => { if (r.url().startsWith(origen) && r.status() >= 400 && !r.url().endsWith("/favicon.ico")) errores.push(`${r.status()} ${r.url()}`); });
      await page.goto(url, { waitUntil: "networkidle" });
      if (esperarMs) await page.waitForTimeout(esperarMs);
      const u = new URL(url);
      const id = `${(u.pathname + u.search).replace(/\W+/g, "_").replace(/^_+|_+$/g, "") || "inicio"}-${a.nombre}`;
      await page.screenshot({ path: join(out, `${id}.png`), fullPage: true });

      const r = await page.evaluate(({ movil, TACTIL_MIN, TEXTO_MIN }) => {
        const desborde = document.documentElement.scrollWidth - window.innerWidth;
        const visibles = (el) => { const b = el.getBoundingClientRect(); const s = getComputedStyle(el); return b.width > 0 && b.height > 0 && s.visibility !== "hidden" && s.display !== "none"; };
        const nombre = (el) => (el.getAttribute("aria-label") || el.getAttribute("title") || el.textContent || "").trim();
        const clicables = [...document.querySelectorAll("a[href], button, [role=button], input, select, textarea, [onclick]")].filter(visibles);
        const caja = (el) => (el.closest("label") ?? el).getBoundingClientRect(); // WCAG 2.5.5: la etiqueta amplía el área del control
        const chicos = movil ? clicables.filter((el) => { const b = caja(el); return b.width < TACTIL_MIN || b.height < TACTIL_MIN; }).map((el) => `${el.tagName.toLowerCase()} «${nombre(el).slice(0, 30)}» ${Math.round(el.getBoundingClientRect().width)}×${Math.round(el.getBoundingClientRect().height)}`) : [];
        const sinNombre = clicables.filter((el) => ["A", "BUTTON"].includes(el.tagName) && !nombre(el) && !el.querySelector("img[alt]:not([alt=''])")).length;
        const sinAlt = [...document.images].filter((i) => !i.hasAttribute("alt")).length;
        const textoChico = [...document.querySelectorAll("body *")].filter((el) => !el.closest("[aria-hidden=true]") && el.childNodes.length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && visibles(el) && parseFloat(getComputedStyle(el).fontSize) < TEXTO_MIN).length;
        return { desborde, chicos, sinNombre, sinAlt, textoChico };
      }, { movil: a.width < 500, TACTIL_MIN, TEXTO_MIN });

      const pre = `${url} @${a.width}px`;
      if (r.desborde > 1) fallos.push(`${pre}: scroll horizontal de ${r.desborde}px`);
      if (errores.length) fallos.push(`${pre}: ${errores.length} errores de consola/red: ${errores.slice(0, 3).join(" | ")}`);
      if (r.chicos.length) fallos.push(`${pre}: ${r.chicos.length} controles < ${TACTIL_MIN}px: ${r.chicos.slice(0, 5).join("; ")}`);
      if (r.sinNombre) fallos.push(`${pre}: ${r.sinNombre} botones/enlaces sin nombre accesible`);
      if (r.sinAlt) fallos.push(`${pre}: ${r.sinAlt} imágenes sin alt`);
      if (r.textoChico) fallos.push(`${pre}: ${r.textoChico} elementos con texto < ${TEXTO_MIN}px`);
      await ctx.close();
    }
  }
} finally {
  await browser.close();
}

if (fallos.length) { console.error(`FALLA (${fallos.length})\n- ${fallos.join("\n- ")}`); process.exit(1); }
console.log(`OK: ${urls.length} URL × ${ANCHOS.length} anchos. Capturas en ${out}/`);
