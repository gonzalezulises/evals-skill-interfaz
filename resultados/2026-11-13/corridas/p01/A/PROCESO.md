# Proceso: tablero de órdenes de compra (Andes Logística)

## Qué consulté

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo y checklist de UX).
- **Design system del cliente:** el README dice que Andes Logística no tiene uno. Definí tokens propios en `src/index.css`: neutros con acento verde azulado, modo claro y oscuro y estados (peligro, aviso, ok).
- **Skill `21st:21st-ui-build`:** el proyecto no tiene `.21st/` y el CLI `21st` no se ejecutó. Usé el MCP.
- **21st.dev (MCP `search`, `get_inspiration` y `get_component`):**
  - **Dashboard Shell**, id 43212, https://21st.dev/@isaiahbjork/components/app-dashboard-shell. Traje su código con `get_component` y lo usé como patrón para las tarjetas KPI (cifra protagonista y comparación), la tabla (chips de filtro con conteo, búsqueda, columnas ordenables con `aria-sort`, columnas que se ocultan por ancho, estado vacío con «Quitar filtros», paginación) y el anillo de foco. Lo reimplementé con los tokens propios, sin instalarlo.
  - Otros resultados que revisé como inspiración, sin traer su código:
    - Sheet, id 35214, https://21st.dev/@kevingirelli/components/sheet. Lo tomé como patrón del panel lateral de detalle y lo implementé sobre `<dialog>` nativo.
    - KPI Tile, id 40086, https://21st.dev/@konsstepnov/components/kpi-tile.
    - Sparkline, id 34512, https://21st.dev/@appica-dev/components/sparkline.
    - Charts & KPI Cards, id 33507, https://21st.dev/@uvain/components/revenue-charts-kpi.
- **Skill `dataviz`:**
  - Elegí barras horizontales de una sola serie, de un solo tono y ancladas a la base, sin leyenda.
  - Puse etiquetas directas en texto neutro.
  - No hay gráficos de torta.
  - El estado siempre lleva ícono y texto, nunca solo color.
- **Regla `tableros.md`:**
  - La pantalla tiene 5 cifras primarias.
  - El detalle se abre al pulsar.
  - Cada elemento que se pulsa tiene cursor, foco visible y nombre accesible.

## Qué hace la pantalla

**Definiciones**
- **Comprometido:** suma de las órdenes en estado aprobada, enviada o recibida parcial.
- **Atrasada:** orden abierta cuya fecha de entrega prometida es anterior a la fecha de hoy (se toma del navegador).

**Tarjetas**
- La tarjeta protagonista muestra el dinero comprometido, cuánto de eso está atrasado (barra) y las columnas por mes de emisión.
- La tarjeta de órdenes atrasadas lleva a la tabla con el filtro aplicado.
- Hay una tarjeta de atraso promedio y otra de entregas a tiempo.

**Gráficos**
- Las atrasadas por antigüedad (1–30, 31–60, 61–90 y más de 90 días) y el comprometido por centro de costo se muestran como barras. Cada barra filtra la tabla.

**Tabla**
- Tiene chips por estado, búsqueda y filtro por centro de costo, y se ordena por atraso de mayor a menor.
- En móvil pasa a tarjetas. En tableta y escritorio usa scroll interno con la columna «Orden» fija.

**Detalle**
- Es un panel lateral sobre `<dialog>`, que retiene el foco y se cierra con Esc.
- Muestra el monto, el aviso de atraso, el proveedor, el centro de costo, el solicitante y el recorrido (emisión, entrega prometida, recepción).

**Estados**
- Carga: skeleton mientras llega el chunk de datos, que se importa de forma dinámica.
- Error: mensaje con botón «Reintentar».
- Vacío: explica qué pasó y ofrece «Quitar filtros».

## Qué verifiqué (contra `npm run build` + `npm run preview --port 4802`)

1. `npm run build` (`tsc --noEmit` + `vite build`) terminó sin errores.
2. `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs http://localhost:4802/ --out capturas-interfaz` dio `OK: 1 URL × 3 anchos` y salió con código 0. Las capturas están en `capturas-interfaz/inicio-{movil,tableta,escritorio}.png`.
3. Corrí un flujo con Playwright (script fuera del proyecto) a 390 px en modo claro y a 1440 px en modo oscuro. Resultados:
   - **Tarjeta «Órdenes atrasadas»:** activa el chip y la tabla queda en 139 órdenes.
   - **Detalle:** abrir una orden abre el `dialog` y el foco queda en «Cerrar detalle». Esc lo cierra.
   - **Búsqueda sin resultados:** muestra el estado vacío, y «Quitar filtros» devuelve las 300 órdenes.
   - **Errores de consola:** 0.
   - **Fallo de datos:** al abortar la carga se muestra el estado de error.
   - **Carga lenta:** al demorarla se ve el skeleton.
   - **Capturas:** `detalle-390-light.png`, `detalle-1440-dark.png`, `inicio-1440-dark.png`, `error-390.png`, `carga-390.png`.
4. **Contraste AA**, calculado por par de colores: el mínimo es 4.73:1 (acento sobre acento suave). Texto tenue sobre fondo: 5.01:1. En modo oscuro todos los pares superan 6:1.
5. Revisé a ojo las capturas de 390, 768 y 1440 px. No hay solapes ni nada que se salga del ancho.

## Qué no se hizo

- No hubo revisión independiente por otro agente, ni PR ni merge, porque el encargo los excluye.
- La fecha de corte es la del navegador. Si los datos reales vienen con otra fecha de corte, esa debe reemplazarla.
