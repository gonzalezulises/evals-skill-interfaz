# Proceso: pantalla de configuración de la cuenta

## Fuentes consultadas
- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo y checklist de UX); skill `21st:21st-ui-build`.
- **Design system:** el README dice que Andes Logística no tiene design system propio. Definí tokens neutros estilo shadcn en `src/index.css` (`@theme`), con contraste AA sobre fondo claro.
- **21st.dev** (MCP `search` y `get_inspiration`; código descargado con `get_component`):
  - #28366 «Settings Sidebar Layout» (felipemenezes098/settings-2): shell con navegación lateral de secciones → `src/App.tsx`. https://21st.dev/@felipemenezes098/components/settings-2
  - #28426 «Profile And Notification Cards» (olewandowski1/settings-1): tarjetas de perfil y notificaciones con switches, más un aviso al guardar → `src/components/perfil.tsx`. https://21st.dev/@olewandowski1/components/settings-1
  - #25081 «Delete Account Form» (cnippet-dev/v-form-12): zona de cierre que pide escribir una frase para confirmar → `src/components/cierre.tsx`. https://21st.dev/@cnippet-dev/components/v-form-12
  - Solo como inspiración, sin descargar el código: #24937 (pestañas verticales de ajustes) y #24862 (lista de usuarios con insignias de rol).
  - Primitivas shadcn (button, input, switch, card) reimplementadas sin Radix en `src/components/ui.tsx`, porque el proyecto no lo tiene. No agregué dependencias.

## Qué incluye
Perfil (validación en el campo, guardar o descartar, un solo botón principal). Notificaciones por evento y canal, con opción de pausar todo. Equipo: invitar por correo con rol, cambiar el rol, quitar personas; se ve como tabla desde 768 px y como tarjetas en móvil; tiene estados de carga, vacío y error con «Reintentar» (se fuerzan con `?equipo=vacio` y `?equipo=error`). Zona de cierre con un `<dialog>` que pide escribir una frase. Además: navegación fija que se vuelve barra horizontal en móvil, enlace «Saltar al contenido», avisos `aria-live` y soporte de «reducir movimiento».

## Verificación (contra `npm run build` + `npm run preview --port 4820`)
- `npm run build` (tsc + vite): verde.
- `node ~/.agents/skills/estandar-interfaz/scripts/verificar-interfaz.mjs http://localhost:4820/ "…/?equipo=error" "…/?equipo=vacio" --out capturas-interfaz --esperar 3000` → **exit 0** (3 URL × 390/768/1440). La primera corrida falló por áreas táctiles (los botones de quitar medían 40 px de ancho y el enlace de salto 1×1). Los corregí y volví a correrlo.
- `node pruebas/interaccion.mjs` (Playwright): 16/16 PASA. Cubre el esqueleto de carga, la tabla, el error en el campo de correo, el guardado con aviso, los switches (`aria-checked`), la invitación duplicada rechazada, la invitación nueva, el cambio de rol, quitar a una persona, el botón destructivo desactivado hasta escribir la frase, Escape para cerrar el diálogo, el foco del primer Tab, los estados de error y vacío y la consola sin errores.
- Capturas en `capturas-interfaz/`: `inicio-{movil,tableta,escritorio}.png`, `equipo_error-*`, `equipo_vacio-*` y `dialogo-cierre-movil.png`. Las revisé a mano.

## No hecho / límites
- No hubo revisión independiente de UX (`ux-designer`), ni PR ni merge: el encargo los excluye.
- Los datos y la API del equipo son simulados (`src/data/equipo.json`, `src/lib/equipo.ts`); nada se guarda en un backend.
- Para quitar a un miembro se usa `window.confirm` nativo, no un diálogo propio.
