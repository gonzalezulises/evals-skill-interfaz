# Proceso: formulario de alta de proveedor

## Archivos

- `src/App.tsx`: encabezado de la app y la página.
- `src/components/AltaProveedor.tsx`: el formulario en tres pasos (llenar, revisar y confirmar, enviado).
- `src/components/Campo.tsx`: campo de texto y select con etiqueta, ayuda y error accesibles.
- `src/components/CampoArchivo.tsx`: adjunto con zona de arrastre y validación de tipo y tamaño.
- `src/lib/proveedor.ts`: catálogos (categorías, bancos de Panamá), validaciones y el envío simulado (~1,4 s, devuelve un número de solicitud `PRV-AAAA-NNNNN`).
- `src/index.css`: tokens de color propios en `@theme`, porque Andes Logística no tiene design system (según el README).
- `index.html`: favicon en línea (sin él, el preview daba un 404 de `/favicon.ico` en la consola).

## Herramientas y fuentes de diseño consultadas

- **21st.dev (MCP `mcp__plugin_21st_21st__search`)**, consulta «multi-section onboarding form with file upload dropzone and validation». Candidatos: File Upload Multi-File Dropzone (id 18111), Multi-Field Form (id 25085), File Dropzone de joyco (id 19201), File Upload de uvain (id 27137).
- **21st.dev `get_component` id 19201**, «File Dropzone» de joyco (https://21st.dev/@joyco/components/file-dropzone). Lo reimplementé en `CampoArchivo.tsx` sin Radix ni shadcn: zona punteada, validación de tipo y tamaño, tarjeta del archivo con botón para quitarlo. El origen queda anotado en un comentario del archivo.
- No usé el tool Skill ni leí `~/.agents` ni `~/.claude`, como pedía el encargo.
- Supuesto de dominio: el **aviso de operación** es un documento panameño (MICI), así que tomé Panamá como contexto. El RUC va con guiones y DV aparte, el teléfono es un celular de 8 dígitos (empieza con 6) o un fijo de 7, con +507 opcional, y la lista de bancos es de bancos panameños. Si el proveedor fuera de otro país (por ejemplo, el RUC peruano de 11 dígitos), solo hay que cambiar `validarCampo` y `BANCOS`.

## Comportamiento

- Valida cada campo al salir de él y, cuando ya muestra un error, vuelve a validar mientras se corrige.
- Al enviar con errores aparece un resumen arriba (`role="alert"`, recibe el foco) con un enlace por campo que lleva el foco a ese campo; en los adjuntos, al botón de elegir archivo.
- Cada campo tiene `aria-invalid` y `aria-describedby` apuntando a su ayuda y a su error, el asterisco de obligatorio y `autocomplete`/`inputmode` según el dato.
- Adjuntos: PDF, JPG o PNG de hasta 5 MB, rechaza archivos vacíos, se pueden arrastrar o elegir, cambiar y quitar.
- Con todo válido pasa a «Revisa antes de enviar», donde se puede volver a «Corregir datos» sin perder nada, incluidos los archivos. «Confirmar y enviar» se deshabilita y muestra «Enviando…». Hay una rama de error de envío con un mensaje que conserva los datos, pero el envío simulado nunca falla, así que esa rama no se ejercitó.
- Pantalla final con la razón social, el correo y el número de solicitud, y un botón «Registrar otro proveedor» que limpia el formulario.

## Qué verifiqué (build + preview en :4807, Chrome for Testing headless con Playwright)

- `npm run build` (tsc + vite) en verde después de cada cambio.
- Flujo real en el navegador a 390 px:
  - el envío vacío muestra 11 errores y el foco va al resumen;
  - el enlace «Correo electrónico» lleva el foco a `#correo` y el de «Certificado bancario» a `#certificadoBancario-accion`;
  - RUC `123`, correo `foo@bar`, teléfono `12345` y cuenta `12ab` muestran cada uno su mensaje;
  - un `.txt` da «Solo se aceptan archivos PDF, JPG o PNG.» y un PDF de 6 MB da «El archivo pesa más de 5 MB.»;
  - con datos válidos quedan 0 `aria-invalid="true"`;
  - la revisión recibe el foco en su título y «Corregir» conserva los datos y los archivos;
  - el botón de envío está deshabilitado mientras envía, llega la pantalla «Solicitud enviada» con el número y «Registrar otro» vacía el formulario.
- El flujo completo (errores → lleno → revisión → enviado) corrió a **390, 768 y 1440 px**: `scrollWidth == innerWidth` en todos, sin scroll horizontal. Corregí un desborde de 18 px a 390 con nombres de archivo largos (`min-w-0` en los hijos del grid).
- Teclado: el orden de tabulación sigue el visual (campos → botones de adjunto → enviar). Quité la parada doble del input de archivo oculto.
- Consola: 0 errores en la última corrida (antes había un 404 del favicon, ya resuelto).
- Capturas en `capturas/`, de 390, 768 y 1440: `-inicial`, `-errores`, `-lleno`, `-revision` y `-enviado`.

## Lo que queda abierto

- El último cambio fue solo de texto: los placeholders ahora empiezan con «Ej.:» para que no se confundan con valores ya escritos. Lo compilé, pero las capturas son de justo antes de ese cambio.
- No hubo una revisión de UX independiente (otra persona u otro agente).
- No probé con un lector de pantalla real, solo atributos ARIA y el orden del foco.
- No hay modo oscuro.
- Servidor de preview apagado y navegador cerrado.
