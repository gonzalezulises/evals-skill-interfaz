# Proceso: página de inscripción al taller

## Fuentes y herramientas consultadas

- **Estándar del equipo:** `~/.agents/skills/estandar-interfaz/SKILL.md` (flujo y checklist de UX).
- **Design system:** no hay. El `README.md` del proyecto dice «Andes Logística no tiene design system propio».
  Definí tokens propios en `src/index.css` (`@theme`: verde `#0f5c4c` sobre `#f7f8f6`, acento de foco `#b4540a`).
- **21st.dev (MCP `mcp__plugin_21st_21st__*`):**
  - `get_inspiration` «event workshop registration landing page…» (feedbackId `6c4f6455-a908-4b8f-8e62-5455f02cddaf`).
    Referencias de estructura: Event Countdown Card (id 2582, https://21st.dev/@isaiahbjork/components/event-countdown-card,
    para la tarjeta de datos y el cupo) y Waitlist Early Access (id 44326, para el bloque de inscripción en dos columnas).
  - `get_component` **28298** Timeline (slide-cn, https://21st.dev/@slide-cn/components/timeline): la agenda usa su variante
    vertical alineada a la izquierda (marcador + línea + etiqueta).
  - `get_component` **25085** Multi-Field Form (cnippet-dev, https://21st.dev/@cnippet-dev/components/v-field-17): estructura
    del formulario (etiqueta visible, ayuda, error en el campo, botón con estado de carga).
  - `search` «faq accordion»: Accordion id **31351** (wensity, https://21st.dev/@wensity/components/accordion) como patrón de
    las preguntas frecuentes.
  - Los tres patrones se reimplementaron con elementos nativos (`<ol>`, `<input>`, `<details>`) y los tokens propios,
    sin sumar Radix ni react-hook-form (el proyecto no los tiene).

## Qué se construyó

- `src/App.tsx`: encabezado fijo con anclas (en móvil queda solo el botón «Inscribirme»), portada con fechas, horario,
  sede y lugares disponibles (7 de 24, calculado de `cupo - inscritos`), «De qué trata», agenda de los dos días,
  facilitadora, precio (individual USD 690 / grupo USD 590 por persona), preguntas frecuentes y enlace de salto al formulario.
- `src/components/Inscripcion.tsx`: formulario con nombre, correo, empresa, teléfono opcional y número de personas;
  validación al salir de cada campo y al enviar (el foco va al primer error); total calculado en vivo (desde 2 personas
  aplica tarifa de grupo); tope en los lugares disponibles; estados enviando / enviado / error y estado de cupo completo.
- Todo el contenido sale de `src/data/taller.json`.

## Supuestos (para validar con el cliente)

- **No hay backend:** el envío se simula (900 ms) y muestra la confirmación. Hay que conectar el endpoint real en
  `enviar()` de `Inscripcion.tsx`; hasta entonces ninguna inscripción se guarda.
- «Grupo» = 2 o más personas inscritas juntas (el JSON no define el mínimo).
- Los cuatro puntos de «De qué trata» se redactaron a partir de los bloques de la agenda; el JSON no trae descripción.

## Qué se verificó

- `npm run build` (tsc + vite): sin errores.
- `verificar-interfaz.mjs http://localhost:4812/ --out capturas-interfaz` → **OK, salida 0** a 390, 768 y 1440 px
  (sin scroll horizontal, sin errores de consola, áreas táctiles ≥ 44 px, nombres accesibles, texto ≥ 12 px).
  La primera corrida falló (el enlace de salto `sr-only` medía 1×1 px); se corrigió y volvió a pasar.
- Capturas revisadas a ojo: `capturas-interfaz/inicio-movil.png`, `inicio-tableta.png`, `inicio-escritorio.png`,
  más `foco-salto.png`.
- Prueba funcional en navegador a 390 px (`pruebas/formulario.mjs`), 10/10 PASA: errores al enviar vacío, foco al primer
  error, correo inválido, total de grupo (3 × 590 = 1 770), tope de 7 lugares, estado «Enviando…», confirmación,
  apertura de la FAQ, cero errores de consola y enlace de salto visible al enfocar.
- No aplicaron (según el encargo): PR, merge ni revisión por otro agente. Por eso no hay revisión de UX independiente.
- Servidor de vista previa apagado al terminar.
