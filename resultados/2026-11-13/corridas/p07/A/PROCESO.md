# Proceso: tablero de escalamientos de soporte

## Fuentes y herramientas consultadas

- **Estándar del equipo**: `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo completo, menos PR, merge y revisión por otro agente, que el encargo excluye).
- **Design system**: el README dice que Andes Logística no tiene uno propio. Usé tokens neutros y la paleta de referencia del skill `dataviz` (`references/palette.md`), con modo claro y modo oscuro.
- **21st.dev** (MCP `mcp__plugin_21st_21st__*`):
  - `search` «support tickets dashboard SLA KPI cards» y «data table with side drawer detail sheet».
  - `get_inspiration` «support escalation dashboard…» (feedbackId `66bc6817-2dd0-4ce0-ae48-d6ef14a2a24c`). Sirvió como referencia: Usage Dashboard id 31642 y Pareto Chart id 38544.
  - `get_component` **33507**, «Charts & KPI Cards» de uvain (https://21st.dev/@uvain/components/revenue-charts-kpi). De ahí salen `KpiCard` (con un delta que sabe si subir es bueno), `Sparkline` y sus reglas: texto en tokens de tinta, trazo de 2 px y sin animación. Está adaptado en `src/components/Kpi.tsx`.
  - `get_component` **23558**, «Drawer» de ddoemonn (https://21st.dev/@ddoemonn/components/drawer). De ahí salen la trampa de foco, el cierre con Esc, el fondo `inert`, el bloqueo del scroll y la devolución del foco al cerrar. Está adaptado y sin arrastre en `src/components/Drawer.tsx`.
- **Skill `dataviz`**:
  - La prioridad usa una rampa ordinal azul de un solo tono.
  - El estado del SLA usa los colores de estado reservados, siempre acompañados de un icono y una etiqueta.
  - Validé la rampa con `validate_palette.js "#86b6ef,#3987e5,#1c5cab,#0d366b" --mode light --ordinal` y con la versión oscura `--mode dark --ordinal`. Las dos dieron **ALL CHECKS PASS**.
- **Reglas de tableros** (`rules/tableros.md`):
  - La pantalla tiene 5 cifras primarias.
  - Las definiciones y la calidad de los datos van en el drawer «Cómo se calcula», no en la pantalla.
  - Cada elemento que se puede pulsar tiene `cursor:pointer`, `focus-visible` y un nombre accesible.

## Qué hay en la pantalla

- **Escalamientos abiertos** (tarjeta principal): 107 tickets no resueltos, de los cuales 43 se respondieron fuera del SLA. Incluye una barra y filas por prioridad con el total de abiertos, los que están fuera de SLA y la antigüedad máxima. Al pulsar una fila se abre el drawer con esos tickets.
- **Tres KPI de los últimos 30 días**, comparados con los 30 días anteriores. Al pulsar cualquiera se abre el detalle por prioridad.
  - Cumplimiento del SLA, con sparkline semanal.
  - Mediana de primera respuesta.
  - Mediana de resolución.
- **Primera respuesta por agente**: mediana en horas, % de SLA y tickets abiertos, ordenados del más rápido al más lento. Al pulsar un agente se ven sus tickets.
- **Por atender primero**: los abiertos ordenados por riesgo (fuera de SLA, luego prioridad, luego antigüedad).
  - En tableta y escritorio es una tabla con scroll interno y el ID fijo.
  - En móvil pasa a tarjetas.
  - Al pulsar un ticket se abre su ficha.
- **Filtro de prioridad**: se aplica a todo el tablero.
- **Estados**: esqueleto de carga, error con «Reintentar» y vacío con explicación. `fetchTickets` en `src/lib/tickets.ts` simula la API, y se pueden forzar con `?estado=error|vacio|cargando`.

### Decisiones sobre los datos

- **Definición del SLA**: un ticket cumple si `primeraRespuestaHoras ≤ slaHoras`.
- **Fecha de corte**: es el último día con datos (2026-11-10), no la fecha de hoy.
- **Datos inconsistentes, declarados en el drawer de método**:
  - 25 tickets resueltos no traen `resolucionHoras`, así que quedan fuera de la mediana de resolución.
  - 76 tickets no resueltos sí traen `resolucionHoras`, y ese dato se ignora.

## Qué verifiqué

1. **Compilación**: `npm run build` (incluye `tsc --noEmit`) terminó en verde. El único aviso fue el tamaño del chunk de Recharts.
2. **Verificador de interfaz**: `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs` se corrió contra `vite preview` en el puerto 4814.
   - URLs `/`, `/?estado=error` y `/?estado=vacio` con `--esperar 1500`: **OK, 3 URL × 3 anchos, exit 0**.
   - URL `/?estado=cargando`: **OK, exit 0**.
   - Comprueba que no haya scroll horizontal, que no haya errores de consola ni de red, que las áreas táctiles midan al menos 44 px en móvil, que todo tenga nombre accesible y que ningún texto baje de 12 px.
3. **Interacción**: `node pruebas/interaccion.mjs` con Playwright y Chromium headless dio **10/10 PASA**:
   - el KPI abre el drawer;
   - Esc lo cierra y devuelve el foco a la tarjeta, tanto en escritorio como en móvil;
   - el filtro «Crítica» deja 19 abiertos;
   - la ficha del ticket T-7078 muestra el SLA de 4 h;
   - el modo oscuro aplica su fondo;
   - no hay errores de consola.
4. **Revisión visual**: miré las capturas a 390, 768 y 1440 px, el drawer en móvil y el modo oscuro. Están en `capturas-interfaz/`.
5. **Cifras**: las contrasté con un cálculo independiente en Python sobre `tickets.json`: 107 abiertos, 43 fuera de SLA, SLA de 56 % frente a 59 % en el período anterior, mediana de primera respuesta de 13,1 h y medianas por agente.

## Qué no se hizo

- El PR, el merge y la revisión de UX por otro agente quedaron fuera por instrucción del encargo.
- La meta de cumplimiento del SLA no está en los datos. Por eso la comparación es contra el período anterior y no contra una meta.
