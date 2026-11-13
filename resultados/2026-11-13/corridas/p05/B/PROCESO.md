# Portal de facturas: proceso

## Fuentes de diseño consultadas

- **Design system del cliente:** el README dice que Andes Logística no tiene uno propio. Definí tokens neutros
  en `src/index.css` (`@theme`: bg, surface, muted, border, ink, brand #0f4c81).
- **21st.dev (MCP `plugin_21st_21st`):**
  - `get_inspiration` con «customer billing portal invoice list with status filter and invoice detail drawer
    with line items and tax» (feedbackId `d6796bcf-8bd2-43a7-b49e-eca8382433d5`). Referencias consideradas:
    Invoice Line Items Table (id 25157, https://21st.dev/@olewandowski1/components/table-3), Invoice History
    Table (id 28473, https://21st.dev/@ziegfiroyt/components/settings64), Filterable Invoices Table
    (id 25152, https://21st.dev/@olewandowski1/components/table-2), Invoice History Table (id 22187,
    https://21st.dev/@cnippet-dev/components/v-table-12).
  - `get_component` id **25157** (Invoice Line Items Table). No lo instalé: reimplementé su patrón (tabla de
    líneas con cantidad, precio unitario, importe; bloque de subtotal, impuesto y total; columnas con
    `tabular-nums`) con los tokens propios y sin agregar dependencias. Del 28473/22187 tomé la idea de badges
    de estado con color.
- No usé el tool Skill ni leí `~/.agents` ni `~/.claude`, según el encargo.

## Qué hice

- `src/lib/facturas.ts`: tipos, orden por emisión descendente, formato `es-PA` (B/., fechas «21 jun 2026»),
  importe de línea y tasa de ITBMS derivada de los montos (7 %).
- `src/App.tsx`: encabezado, resumen (por pagar, vencido, pagado), filtro por estado con conteo
  (botones `aria-pressed`, estado en `?estado=`), listado como tarjetas en móvil (<768 px) y tabla en
  768 px y más, estado vacío con «Ver todas».
- `src/components/DetalleFactura.tsx`: detalle en `<dialog>` modal (panel lateral en escritorio, pantalla
  completa en móvil) con fechas, líneas (lista apilada en móvil, tabla desde 640 px), subtotal, ITBMS y
  total; aviso para vencidas y anuladas. Enlace directo con `#FE-xxxxx`; Esc, botón ✕ o clic fuera cierran.
- `src/components/EstadoBadge.tsx`: badge con punto de color y texto (el estado no depende solo del color).

## Qué verifiqué

- Datos: las 48 facturas cuadran (suma de líneas = subtotal, ITBMS = 7 % del subtotal, subtotal + ITBMS =
  total, tolerancia 0,02). Estados: 9 pendientes, 10 vencidas, 18 pagadas, 11 anuladas.
- `npm run build` (tsc + vite) en verde.
- En el build servido con `npm run preview -- --port 4811 --strictPort`, con Playwright MCP (Chromium
  headless) a 390, 768 y 1440 px:
  - 48 filas o tarjetas con «Todas»; 10 con «Vencidas», todas con badge Vencida; la URL pasa a `?estado=vencida`.
  - Abrir el detalle pone `#FE-88021`, el foco entra al diálogo, muestra 4 líneas, subtotal B/. 32,817.35,
    ITBMS (7 %) B/. 2,297.21 y total B/. 35,114.56 (coinciden con el JSON).
  - Esc cierra, limpia el hash y devuelve el foco al botón que lo abrió.
  - Enlace directo `/?estado=pagada#FE-88003` abre esa factura con el filtro Pagadas activo; ✕ la cierra.
  - Teclado: Tab hasta una factura + Enter abre el detalle.
  - Sin scroll horizontal en ningún ancho; sin errores ni avisos de consola ni requests fallidos.
- Capturas en `capturas/`: `listado-{390,768,1440}.png` (más `-completo`), `filtro-vencidas-*.png`,
  `detalle-*.png`. Las revisé visualmente; en móvil compacté las tarjetas de resumen tras la primera ronda.

## Límites

- No hubo revisión de UX independiente (ni otra persona ni otro agente): la revisión visual la hice yo.
- En la tabla de escritorio el botón del número mide menos de 24 px de alto; el área real de clic es la
  fila entera, y en móvil las tarjetas completas son el botón (≥ 44 px).
- No hay modo oscuro ni descarga de PDF (no se pidieron).
