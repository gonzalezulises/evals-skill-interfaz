# Proceso: portal de facturas (Andes Logística)

## Fuentes consultadas

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo, checklist de UX y verificador).
- **Design system:** el `README.md` del proyecto dice que Andes Logística no tiene uno. Definí tokens propios
  en `src/index.css` (`@theme`: fondo, superficie, tinta, tenue, marca y un par de colores por estado),
  con contraste AA sobre blanco y sobre su fondo suave.
- **21st.dev** (MCP `mcp__plugin_21st_21st__*`):
  - `search` «invoice list table with status filter» y «invoice detail drawer line items tax summary»;
    `get_inspiration` «customer billing portal invoices list…» (feedbackId `13ac7d8a-a7eb-458e-b095-86200cfb7456`).
  - `get_component` **25152**, «Filterable Invoices Table»
    (https://21st.dev/@olewandowski1/components/table-2). De ahí salen la tabla del listado (número en mono,
    fechas, badge de estado con punto, monto alineado a la derecha, columnas que se ocultan por ancho) y la
    cifra de saldo pendiente sobre el listado.
  - `get_component` **25157**, «Invoice Line Items Table»
    (https://21st.dev/@olewandowski1/components/table-3). De ahí salen las líneas del detalle (cantidad ×
    precio unitario = importe) y el pie con subtotal, impuesto y total.
  - Revisados sin usar código: 22187 «Invoice History Table» (pie con saldo pendiente) y
    19375 «Empty State with Tabs».
  - Los patrones los reimplementé con Tailwind v4 y los tokens del proyecto. No instalé las dependencias de
    shadcn/Radix/TanStack/sonner, porque agregar dependencias requiere justificarlas y el proyecto ya trae
    React, Tailwind y lucide.

## Lo que se construyó

- `src/App.tsx`: cabecera, carga (esqueleto), error con «Reintentar», vacío total, resumen, filtro, listado
  con «Ver más» en tandas de 15 y detalle. El filtro (`?estado=`) y la factura abierta (`?factura=`) quedan
  en la URL: se pueden compartir y el botón «atrás» cierra el detalle.
- `src/components/Resumen.tsx` muestra 3 tarjetas de distinto peso. La protagonista es el saldo por pagar,
  con una barra vencido/pendiente; cada lado de la barra filtra el listado. Le siguen lo vencido, que lleva
  a «Ver vencidas», y la pendiente que vence primero, que abre su detalle.
- `src/components/FiltroEstado.tsx` tiene chips con conteo y `aria-pressed`. En móvil quedan en una fila con
  scroll interno.
- `src/components/ListaFacturas.tsx` muestra una tabla desde 768 px, en la que toda la fila abre el detalle,
  y tarjetas debajo de 768 px. El total de las facturas anuladas aparece tachado.
- `src/components/DetalleFactura.tsx` es un drawer (`role=dialog`, `aria-modal`). Pone el foco en «Cerrar»,
  atrapa el Tab, cierra con Esc o con el velo y devuelve el foco a quien lo abrió. Incluye un aviso según el
  estado, las líneas (tabla en ≥ 640 px y lista en móvil) y subtotal, ITBMS (7 %, calculado de los montos)
  y total.
- `src/lib/api.ts`: agregué `fetchFacturas()` con el mismo patrón simulado que `fetchInventario`. Con
  `?simular=error` o `?simular=vacio` se ven esos estados.
- `src/lib/facturas.ts` reúne tipos de estado, formato de moneda y fecha (es-PA, USD) y el cálculo del resumen.
- Movimiento: las animaciones del drawer y del esqueleto se apagan con `prefers-reduced-motion`.

## Verificación

1. `npm run build` (incluye `tsc --noEmit`): verde.
2. Revisé los datos con un script de Python: en las 48 facturas cuadran líneas = subtotal, ITBMS = 7 % y
   total. Ninguna tiene campos vacíos.
3. `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs` contra `npm run preview` en el
   puerto 4810, con `--esperar 3000` porque los datos llegan después de cargar. Revisé 6 URL × 390/768/1440:
   `/`, `?estado=vencida`, `?factura=FE-88001`, `?estado=anulada&factura=FE-88002`, `?simular=error` y
   `?simular=vacio`. Resultado: **«OK: 6 URL × 3 anchos», exit 0**. Las capturas están en
   `capturas-interfaz/` (18, más `movil-tras-ver-mas.png`).
4. `node pruebas/interaccion.mjs`, con Playwright a 1440 y 390: **28/28 PASA, exit 0**. Cubre el esqueleto
   visible al cargar, que el saldo sea igual a la suma de pendientes y vencidas ($637,171.63), cada filtro (n.º
   de filas, estado de cada fila y URL), «Ver más» (15 → 30), el detalle de FE-88001 (6 líneas, subtotal,
   ITBMS 7 % y total contra el JSON), el foco inicial, la URL, que Esc cierre y devuelva el foco, que «atrás»
   cierre, que no haya errores de consola, y los estados de error y de vacío.
5. Miré las capturas a 390, 768 y 1440. Al verlas corregí dos cosas. Las tarjetas de móvil partían la fecha
   en dos líneas, así que las reorganicé en una grilla de 2 × 2. Y la tarjeta «Próximo vencimiento» mostraba
   una fecha ya pasada (FE-88043 está «pendiente» con vencimiento el 9 may 2026), así que la renombré a
   «Pendiente que vence primero» y cambié «Por vencer» por «Pendiente».
6. Apagué el servidor de preview al terminar.

## Pendiente o no cubierto

- Por el encargo no hubo revisión independiente de UX, PR ni despliegue.
- Las 9 facturas «pendientes» tienen vencimiento anterior a hoy (2026-11-13). La pantalla muestra el estado
  que traen los datos y no lo recalcula. Si deben pasar a «vencida», eso se corrige en la fuente.
- No hay descarga de PDF: los datos no traen el documento.
