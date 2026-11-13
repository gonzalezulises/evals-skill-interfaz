# Proceso: formulario de alta de proveedor

## Qué se consultó

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md`, que dicta el flujo y el checklist de UX. Se omitieron el PR, el merge y la revisión por otro agente, como pide el encargo.
- **Design system:** el `README.md` del proyecto dice «Andes Logística no tiene design system propio». Por eso se definió un set mínimo de tokens neutros con contraste AA en `src/index.css` (`@theme`).
- **Skill `21st:21st-ui-build`:** se cargó y se siguió su regla de reutilizar antes que generar. No se usó la generación con IA.
- **21st.dev (MCP `mcp__plugin_21st_21st__*`):**
  - `search` «vendor onboarding form with file upload validation»
  - `search` «file upload dropzone»
  - `get_inspiration` «multi-section business registration form with inline validation and success confirmation»
  - `get_component` **25085**, «Multi-Field Form» (cnippet-dev/v-field-17), https://21st.dev/@cnippet-dev/components/v-field-17. De aquí sale la estructura de cada campo: etiqueta visible, ayuda y error en línea, y el botón de envío con estado de carga. Está en `src/components/ui/field.tsx`.
  - `get_component` **27137**, «File Upload» (uvain/file-upload), https://21st.dev/@uvain/components/file-upload. De aquí salen la zona de soltar con contador de profundidad del drag (para que no parpadee) y la idea de que un archivo rechazado se queda visible y dice el motivo. Está en `src/components/FileField.tsx`.
  - Ambos se reimplementaron con los tokens del proyecto y **sin dependencias nuevas** (ni Radix ni react-hook-form ni framer-motion). El componente de archivo pasó a un solo archivo por campo, sin subida propia.
- **Datos del proyecto:** `src/data/ordenes.json`. Sus 12 proveedores existentes alimentan un aviso no bloqueante de posible duplicado por razón social.

## Qué se construyó

- `src/App.tsx`: encabezado y la pantalla en `/`.
- `src/components/AltaProveedor.tsx`: el formulario en 4 secciones (Empresa, Contacto, Datos bancarios, Documentos). En escritorio lleva un índice fijo con el estado de cada sección. Hay un solo botón principal: fijo abajo en móvil y al final del formulario en escritorio.
- `src/lib/proveedor.ts`: reglas de validación (RUC y DV panameños, teléfono de 7 u 8 dígitos, correo, cuenta de 6 a 20 dígitos, archivos PDF, JPG o PNG de hasta 5 MB) y el envío simulado. El envío tarda 1,2 s y falla si el navegador está sin conexión.
- Campos: razón social, RUC + DV, categoría, persona de contacto, correo, teléfono, banco, tipo de cuenta, número de cuenta, aviso de operación y certificado bancario. **Se agregaron dos campos que no se pidieron, DV y tipo de cuenta, porque un pago ACH en Panamá los necesita.**
- Validación: cada campo se valida al salir de él y, si ya mostró un error, se revalida mientras se escribe. Al enviar con errores aparece un resumen enfocado (`role="alert"`) con un enlace a cada campo. Los campos llevan `aria-invalid` y `aria-describedby`.
- Estados: editando, enviando (botón deshabilitado con spinner), error de envío (conserva los datos y ofrece «Reintentar envío») y confirmación. La confirmación muestra folio, fecha, resumen con la cuenta enmascarada y el botón «Registrar otro proveedor»; el foco va a su título.

## Qué se verificó (contra `npm run build` + `npm run preview --port 4806`)

1. **`npm run build`** (que incluye `tsc --noEmit`) termina sin errores.
2. **`verificar-interfaz.mjs http://localhost:4806/ --out capturas-interfaz`** sale con **exit 0**: «OK: 1 URL × 3 anchos». La primera corrida dio FALLA, porque los `input type=file` medían 1×1 px con `sr-only`; se pasaron a `hidden` y se repitió.
3. **Recorrido funcional con Playwright** (Chromium headless) a 390, 768 y 1440 px: **54 de 54 casos PASA**. La primera corrida encontró dos defectos reales, ya corregidos:
   - ids duplicados: `contacto` y `banco` estaban a la vez en la sección y en el campo;
   - el foco no llegaba al resumen de errores.

   Casos cubiertos: ids únicos; envío vacío → «Faltan corregir 12 campos»; foco en el resumen; el enlace del resumen enfoca el campo; mensajes de RUC y teléfono inválidos; aviso de duplicado («Ferreteria Istmo, S.A.»); rechazo de un .docx con su motivo; rechazo de un PDF de 6 MB con su motivo; sin errores tras corregir; estado «Enviando…» deshabilitado; envío sin conexión → error que conserva los datos; reintento → confirmación con folio `PRV-AAAA-NNNN`; cuenta enmascarada («terminada en 4567»); foco en la confirmación; sin desborde horizontal; reinicio limpio; consola sin errores.
4. **Revisión visual de capturas** en `capturas-interfaz/`: `inicio-*`, `estado-errores-*`, `estado-completo-*`, `estado-error-envio-*`, `estado-confirmacion-*` e `inicio-movil-viewport.png`. A raíz de esa revisión se hicieron dos correcciones:
   - el contador de secciones quedaba fuera del índice fijo;
   - la fecha salía como «11/13/2026», que es ambigua; ahora sale «13 de noviembre de 2026 a las 12:06 a. m.».

   Nota: en las capturas de página completa a 390 px, la barra de envío fija aparece a media altura; es un artefacto de `fullPage`. La captura `inicio-movil-viewport.png` la muestra en su sitio.

## Qué no se verificó

- La revisión de UX independiente (`ux-designer`), por instrucción del encargo.
- Lectores de pantalla reales (VoiceOver o NVDA): solo se comprobó la semántica ARIA por DOM.
- Arrastrar y soltar con un archivo real del sistema: se probó la selección por `setInputFiles`, no el gesto de drag.
- El servidor de preview se apagó al terminar; el puerto 4806 quedó libre.
