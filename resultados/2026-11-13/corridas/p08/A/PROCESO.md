# Proceso: pantalla de inventario por bodega

## Fuentes consultadas

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo, checklist de UX y verificador).
- **Design system:** el README dice que Andes Logística no tiene uno propio. Usé la paleta neutra slate de Tailwind con teal-700 de acento (AA sobre blanco) y colores semánticos para el estado (rose = agotado, amber = bajo el mínimo, emerald = en nivel).
- **21st.dev (MCP `mcp__plugin_21st_21st__*`):**
  - `get_inspiration` y `search` («inventory table… loading skeleton, empty and error states», «data table skeleton loading empty state error retry»).
  - `get_component` 29962, **Inventory Table** (@arihantcodes_1f7b8c4d), https://21st.dev/@arihantcodes_1f7b8c4d/components/inventory-table: de aquí salen la barra de existencia con color por umbral, el chip de estado y la celda con nombre y SKU en mono.
  - `get_component` 19376, **Error Empty State** (@olewandowski1), https://21st.dev/@olewandowski1/components/empty-states-4: de aquí salen el estado de error (icono con acento destructivo, título, explicación y «Reintentar») y la misma estructura para el estado vacío.
  - Como inspiración, sin descargar el código: 29396, **Empty Table** (el esqueleto conserva la estructura de la tabla); 19002, **Data Table Skeleton**; 19768, **Table** (@cnippet-dev, primitivo con scroll y variante tarjeta).
  - Reimplementé todo con Tailwind y `lucide-react`, que ya estaban en el proyecto. No agregué dependencias: ni shadcn, ni sonner, ni remixicon.

## Qué hice

- `src/lib/api.ts`: el comportamiento por defecto no cambia. Agregué `?simular=error | vacio | lento | falla-una-vez` para reproducir los casos de producción a voluntad.
- `src/lib/inventario.ts`: hook `useInventario` con estados `cargando | error | listo`. Descarta las respuestas viejas cuando se cambia de bodega a mitad de una carga y avisa a los 5 s si la API tarda.
- `src/components/estados.tsx`: esqueletos para las cifras y las filas, aviso de lentitud, error con «Reintentar», bodega vacía (qué significa y qué hacer: «Ver todas las bodegas» o «Volver a consultar») y «ninguna coincidencia» con «Limpiar filtros».
- `src/components/articulos.tsx`: tabla a partir de 768 px y tarjetas por debajo. La barra marca el mínimo. Pulsar una fila abre un panel de detalle (`<dialog>`: lateral en escritorio, hoja inferior en móvil, se cierra con Esc) con el faltante y el costo de reponer.
- `src/App.tsx`: pestañas de bodega que se guardan en `?bodega=`. Cuatro cifras: una protagonista (artículos por reponer, con su proporción y el botón «Ver los que faltan» que filtra la lista), más el valor del inventario, los SKU y el costo de reponer al mínimo. También búsqueda y filtro por estado con etiquetas visibles, la hora de los datos, «Actualizar», paginación de 30 en 30 y una región `aria-live` que anuncia los cambios de estado.

## Qué verifiqué (sobre `npm run build` + `npm run preview --port 4816`)

1. `npm run build` (tsc + vite): sin errores.
2. `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs` sobre `/`, `/?bodega=Tocumen`, `/?simular=error`, `/?bodega=David&simular=vacio` y `/?simular=lento`: **OK: 5 URL × 3 anchos**, salida 0. Las capturas están en `capturas-interfaz/`. Ojo: este verificador captura al llegar a `networkidle`, así que la mayoría de esas capturas muestran el esqueleto de carga.
3. Script propio con Playwright (`scratchpad/p08-estados.mjs`) que espera a que cada estado termine de pintarse, a 390, 768 y 1440 px. Mide el desborde horizontal, los controles de menos de 44 px en móvil y los errores de consola. Los 15 casos (listo con todas las bodegas, listo con Tocumen, error, vacío y lento) **pasan**. Las capturas están en `capturas-estados/`.
4. Interacciones, a 390 y 1440 px, todas **PASAN**:
   - Tocumen muestra 31 artículos, igual que el JSON.
   - «Ver los que faltan» deja 12 de 12; según el JSON, en Tocumen hay 12 artículos con existencia por debajo del mínimo.
   - Una búsqueda sin resultados muestra su estado y «Limpiar filtros» lo restablece.
   - El panel de detalle abre y se cierra con Esc.
   - Al cambiar rápido de Colón a David se ve David (28 artículos), no la respuesta vieja.
   - Tras un error, «Reintentar» recupera los datos (`falla-una-vez`).
   - En el estado vacío, «Ver todas las bodegas» cambia la bodega.
5. Revisé las capturas a ojo: lista y tabla, error a 390, vacío a 768, panel a 390 y aviso de lentitud a 1440. Corregí «1 agotados» y quité una cifra repetida (los agotados ya aparecen en la tarjeta protagonista).

## No cubierto

- No hubo revisión independiente de UX ni PR: el encargo los excluye.
- Lector de pantalla real: no lo probé. Solo revisé los roles, las etiquetas y `aria-live` en el código.
- A 390 px las pestañas de bodega se desplazan en horizontal dentro de su propia barra («David» queda fuera de la vista inicial). No genera scroll en la página.
