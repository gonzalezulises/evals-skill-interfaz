# Proceso — pantalla de configuración de la cuenta

## Fuentes de diseño consultadas

- **Proyecto**: `README.md` (React 19 + Vite + Tailwind v4; «Andes Logística no tiene design system propio»). Por eso definí tokens propios en `src/index.css` (`@theme`, con modo oscuro por `prefers-color-scheme`).
- **21st.dev (MCP `plugin_21st_21st`)**:
  - `get_inspiration` («account settings page… danger zone»), feedbackId `e929af0a-ccd5-4978-823d-bd78387ba9ec`. Referencias tomadas:
    - id 28366 «Settings Sidebar Layout» (felipemenezes098/settings-2): navegación lateral + secciones → nav lateral fija en escritorio, pestañas desplazables en móvil.
    - id 28426 «Profile And Notification Cards» (olewandowski1/settings-1) e id 26523 «Notification Settings Field» (shadcnspace/field-02): tarjetas con título + descripción + switches y guardado con aviso.
    - id 25081 «Delete Account Form» (cnippet-dev/v-form-12), **código obtenido con `get_component`**: patrón de frase de confirmación que habilita el botón destructivo. Reimplementado sin sus dependencias (Radix, react-hook-form) con el `<dialog>` nativo.
  - `search` («team members list with role select and invite»): ids 25086 «Invite Team Member Form», 28202 «Invite Team Card», 5799 «Team Invite» → formulario correo + rol arriba de la lista de miembros.
- No agregué dependencias: solo las ya presentes (lucide-react, cva, clsx, tailwind-merge).

## Qué se construyó (`src/App.tsx`, `src/components/*`, `src/data/cuenta.ts`)

- **Perfil**: formulario con validación (nombre, correo, teléfono), foco al primer error, botón Guardar deshabilitado sin cambios, «Descartar cambios», estado «Guardando…», aviso de confirmación (`role="status"`).
- **Notificaciones**: matriz evento × canal (Correo, En la app, SMS) con switches `role="switch"`; tabla en ≥768 px, bloques apilados con etiqueta visible en móvil.
- **Equipo**: invitar por correo con rol (rechaza duplicados y correos inválidos), lista de miembros con rol editable, «Tú», invitación pendiente, último acceso; el propietario no es editable; quitar o cancelar una invitación pide confirmación en un diálogo modal (Esc cierra).
- **Cerrar la cuenta**: zona con borde de peligro, consecuencias listadas y diálogo que exige escribir «Andes Logística» para habilitar el botón definitivo.
- Responsive: una columna en 390 px, dos columnas de formulario en 768 px, nav lateral en 1440 px. Enlace «Saltar al contenido», `aria-current` en la nav, `prefers-reduced-motion`.
- Los guardados son simulados (`guardar()` con 700 ms de latencia): no hay API real de cuenta en el proyecto.

## Qué verifiqué

- `npm run build` (tsc + vite) en verde.
- `verificacion/verificar.cjs` con Playwright (Chromium headless, sobre `npm run preview` en el puerto 4821): **58 comprobaciones, 0 fallas**.
  - A 390, 768 y 1440 px, en claro y oscuro: sin scroll horizontal, ningún elemento fuera del viewport, todos los controles con nombre accesible, objetivos ≥ 24 px, un solo `h1`, 0 errores de consola o de red.
  - Flujos: validación y guardado del perfil; switch operado con teclado y guardado; invitación duplicada rechazada, invitación nueva añadida; cambio de rol; propietario no editable; quitar con confirmación (Esc cancela, confirmar elimina); cierre de cuenta deshabilitado hasta escribir el nombre exacto, foco en el campo, confirmación final.
- Capturas revisadas a ojo en `verificacion/capturas/` (`pantalla-{390,768,1440}-{light,dark}.png`, `flujo-quitar-390.png`, `flujo-cerrar-390.png`).
- Servidor de preview apagado al terminar.

## Lo que no se verificó

- No hubo revisión de UX independiente (otra persona o agente) ni prueba con un lector de pantalla real; la accesibilidad se comprobó solo con las verificaciones automáticas de arriba.
- No hay backend: la persistencia es simulada.
