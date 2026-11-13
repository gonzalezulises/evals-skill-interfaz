# Proceso: tablero de cartera por cobrar

## Qué se consultó

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md`. Seguí los pasos 1 a 4. El paso 5 (revisión por otro agente) y el PR quedan fuera por indicación del encargo.
- **Design system:** el `README.md` dice que «Andes Logística no tiene design system propio». Por eso usé tokens neutros al estilo shadcn, que son los que espera el componente de 21st, en `src/index.css`.
- **21st.dev** (skill `21st:21st-ui-build` y MCP):
  - Usé `search` («finance dashboard accounts receivable KPI cards», «aging buckets stacked bar data table responsive») y `get_inspiration` (antigüedad de cartera con KPI, drawer y facturado vs. cobrado).
  - **Componente usado:** `get_component` id **33507**, «Charts & KPI Cards» de @uvain, https://21st.dev/@uvain/components/revenue-charts-kpi. De ahí salen `ChartCard`, `BarCompare` (leyenda, tooltip y tabla oculta para lectores de pantalla), `Sparkline` y `KpiCard` (con su lógica de «si subir es bueno»). Los adapté en `src/components/charts.tsx`: textos en español, el delta en puntos porcentuales y sin `corner-shape`.
  - **Revisados y descartados:** 29167 (Insight Cards), 15024 (Progress Metric Card), 2342 (horizontal bar stack de visx), 99 y 1050 (tablas de originui y shadcn). No los usé para no meter dependencias nuevas (visx, TanStack). La barra de antigüedad y la tabla se hicieron con HTML y Tailwind, siguiendo esos patrones.
- **Skill `dataviz`:**
  - La paleta salió de `references/palette.md` y la validé con `scripts/validate_palette.js`:
    - Categórica, facturado `#2a78d6` y cobrado `#eb6834`: pasan todas las comprobaciones (CVD ΔE 24.7).
    - Ordinal de antigüedad, rampa azul 250/400/550/700 con `--ordinal`: pasa todas las comprobaciones. Más días se ve más oscuro.
    - Rojo de estado `#d03b3b`, reservado para «sobre el límite», siempre acompañado de un icono y un texto.
  - Respeté las demás reglas: un solo eje, sin tortas y la leyenda presente.
- **Reglas de tableros** (`rules/tableros.md`): hay 4 cifras primarias; no hay prosa de manual y el detalle se abre al pulsar (drawer).

## Qué hace la pantalla

- **Cuatro indicadores.** La cifra principal es la cartera total. Los otros tres son:
  - el saldo con más de 90 días y su porcentaje;
  - lo cobrado sobre lo facturado en octubre, con su delta frente a septiembre y una sparkline de 6 meses;
  - los clientes sobre su límite de crédito.
- **Antigüedad.** Una barra apilada al 100 % con los cuatro tramos. Cada tramo se puede pulsar y filtra la tabla de clientes.
- **Cobrado frente a facturado.** Barras agrupadas por mes, un tooltip con el porcentaje cobrado y una fila con ese porcentaje por mes (en rojo si queda por debajo del 80 %).
- **Clientes que más deben.**
  - Muestra el top 10 y se puede ampliar a los 60.
  - Tiene una búsqueda con etiqueta visible.
  - En tableta y escritorio es una tabla; en móvil son tarjetas.
  - Al pulsar un cliente se abre un drawer (`<dialog>` nativo) con el saldo por tramo y el uso del límite.
- **Estados:**
  - Carga: un esqueleto, porque los datos llegan con un `import()` diferido.
  - Error: el mensaje y un botón «Reintentar».
  - Vacío: sin datos, o una búsqueda o filtro sin resultados, con una acción para restablecer.

## Qué se verificó (contra `npm run build` + `npm run preview --port 4804`)

1. `npm run build` termina sin errores de tipos (`tsc --noEmit`). Solo queda el aviso de Vite de que un chunk pesa más de 500 kB, que viene de Recharts.
2. `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs http://localhost:4804/ --out capturas-interfaz --esperar 2000` → **exit 0**, «OK: 1 URL × 3 anchos». Lo corrí después del último cambio.
3. Revisé a ojo las capturas `capturas-interfaz/inicio-{movil,tableta,escritorio}.png`. A 768 px había una tarjeta KPI huérfana; la corregí (3 columnas) y volví a verificar.
4. `node pruebas/interacciones.mjs` (Playwright, 390 y 1440 px) da **14 de 14 casos correctos**:
   - el drawer abre y Esc lo cierra;
   - el filtro por tramo «Más de 90 días» funciona;
   - una búsqueda sin resultados muestra el estado vacío, y su botón restablece la vista;
   - hay 0 errores de consola;
   - con la carga de datos demorada y luego abortada se ven el esqueleto y después el error con «Reintentar».
   - Capturas: `drawer-*.png`, `vacio-*.png`, `cargando-390.png`, `error-390.png`.
5. El servidor de preview quedó apagado y el puerto 4804 está libre.

## Supuestos y límites

- **Moneda:** el JSON no dice cuál es. Mostré USD (`$`, formato es-PA). Si es otra, se cambia en `src/lib/cartera.ts`.
- **Fecha de corte:** los saldos no traen fecha. Por eso el encabezado dice «Último mes con datos: octubre 2026», que es el último mes de `cobradoMensual`.
- **Sin modo oscuro:** el proyecto no lo tiene y el encargo no lo pide.
- **Sin revisión independiente de UX:** el paso 5 del estándar se omitió por instrucción del encargo.
