# PROCESO — Tablero de escalamientos de soporte

## Qué se construyó

Pantalla en `/` (`src/App.tsx`), con la lógica de cálculo en `src/lib/escalamientos.ts` y dos componentes en `src/components/` (`TicketDrawer.tsx`, `PrioridadPill.tsx`). Los tokens de color (claro y oscuro) están en `src/index.css`.

- **4 cifras primarias:** tickets abiertos (107), críticos abiertos (19), cumplimiento del SLA (58 %, 104 de 180) y mediana de la 1.ª respuesta (13.6 h).
- **Abiertos por prioridad:** barras de crítica, alta, media y baja.
- **Cumplimiento del SLA por prioridad:** porcentaje y n/N contra el objetivo de cada prioridad (4, 8, 24 y 48 h).
- **Tiempos de respuesta por agente:** tabla ordenable (con `aria-sort`) desde 640 px. En móvil son tarjetas con un selector de orden.
- **Detalle al pulsar:** cada cifra, barra o agente abre un panel lateral (`<dialog>` modal, se cierra con Esc, el botón × o un clic fuera) con los tickets de ese grupo. Los que están fuera del SLA o son más antiguos salen primero.

### Definiciones que tomé (los datos no las traen)

- **Abierto:** `estado !== "resuelto"`, es decir, abierto, en curso o esperando cliente.
- **SLA:** `primeraRespuestaHoras <= slaHoras`. Se usa la primera respuesta porque `slaHoras` depende solo de la prioridad (4/8/24/48). Medido contra la resolución, solo cumplirían 22 de 180. La definición se muestra en el pie y en la leyenda de la tarjeta.
- **Fecha de corte:** la fecha `abierto` más reciente, 10-nov-2026.

### Calidad de los datos (no se muestra en pantalla)

`resolucionHoras` no es coherente con `estado`: hay 25 tickets «resuelto» con `null` y 63 no resueltos con un valor. Por eso no uso tiempos de resolución. Conviene confirmar con el dueño de los datos antes de agregarlos.

## Herramientas y fuentes de diseño consultadas

- **21st.dev (MCP `get_inspiration`)**, consulta «support ticket SLA dashboard…», feedbackId `671eb862-44c9-4b84-9127-7408d2856d91`. Usé dos resultados solo como inspiración. No descargué código de pago: lo reimplementé con los tokens propios.
  - **id 33507, «Charts & KPI Cards»** (https://21st.dev/@uvain/components/revenue-charts-kpi). De aquí salen las tarjetas KPI con contexto y la cifra acompañada de su n/N.
  - **id 43212, «Dashboard Shell»** (https://21st.dev/@isaiahbjork/components/app-dashboard-shell). De aquí salen la fila de KPI sobre la tabla ordenable y el patrón de drawer.
- **Design system:** el README dice que Andes Logística no tiene uno propio. Hice una paleta neutra con tokens en `:root` y su versión oscura con `prefers-color-scheme`. El color de prioridad es una escala de urgencia; el verde y el rojo se reservan para «en SLA» y «fuera de SLA».
- **Sin skills** (lo prohíbe el encargo). Tampoco usé Recharts: las barras son HTML/CSS, porque así se adaptan al ancho y tienen nombre accesible en el botón.

## Qué verifiqué

1. **`npm run build`** (tsc + vite) en verde.
2. **Script `qa/verificar.mjs`** con Playwright headless (Chromium de Playwright, no el Chrome del sistema) contra `npm run preview --port 4815`. Corre en 390, 768 y 1440 px, en claro y oscuro. Resultado en `qa/resultado.txt`: **50 PASA, 0 FALLA**.
   - Sin scroll horizontal.
   - Título renderizado.
   - Sin errores de consola, de página ni de red.
   - Todos los botones visibles tienen nombre accesible y `cursor:pointer`.
   - En 390 px, los objetos táctiles miden ≥ 40 px. En la primera corrida falló el `<select>`; se corrigió con `min-h-11`.
   - El drawer «Abiertos · crítica» abre 19 tickets y Esc lo cierra.
   - El drawer de Ana muestra sus 34 tickets.
3. **Cifras cruzadas con Python sobre `tickets.json`:** 107 abiertos, 19 críticos abiertos, mediana de 13.605 h, Diego 32/19/10.1 h/20 en SLA, Ana 34/21/18.4 h/15 en SLA. Todas coinciden con lo que muestra la pantalla.
4. **Capturas** en `qa/capturas/` (claro y oscuro × 390/768/1440, con y sin drawer), revisadas a ojo.
5. Apagué el servidor de preview; el puerto 4815 quedó libre.

## Qué no se verificó

- No hubo revisión de UX independiente.
- No se probó con lector de pantalla real. Solo se comprobaron roles y nombres accesibles.
