# PROCESO — Tablero de clima (Recursos Humanos)

## Fuentes y herramientas consultadas
- **Proyecto:** `README.md` (Andes Logística no tiene design system propio → paleta neutra slate + semántica verde/rojo/ámbar), `src/data/clima.json`, `package.json` (React 19, Tailwind v4, lucide-react).
- **21st.dev (MCP `mcp__plugin_21st_21st__search`)**, búsqueda «survey results dashboard NPS score card». Usado solo como inspiración, sin descargar código:
  - id 33507 «Charts & KPI Cards» (https://21st.dev/@uvain/components/revenue-charts-kpi): KPI que sabe si subir es bueno, texto accesible por gráfico → delta con ícono + signo (no solo color) y `sr-only` por fila.
  - id 4245 «Statistics Card 10» (https://21st.dev/@sean0205/components/statistics-card-10): tarjeta KPI con barra segmentada → barra detractores/pasivos/promotores del eNPS.
- No se usó el tool Skill ni archivos de ~/.agents o ~/.claude. Sin dependencias nuevas.

## Qué contiene la pantalla (`src/App.tsx`)
- KPIs: eNPS +8 = (148 − 113) / 412 con su reparto; puntaje promedio 3,64 vs 3,53 anterior; participación 77,7 % (412/530).
- Aviso de la mayor caída (Herramientas, 3,90 → 3,08).
- Dimensiones: gráfico de mancuernas anterior→actual, ordenado por cambio, con valores y delta.
- Por área: matriz área × dimensión con color por banda y n de cada celda; marca ⚠ si n < 20. En < 1024 px pasa a selector de área + lista.
- Comentarios: filtro por área (botones con `aria-pressed`), agrupados por texto idéntico con su frecuencia, áreas y temas.

## Verificado
- `npm run build` (tsc + vite) sin errores.
- `npm run preview -- --port 4819 --strictPort` + Playwright headless (Chromium for Testing, script `capturas/check.cjs`) a 390, 768 y 1440: 0 errores de consola, 0 requests fallidas, sin scroll horizontal (scrollWidth = ancho), ningún botón/select < 36 px de alto. Capturas: `capturas/clima-390.png`, `clima-768.png`, `clima-1440.png`.
- Interacción: filtro «Bodega» → «3 comentarios · 3 distintos»; selector móvil «TI» → muestra Liderazgo 3,90 n=90 (coincide con el JSON).
- Se corrigieron en el camino: desborde horizontal a 390 px (columna de grid sin `min-w-0`), cortes de palabra en cabeceras a 768 px (matriz solo desde 1024 px), saltos de línea en «3,90 →».
- Servidor apagado (puerto 4819 libre).

## No verificado / observaciones de datos
- No hubo revisión de UX independiente (el encargo no la pedía y no la puedo hacer yo sobre mi propio trabajo).
- Los datos de ejemplo traen comentarios cuyo `tema` no corresponde al texto (p. ej. «Mi jefe me reconoce el trabajo» etiquetado «Herramientas») y solo 6 textos distintos en 30 filas; se muestran tal cual, agrupados.
- No hay dato de eNPS anterior, así que el eNPS no tiene comparación. La escala 1–5 se asume (todos los valores caen en 2,29–4,59).
- El umbral de base baja (n < 20) es una decisión mía; conviene confirmarlo con RR. HH. por anonimato.
