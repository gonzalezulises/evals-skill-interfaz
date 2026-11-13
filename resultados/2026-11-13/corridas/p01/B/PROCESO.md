# Proceso: tablero de órdenes de compra

## Fuentes de diseño y herramientas consultadas

- **README del proyecto**: Andes Logística no tiene design system propio. Definí tokens propios (claro y oscuro) en `src/index.css` con `@theme` de Tailwind v4.
- **21st.dev (MCP `search`)**, consulta «purchase orders dashboard data table with detail drawer». Los usé solo como inspiración del patrón; no descargué el código (`get_component` no se llamó):
  - id 31861, Data Table (wensity): https://21st.dev/@wensity/components/data-table (búsqueda, orden por columna, detalle por fila).
  - id 43212, Dashboard Shell (isaiahbjork): https://21st.dev/@isaiahbjork/components/app-dashboard-shell (fila de KPI, gráfico y tabla de órdenes, panel que pasa a drawer).
  - id 27049, Data Table (arihantcodes): https://21st.dev/@arihantcodes_1f7b8c4d/components/data-table (filtros rápidos en píldoras, navegación por teclado).
- Librerías del proyecto: `lucide-react` (iconos), `clsx` y `tailwind-merge` (`cn`). Los gráficos son barras HTML/CSS accesibles; no usé Recharts.
- No usé el tool Skill ni leí `~/.agents` ni `~/.claude`, como pedía el encargo.

## Definiciones (en `src/lib/ordenes.ts`)

- **Comprometido**: suma de las órdenes en estado `aprobada`, `enviada` o `recibida parcial`. Los borradores no comprometen y las canceladas y recibidas ya cerraron. En las de recepción parcial cuento el monto completo, porque el JSON no trae lo recibido.
- **Atrasada**: orden comprometida cuya `fechaEntregaPrometida` es anterior a la fecha de corte. El corte es la fecha de hoy en el navegador y se muestra en el encabezado.
- **Entregas completas a tiempo**: órdenes `recibida` con `fechaRecepcion` igual o anterior a la prometida.

## Qué contiene

- 4 cifras: comprometido, comprometido atrasado, atraso de más de 60 días y entregas completas a tiempo. Las tres primeras filtran el listado al pulsarlas.
- Comprometido por proveedor, separado en atrasado y en plazo. Cada barra filtra el listado.
- Antigüedad del atraso en 4 tramos, cada uno filtrable.
- Listado con vistas Atrasadas, Comprometidas y Todas, búsqueda, filtros por estado y centro de costo, chips para quitar filtros, orden por columna, total filtrado, paginación de 20 y un estado vacío.
- En escritorio (≥1024 px) es una tabla; en tablet y móvil, tarjetas.
- Detalle de cada orden en un panel lateral: monto, estado, situación (días de atraso o recepción tardía), proveedor, centro de costo, solicitante y la línea de tiempo emisión → prometida → recepción. Se cierra con Esc o con clic fuera; mantiene el foco dentro y lo devuelve a la fila.

## Qué verifiqué

- `npm run build` (tsc + vite) en verde.
- Las cifras de las tarjetas las recalculé aparte con node sobre `ordenes.json`: comprometido USD 3 636 858 (151), atrasado USD 3 370 226 (139), entregas a tiempo 22/55 = 40 %. Coinciden con lo que muestra la pantalla.
- Navegador headless (Chrome for Testing 1248 vía playwright-core, sobre `npm run preview` en el puerto 4803) a 390, 768 y 1440 px, en claro y oscuro: 0 errores de consola, 0 peticiones fallidas (el 404 del favicon se corrigió con un ícono inline) y 0 px de desborde horizontal. El panel de detalle abre y se cierra con Esc en los 6 casos.
- Interacción a 1440: filtro por proveedor (Grupo Ultramar, 11 órdenes), tramo «Más de 90», búsqueda sin resultados que muestra el estado vacío, «Limpiar filtros» que vuelve a 139, la vista Todas (300) y Enter sobre una fila con el teclado (abre, el foco pasa a «Cerrar detalle» y vuelve a la fila al cerrar).
- Capturas en `capturas/` (`390|768|1440`-`light|dark`[-`detalle`].png). Después de verlas corregí dos cosas: los ids que se partían en dos líneas a 768 (desde entonces la tabla solo aparece a partir de 1024) y el «Centro De Costo» que salía con mayúsculas.
- Servidor de preview apagado al terminar.

## Límites

- No hubo revisión de UX independiente ni auditoría automática de accesibilidad (axe); la accesibilidad la revisé a mano (roles, `aria-pressed`, `aria-sort`, foco visible y nombres accesibles).
- Inter no está cargada; uso la fuente del sistema.
