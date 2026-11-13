---
name: estandar-interfaz
description: Estándar OBLIGATORIO de diseño y UX para TODO frontend nuevo o rediseñado — tablero, app, portal, landing, formulario, deck web — de cualquier cliente o proyecto. Exige partir de 21st.dev (inspiración y componentes, servicio pagado), aplicar el design system del cliente, cumplir el checklist de UX (responsive 390/768/1440, jerarquía, estados, accesibilidad, tarjetas y tablas que se adaptan) y pasar `verificar-interfaz.mjs` con capturas en el PR, más una revisión de UX independiente antes del merge. Úsalo SIEMPRE antes de escribir UI, al rediseñar, y cuando el usuario diga «el diseño es básico», «no es responsive», «mejora la UX», «usa 21st», «hazlo como debe ser».
---

# Estándar de interfaz

Regla nacida el 2026-11-09: dos tableros salieron con tarjetas básicas, sin responsive y sin pasar
por 21st.dev, aunque 21st estaba instalado como herramienta núcleo, y hubo que rehacerlos.
Instalado no es usado: **el diseño se parte de 21st y se demuestra con capturas, no se declara.**

## El flujo (no se salta ningún paso)

1. **Contexto de diseño.** El design system del cliente manda (su skill o sus tokens, si existen). Se leen sus
   tokens antes de diseñar.
2. **21st primero.** Antes de escribir un componente, buscar en 21st.dev con el skill
   `21st:21st-ui-build` (o `21st:21st-ui-explore` si la dirección no está decidida) y las herramientas
   `mcp__plugin_21st_21st__search` / `get_inspiration` / `get_component`. Mínimo: el layout general
   (shell, navegación), las tarjetas KPI, las tablas y los formularios salen de un patrón de 21st
   adaptado a los tokens del cliente. El PR lista los ids o enlaces de 21st usados.
3. **Checklist de UX** (cada punto es criterio de aceptación):
   - **Responsive real** a 390, 768 y 1440 px: nada se sale del ancho; la navegación colapsa en móvil;
     las tablas anchas pasan a tarjetas o a scroll interno con columna fija, nunca a scroll de página.
   - **Jerarquía**: una cifra protagonista por tarjeta, etiqueta y unidad claras, comparación (vs. meta,
     vs. período) cuando existe; 5–7 cifras primarias por pantalla (`rules/tableros.md`).
   - **Tarjetas con intención**: no cajas iguales en grilla; tamaño según importancia, con tendencia
     (sparkline o delta) y acción al pulsar (drawer de detalle).
   - **Estados**: carga (skeleton), vacío (qué significa y qué hacer), error (qué falló y cómo seguir).
   - **Accesibilidad**: contraste AA, foco visible, áreas táctiles ≥ 44 px en móvil, nombres accesibles,
     «reducir movimiento».
   - **Gráficos**: skill `dataviz` para formas y colores; nada de tortas de más de 4 partes.
   - **Formularios**: etiqueta visible, ayuda inline, validación en el campo, botón principal único.
4. **Verificación.** `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs <url>…
   --out capturas-interfaz` contra el build local (y, si hay sesión, `--cookie`) debe salir en 0. Las
   capturas de los tres anchos van en el PR. Si la pantalla trae sus datos después de cargar (fetch,
   API lenta), agrega `--esperar 3000`: sin eso el verificador revisa el esqueleto de carga y sale en 0
   sin haber visto la pantalla real (detectado en la evaluación del skill, 2026-11-13).
5. **Revisión independiente, antes de abrir el PR.** Quien construye no audita: con la rama empujada
   y las capturas listas, el agente `ux-designer` (otro agente, no el constructor) revisa capturas y
   código contra este checklist y entrega `APTO / NO APTO`. Los hallazgos que bloquean o son
   importantes se corrigen y se vuelve a verificar; solo con `APTO` se abre el PR con auto-merge.
   (El 2026-11-09 el rediseño de operaciones se fusionó antes de la revisión: por eso va antes del PR.)

## Qué NO hacer

- No escribir UI «a mano» sin haber consultado 21st.
- No declarar «responsive» sin las capturas de 390 px.
- No entregar una pantalla cuya única verificación sea `make check`.
