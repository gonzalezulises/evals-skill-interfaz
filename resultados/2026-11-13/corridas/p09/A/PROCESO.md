# Proceso: tablero de clima organizacional

## Lo que consulté

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md`, seguido paso a paso. Omití el PR, el merge y la revisión por otro agente, como pedía el encargo.
- **Design system:** el README dice que Andes Logística no tiene uno. Definí tokens propios en `src/index.css`, con modo claro y oscuro.
- **Skill `21st:21st-ui-build`:** su flujo. No hay `.21st/design.json` en el proyecto, así que busqué en el catálogo por MCP.
- **21st.dev, búsquedas (`mcp__plugin_21st_21st__search`):**
  - «employee survey analytics dashboard NPS score card»
  - «KPI stat card with delta trend»
  - «heatmap table matrix scores»
- **21st.dev, componente usado (`get_component`):**
  - **id 33507**, «Charts & KPI Cards» (uvain/revenue-charts-kpi), https://21st.dev/@uvain/components/revenue-charts-kpi.
  - Lo adapté a los tokens locales en `src/components/ui.tsx`. Tomé estas ideas:
    - tarjeta con título y subtítulo;
    - KPI con delta que lleva icono y texto (no depende solo del color);
    - grupo segmentado accesible con `role=radiogroup`;
    - tabla `sr-only` para lectores de pantalla en cada gráfico.
- **21st.dev, inspiración sin descargar código:**
  - id 29454, «Bench Matrix» (eugeneshilow), para la matriz área × dimensión;
  - id 39900, «Tweenly Chart KPI», y id 40086, «KPI Tile», para el delta.
- **Skill `dataviz`:**
  - de `references/palette.md` tomé el azul de la serie (#2a78d6, #3987e5 en modo oscuro), el rojo (#e34948) y la divergente azul↔rojo con gris al centro, con pasos propios para el modo oscuro;
  - no hay gráficos de doble eje;
  - no hay tortas: el eNPS es una barra apilada de 3 partes con leyenda y cifras.

## Qué construí (`src/App.tsx`, `src/components/ui.tsx`, `src/lib/clima.ts`, `src/index.css`)

1. **eNPS como cifra protagonista: +8.** Se calcula como % de promotores menos % de detractores con 148, 151 y 113 respuestas. Lleva una barra apilada y el conteo de cada grupo.
2. **Tres cifras de apoyo:**
   - participación: 77,7 % (412 de 530);
   - promedio de las dimensiones: 3,64, contra 3,53 en la medición anterior;
   - mayor caída: Herramientas, que baja 0,82. Al pulsarla se abre el detalle.
3. **Puntaje por dimensión:** un gráfico de mancuernas de la medición anterior a la actual, con un delta que lleva signo, icono y color. Se puede ordenar por «mayor caída» o por «puntaje». Al pulsar una fila se abre un drawer con el puntaje de cada área en esa dimensión y los comentarios de ese tema.
4. **Resultados por área:**
   - mapa de calor de 6 áreas × 7 dimensiones con 5 bandas divergentes, leyenda, n por celda y una fila con el total de la empresa;
   - en móvil y tableta la tabla se desplaza dentro de su caja y la columna del área queda fija;
   - al pulsar un área se abre un drawer con cada dimensión del área frente a la empresa y los comentarios del área.
5. **Comentarios:** se filtran por área y por tema con etiquetas visibles. Se muestran 5 y un botón despliega los 30.
6. **Estados:**
   - error, si el JSON tiene una forma inválida: dice qué falta y qué hacer;
   - vacío, si hay 0 respuestas;
   - vacío en filtros, con un botón «Quitar filtros»;
   - vacío en el drawer cuando no hay comentarios.
   - **No hay skeleton de carga:** los datos se importan en el bundle y no hay espera que mostrar.
7. **Accesibilidad:**
   - foco visible;
   - áreas táctiles de al menos 44 px;
   - nombres accesibles en las filas que se pueden pulsar;
   - el drawer es un `dialog` modal: atrapa el foco, se cierra con Esc y devuelve el foco a quien lo abrió;
   - se respeta `prefers-reduced-motion`;
   - hay modo oscuro.

**Supuestos:**
- Los puntajes van de 1 a 5. El dato no lo dice; lo inferí de los valores.
- El «promedio de las dimensiones» es un promedio simple de las 7.
- El JSON no trae el eNPS de la medición anterior, así que el eNPS se muestra sin comparar.

## Qué verifiqué (contra `npm run build` + `npm run preview -- --port 4818`)

- **`npm run build`:** `tsc --noEmit` y `vite build` salen sin errores.
- **`node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs http://localhost:4818/ --out capturas-interfaz`:** salida 0, «OK: 1 URL × 3 anchos». No usé `--esperar` porque los datos no se cargan de forma asíncrona.
  - Capturas: `capturas-interfaz/inicio-movil.png` (390), `inicio-tableta.png` (768) e `inicio-escritorio.png` (1440).
- **`node pruebas/interaccion.mjs`:** salida 0, con 21 de 21 casos que pasan a 390 y a 1440 px:
  - el drawer de la dimensión abre con los 8 comentarios de Herramientas;
  - Esc lo cierra y el foco vuelve a la fila;
  - el drawer de Comercial abre con sus 8 comentarios;
  - el filtro Área = Bodega deja 3 comentarios;
  - la combinación sin resultados muestra el estado vacío, y «Quitar filtros» vuelve a los 30;
  - al ordenar por puntaje, Comunicación queda primero;
  - no hay errores de consola;
  - el modo oscuro se aplica.
  - Capturas extra: `drawer-dimension-*.png`, `drawer-area-*.png`, `comentarios-vacio-*.png` y `oscuro-escritorio.png`.
- **Revisión visual de las capturas a 390, 768 y 1440 y en modo oscuro:** no hay desbordes ni texto encimado. En la primera vuelta encontré dos desequilibrios de altura en escritorio y los corregí:
  - la fila 1 dejaba espacio vacío bajo el eNPS: los KPI pasaron a 2 columnas;
  - la lista de comentarios era más larga que el gráfico: se muestran 5 de entrada.
- **Servidor apagado:** el puerto 4818 quedó libre.

## Lo que no se hizo (por el encargo)

- No hubo revisión independiente de UX con `ux-designer`: el encargo la excluye. Por eso no hay un veredicto APTO de un tercero.
- No hubo commit, PR ni despliegue.
