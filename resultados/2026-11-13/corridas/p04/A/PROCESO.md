# Proceso — pantalla «Proyectos activos» (40 proyectos × 12 indicadores, móvil primero)

## Fuentes y herramientas consultadas

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo, checklist de UX y verificador).
- **Design system:** el README dice que Andes Logística no tiene uno. Usé tokens neutros propios en `src/index.css` (claro y oscuro).
- **21st.dev** (MCP `mcp__plugin_21st_21st__*`):
  - `get_inspiration`: «mobile-first data table … sticky first column, sortable, heatmap cells». Candidatos: 8508 Project Data Table, 44279 Spark Table, 7475 InlineAnalyticsTable, 27611 Project Management Table, **23604 Records Table**.
  - `search` (tabla ordenable con columna fija): 35036, 22166, 4821, 22167 Pinnable Columns Table.
  - `search` (hoja inferior de detalle): **31360 wensity/drawer** (hoja inferior en móvil, panel lateral en pantallas grandes), 25002, 11442.
  - `get_component` **23604 Records Table** (https://21st.dev/@theshanelevine/components/records-table): bajé su código. De ahí salen la columna fija, la cabecera fija, los botones de orden en la cabecera y el scroll dentro de un contenedor con `tabIndex` y `aria-label`. Lo rehíce con los tokens propios en `src/components/Tabla.tsx`.
  - **31360** (https://21st.dev/@wensity/components/drawer): lo usé solo como patrón, sin bajar el código. Es la base de `src/components/Detalle.tsx`.
- **Skill `dataviz`:** paleta de estados validada (good `#0ca30c`, warning `#fab219`, critical `#d03b3b`) y superficies claro/oscuro. Las reglas que apliqué: el estado nunca va solo con color (siempre icono con nombre accesible y valor), una sola tonalidad para las magnitudes y barras finas con línea base en 0.

## Qué se construyó

- 5 cifras de toda la cartera: riesgo alto (la principal), atraso de más de 30 días, sobrecosto de más de 10 %, avance físico frente al financiero y presupuesto ejecutado. Las tres de alerta filtran la lista al pulsarlas.
- Filtros: búsqueda, gerente y riesgo, todos con etiqueta visible.
- **Ranking** (vista por defecto en el celular): se elige un indicador en «Comparar por» y los proyectos salen ordenados, con barra y estado. Por defecto, primero los que tienen más alertas, con el motivo escrito.
- **Tabla** (vista por defecto desde 768 px): matriz de 40 × 12 con cabecera y primera columna fijas, scroll horizontal dentro del contenedor, orden por columna (`aria-sort`) y celdas marcadas por umbral.
- **Detalle** (hoja inferior en el celular, panel lateral en escritorio): los 12 indicadores, cada uno frente a la mediana de la cartera y con el criterio de su umbral. Atrapa el foco, se cierra con Esc y devuelve el foco a quien lo abrió.
- Estados: esqueleto de carga, error con «Reintentar», cartera vacía y filtros sin resultados con «Limpiar filtros». Para tener un estado de carga real, `fetchProyectos` en `src/lib/api.ts` simula la API.

## Qué verifiqué

- `npm run build` (tsc + vite) en verde.
- `verificar-interfaz.mjs http://localhost:4808/` salió en **0** (390/768/1440). Ojo: sus capturas `inicio-*.png` pueden mostrar el esqueleto de carga, porque el verificador no espera a que lleguen los datos.
- Corrí un script propio con Playwright (Chromium headless) que espera a que carguen los datos y comprueba lo siguiente:
  - Sin scroll horizontal de página y ningún control por debajo de 44 × 44 px a 390, 768 y 1440 en claro, y a 390 en oscuro.
  - Cero errores de consola.
  - Tabla a 390: `scrollWidth` 1263 frente a 356 de `clientWidth`. El scroll queda interno y la primera columna sigue fija al desplazar.
  - El KPI «Riesgo alto» deja 16 de 40. «Atraso > 30» deja 10 de 40 y cambia «Comparar por» a días de atraso.
  - El detalle abre con el foco en «Cerrar detalle». Esc lo cierra y el foco vuelve a la fila.
  - El estado vacío aparece con una búsqueda sin resultados, y el esqueleto se ve durante la carga.
- Contraste AA calculado para los pares de texto y fondo, en claro y oscuro. El más bajo es 4,71:1.
- Capturas en `capturas-interfaz/`: `cargado-390-light`, `cargado-390-dark`, `cargado-768-light`, `cargado-1440-light`, `tabla-390-light`, `tabla-desplazada-390-light`, `filtro-atraso-390-light`, `detalle-390-light`, `detalle-1440-light`, `vacio-390-light` y `cargando-390`.
- Servidor de preview apagado al terminar.

## Fuera de alcance

- Revisión de UX por otro agente, PR y merge: el encargo los excluye.
- El estado de error no se ve con datos reales, porque la API simulada nunca falla. Revisé su código, pero no lo vi en pantalla.
