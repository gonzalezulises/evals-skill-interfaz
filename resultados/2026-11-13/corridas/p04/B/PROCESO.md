# Proceso: pantalla de comparación de proyectos

## Qué se construyó

- `src/App.tsx`: pantalla en `/` para comparar los 40 proyectos con sus 12 indicadores.
  - Resumen arriba con 4 cifras: riesgo alto, con atraso, sobre costo y ejecutado frente a presupuesto.
  - Barra de herramientas fija: búsqueda (proyecto, código o gerente), filtro por riesgo con conteos y «Ordenar por» con cualquiera de los indicadores, en sentido ascendente o descendente.
  - **Celular (<768 px):** lista de tarjetas con ranking. El indicador que ordena va destacado con su barra relativa a los 40 y debajo hay 3 a 6 indicadores clave con semáforo. Al tocar una tarjeta se abre una hoja inferior (`<dialog>` nativo) con los 12 indicadores, cada uno frente a la mediana de los 40.
  - **Tablet y escritorio (≥768 px):** tabla con los 12 indicadores, encabezado y primera columna fijos, orden por clic en el encabezado (`aria-sort`) y la columna activa resaltada.
  - Estado vacío con «Limpiar filtros». No hay estados de carga ni de error porque los datos son un JSON estático importado, no una API.
- `src/lib/proyectos.ts`: definición de los indicadores (etiqueta, formato, sentido y umbrales de semáforo), rango y mediana. «Hitos cumplidos/totales» se muestra junto como `n/10`, porque todos los proyectos tienen 10 hitos.
- `src/index.css`: tokens de color en `:root` con modo oscuro por `prefers-color-scheme`, expuestos a Tailwind v4 con `@theme inline`.

## Herramientas, skills y fuentes de diseño consultadas

- El encargo prohibía usar el tool Skill y leer `~/.agents` y `~/.claude`, así que **no se consultó** ningún skill ni 21st.dev, ni otro catálogo o design system externo. El README del proyecto dice que Andes Logística no tiene design system propio. El diseño es propio: Tailwind v4, iconos de `lucide-react` (ya en dependencias) y criterios generales de UX (overview primero y detalle bajo demanda, áreas táctiles de 44 px, `tabular-nums`, semáforo además del texto).
- Datos: `src/data/proyectos.json` (rangos revisados con un script de Python antes de fijar los umbrales).
- Navegador de verificación: Playwright 1.65 (caché de npx) con `chrome-headless-shell` 1248 en modo headless, en lugar del Chrome del usuario.

## Qué se verificó

- `npm run build` (tsc + vite) sale en verde.
- Se probó con `npm run preview -- --port 4809 --strictPort` y un script de Playwright a 390×844, 768×1024 y 1440×900, en modo claro y oscuro:
  - Sin desbordamiento horizontal de la página en ninguno de los 3 anchos. El primer intento desbordaba a 390 y 768 por la tarjeta «Ejecutado» y los chips de riesgo; se corrigió.
  - Ningún botón, input ni select fuera de la tabla mide menos de 44 px de alto.
  - Cero errores de consola, cero `pageerror` y cero requests fallidos.
  - A 390 px se ven 40 tarjetas y ninguna fila de tabla; a 768 y 1440 px se ven 40 filas y ninguna tarjeta.
  - Abrir el detalle muestra la hoja con 10 filas más el badge de riesgo, y `Escape` la cierra.
  - Filtro «Riesgo alto» + orden por días de atraso: «16 de 40 proyectos» y primero P-118 (74 d), coherente con los datos.
  - Al buscar «zzz» aparece el estado vacío, y «Limpiar filtros» vuelve a 40.
- Revisé a ojo las capturas (no forman parte del repo; están en el scratchpad, en `p04B-verif/`): 390 claro y oscuro, 390 con detalle, 390 ordenado por desviación, 768 oscuro y 1440 claro.
- Servidor de preview apagado al terminar.

## Lo que no se hizo

- No hubo revisión de UX independiente ni se usaron componentes de 21st.dev (restricción del encargo).
- No se midió el contraste con una herramienta. Los colores de semáforo se eligieron oscuros en claro y claros en oscuro, pero no se midieron.
- No hay tests automatizados en el repo: la verificación de Playwright quedó en un script fuera del proyecto.
