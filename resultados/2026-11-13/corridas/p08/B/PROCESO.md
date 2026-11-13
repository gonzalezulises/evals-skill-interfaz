# Proceso: pantalla de inventario por bodega

## Herramientas y fuentes consultadas

- **Código del proyecto:** `README.md` (React 19 + Vite + Tailwind v4; «Andes Logística no tiene design
  system propio»), `src/lib/api.ts`, `src/data/inventario.json` (120 artículos, 4 bodegas: Panamá
  Pacífico, Tocumen, Colón, David; 3 agotados, 63 bajo mínimo).
- **Design system:** no existe. Usé una paleta neutra (slate) con un acento teal, los iconos de
  `lucide-react` que ya estaban en el proyecto y las utilidades de Tailwind.
- **Sin skills ni 21st.dev:** el encargo prohibía usar el tool Skill y leer `~/.agents` y `~/.claude`.
  No consulté 21st.dev, Context7 ni ninguna fuente externa de diseño. El diseño sale del criterio
  propio, no de una referencia citada.
- **Verificación:** Playwright 1.66 (del caché de npx) con el chrome-headless-shell 1248 ya
  instalado, ejecutado contra `npm run preview -- --port 4817 --strictPort`. El script de prueba
  quedó fuera del proyecto, en el scratchpad (`p08-verif/verif.cjs`).

## Qué se construyó

- `src/App.tsx`: selector de bodega (Todas + 4), 4 cifras de resumen, búsqueda por SKU o
  descripción, filtro por estado, orden (urgencia por defecto), tabla desde 1024 px y tarjetas
  por debajo de ese ancho (1 columna en móvil, 2 en tablet).
- Estados: cargando (esqueleto + `role=status`), carga lenta (aviso a los 3 s), error sin datos
  (mensaje + Reintentar), error al actualizar con datos previos (los conserva y avisa con la hora),
  bodega vacía (mensaje distinto del error + «Ver todas las bodegas») y filtros sin coincidencias.
- Respuestas fuera de orden: si se cambia de bodega antes de que responda la anterior, la respuesta
  vieja se descarta (contador de petición). Nunca se muestran los datos de otra bodega mientras carga.
- `src/lib/api.ts`: añadí `?sim=error|vacio|lento|aleatorio` para reproducir en local los casos de
  producción. Sin el parámetro, la función se comporta igual que antes.

## Qué verifiqué (build de producción en el navegador, `npm run build` sin errores de tipos)

| Caso | Resultado |
|---|---|
| Carga inicial muestra «Cargando…» a 390, 768 y 1440 | PASA |
| Sin scroll horizontal a 390, 768 y 1440 (exceso 0 px) | PASA |
| `?sim=error`: estado de error con un botón Reintentar, que vuelve a consultar | PASA |
| `?sim=vacio` + Colón: «Colón no tiene artículos registrados», cifras en 0 | PASA |
| `?sim=lento`: aviso «está tardando más de lo normal» a los 3,5 s | PASA |
| Clic rápido Tocumen → David: quedan solo las 28 filas de David | PASA |
| Búsqueda «zzz»: «Ningún artículo coincide» + Quitar filtros | PASA |
| Filtro Agotados (1 fila en David) | PASA |
| Falla al actualizar con datos: conserva las 28 filas y muestra el aviso | PASA |
| Foco visible con teclado (outline sólido) | PASA |
| Consola sin errores en todas las corridas | PASA (0 errores) |

Revisé a ojo las capturas de datos (390/768/1440), error (390), vacío (1440) y actualización
fallida (1440). De esa revisión salieron dos correcciones: en el estado de error, las cifras
mostraban el esqueleto de carga para siempre (ahora muestran «—»), y el aviso tenía un punto doble
después de «a. m.».

## Lo que no se verificó

- No hubo revisión de UX independiente ni partí de 21st.dev: el encargo lo impedía.
- Sin modo oscuro, sin paginación (120 filas se pintan sin problema) y sin pruebas con lector de
  pantalla real; solo revisé los roles ARIA en el código.
- La API real puede fallar de formas que el simulador no cubre (timeout sin respuesta, datos
  malformados); la pantalla no tiene un tiempo límite propio.
