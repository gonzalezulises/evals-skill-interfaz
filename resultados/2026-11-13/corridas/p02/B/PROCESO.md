# Proceso: tablero de cartera por cobrar

## Qué construí

- `src/App.tsx`: pantalla en `/` con
  - 4 cifras: cartera total, saldo a más de 90 días, cobrado/facturado del último mes (con la variación frente al mes anterior) y clientes que pasan su límite de crédito;
  - **Antigüedad de saldos**: barra apilada de 0–30 / 31–60 / 61–90 / +90 días con la tabla de montos y %, y debajo el saldo a más de 60 días y cuántos clientes tienen saldo a +90;
  - **Cobrado frente a facturado**: barras agrupadas por mes (may–oct 2026), la brecha acumulada, el % cobrado de cada mes (en rojo si baja de 80 %) y un tooltip con ese %;
  - **Clientes que más deben**: los 10 primeros (o los 60) ordenables por saldo total, +90 días o uso del límite, con la antigüedad de cada cliente en una mini-barra y el uso del límite marcado cuando lo excede. Al pulsar una fila (o con Tab + Enter) se abre un panel lateral con el detalle del cliente. En móvil la tabla pasa a tarjetas.
- `src/lib/cartera.ts`: cálculos (totales, tramos, uso del límite, tasa de cobro) y formatos.
- `src/components/charts.tsx`: ChartCard, KpiCard y BarCompare.
- `src/index.css`: tokens de color en claro y oscuro (`prefers-color-scheme`); rampa de antigüedad de verde a rojo.

## Fuentes de diseño consultadas

- El README del proyecto dice que Andes Logística no tiene design system propio. Por eso usé tokens neutros tipo shadcn definidos en `src/index.css`.
- **21st.dev**, MCP `get_inspiration`, consulta «finance accounts receivable aging dashboard…» (feedbackId `c9c7eb9d-21c0-4525-8f65-c07e58bec95f`). Candidatos vistos: 33507, 29223, 30660, 44655 y 22187.
- **21st.dev**, MCP `get_component` id **33507**, «Charts & KPI Cards» (Layro System), https://21st.dev/@uvain/components/revenue-charts-kpi. Adapté en `src/components/charts.tsx` su ChartCard, KpiCard (con el sentido de «subir es bueno o malo») y BarCompare. Conservé sus reglas: un solo eje Y, barras de 22–24 px como máximo, el texto nunca usa el color de la serie, leyenda cuando hay 2 o más series y una tabla oculta para lectores de pantalla. No instalé nada del registro: reimplementé el código con los tokens del proyecto.
- No usé ningún skill: el encargo lo prohíbe.

## Verificación

- `npm run build` (tsc + vite) termina en verde. Solo queda el aviso de que el bundle pesa más de 500 kB, que viene de recharts.
- Revisé los cálculos contra el JSON con Python. Cartera total: $2,607,796. Tramo +90: $383,044. Clientes sobre su límite: 10, que suman $216,643 por encima. Cliente con más saldo: L2. Cliente con más saldo a +90 días: I2. Los cuatro coinciden con lo que muestra la pantalla.
- `.tools/verificar.mjs` usa playwright-core 1.56.1, instalado solo en `.tools/`, con el chrome-headless-shell 1254 que ya estaba en la caché. Corre contra `npm run preview` en el puerto 4805, sobre 390, 768 y 1440 px en claro y en oscuro. **Resultado: TODO PASA (0 fallas).** Comprueba:
  - que no haya scroll horizontal;
  - que el gráfico tenga sus 12 barras;
  - que todos los botones midan al menos 36 px de alto;
  - que haya 0 errores de consola y 0 peticiones fallidas;
  - que el panel lateral abra con el cliente correcto y se cierre con Escape;
  - que el orden por +90 días deje primero a I2;
  - que «Ver los 60» muestre 60 filas;
  - con teclado: Tab llega a una fila, Enter abre el detalle y el foco vuelve a la fila al cerrar;
  - que el tooltip muestre el % cobrado.
- Capturas en `capturas/`: `{390,768,1440}-{claro,oscuro}.png`, `*-detalle.png` y `1440-claro-tooltip.png`. Las revisé a mano.
- Apagué el servidor de preview; el puerto 4805 quedó libre.

## Limitaciones y supuestos

- El JSON no trae la moneda ni la fecha de corte de los saldos. Muestro los montos con «$» y como periodo uso el de la serie mensual (may–oct 2026).
- No hubo revisión de UX independiente (otro agente o persona).
- El MCP de Playwright compartido no podía escribir en este directorio, así que las capturas salen del script local. Ese navegador compartido quedó abierto en `localhost:4805`, ya apagado; no lo cerré porque otra sesión lo estaba usando.
