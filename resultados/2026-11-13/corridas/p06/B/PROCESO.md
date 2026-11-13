# Proceso — página de inscripción al taller

## Fuentes consultadas
- Proyecto: `README.md` (Andes Logística no tiene design system propio), `package.json` (React 19, Tailwind v4, lucide-react), `src/data/taller.json`.
- 21st.dev (MCP `mcp__plugin_21st_21st__search`, solo metadatos; no se descargó código, se reimplementó con Tailwind):
  - Formulario a dos columnas: «Sign Up Split Panel» id 28171 — https://21st.dev/@diarmuradi/components/sign-up-1 — y «Registration» id 2431 — https://21st.dev/@ephraimduncan/components/registration
  - FAQ en acordeón: «Accordion» id 31351 — https://21st.dev/@wensity/components/accordion (reimplementado con `<details>` nativo, accesible por teclado sin JS).
  - Agenda como línea de tiempo vertical por día: «Timeline» id 35051 — https://21st.dev/@kuratlielia/components/timeline
- No usé el tool Skill ni archivos de ~/.agents o ~/.claude (según el encargo).

## Qué se hizo
- `src/App.tsx`: encabezado con fechas, horario, sede y cupos restantes (24 − 17 = 7); secciones De qué trata, Agenda (2 días), Quién lo facilita, Precio, Preguntas frecuentes; formulario en columna fija (sticky) en escritorio y al final en móvil, con botón «Inscribirme» en el encabezado que lleva al formulario.
- Formulario: validación en cliente con mensajes en español, foco al primer error, `aria-invalid`/`aria-describedby`, total calculado en vivo, estados enviando/enviado, y bloqueo si el cupo se agota o si se piden más personas que cupos libres.
- `index.html`: título de pestaña descriptivo.

## Supuestos (a confirmar)
- `precioGrupoUSD` no trae condición en el JSON: asumí que aplica desde 2 personas de la misma empresa.
- No hay backend de inscripciones: el envío se simula (espera de 0,9 s y pantalla de confirmación). Hay que conectarlo a un endpoint real antes de publicar.
- El texto «De qué trata» lo redacté a partir de la agenda; el JSON no trae descripción.

## Verificación (script `qa/verificar.cjs`, Chromium headless de Playwright contra `npm run preview` en :4813)
- `npm run build` (tsc + vite) en verde.
- 390, 768 y 1440 px: 0 desbordamiento horizontal, 0 errores de consola/red, ningún control interactivo con altura < 40 px. Capturas: `qa/captura-390.png`, `qa/captura-768.png`, `qa/captura-1440.png`.
- Flujo a 390 px: enviar vacío marca nombre/correo/empresa y pone el foco en nombre; 9 personas → «Solo quedan 7 cupos.»; 3 personas → «3 × USD 590 = USD 1,770»; la FAQ abre; el envío válido muestra «Recibimos tu inscripción» (`qa/captura-390-enviado.png`).
- Corregido tras revisar capturas: la fecha del día salía «3 De Diciembre» por `capitalize`; ahora «Jueves, 3 de diciembre».
- No verificado: lectores de pantalla reales, modo oscuro (la página es solo clara) y revisión de UX independiente.
