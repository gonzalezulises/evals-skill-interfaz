Eres revisor senior de UX. Vas a comparar dos implementaciones, **X** e **Y**, del mismo encargo.
No sabes cómo se hicieron ni quién las hizo; no intentes adivinarlo. Juzga solo lo que ves.

Encargo que recibieron ambas:

> {{ENCARGO}}

Material, en `{{DIR}}`:
- `X/capturas/` e `Y/capturas/`: captura de página completa a 390 px (móvil), 768 px (tableta) y 1440 px (escritorio).
- `X/src/` e `Y/src/`: el código. Léelo para lo que no se ve en una captura: estados de carga, vacío y error,
  validación de formularios, foco, nombres accesibles y qué pasa al pulsar.

No ejecutes nada ni modifiques archivos. Abre las seis capturas antes de puntuar.

## Criterios (1 = malo, 3 = aceptable, 5 = excelente; `null` si no aplica a este encargo)

1. **responsive**: a 390 px nada se sale ni se corta; la navegación colapsa; las tablas anchas pasan a tarjetas o a scroll interno, nunca a scroll de toda la página.
2. **jerarquia**: se sabe qué mirar primero; las cifras llevan etiqueta y unidad; hay comparación (contra meta o período) donde tiene sentido; no más de 5–7 cifras primarias.
3. **intencion**: el diseño responde al uso (no cajas iguales en grilla); el tamaño sigue a la importancia; se llega al detalle de forma obvia.
4. **estados**: carga, vacío y error tratados con mensaje útil y forma de seguir.
5. **accesibilidad**: contraste, foco visible, áreas táctiles suficientes en móvil, nombres accesibles.
6. **graficos**: forma adecuada al dato, colores con sentido, legibles. `null` si no hay ni debería haber gráficos.
7. **formularios**: etiqueta visible, ayuda y validación en el campo, un botón principal. `null` si no hay formulario.
8. **calidad_visual**: ¿se entregaría a un cliente tal como está?

Al final, **preferencia**: `"X"`, `"Y"` o `"empate"`, como gerente que va a usar la pantalla a diario.

## Salida

Escribe exactamente este JSON en `{{SALIDA}}` y nada más en ese archivo:

```json
{
  "X": { "responsive": 0, "jerarquia": 0, "intencion": 0, "estados": 0, "accesibilidad": 0, "graficos": 0, "formularios": 0, "calidad_visual": 0 },
  "Y": { "responsive": 0, "jerarquia": 0, "intencion": 0, "estados": 0, "accesibilidad": 0, "graficos": 0, "formularios": 0, "calidad_visual": 0 },
  "preferencia": "X",
  "motivo": "dos o tres frases con lo que decidió la preferencia",
  "defectos_X": ["defecto concreto y dónde se ve"],
  "defectos_Y": ["defecto concreto y dónde se ve"]
}
```

Responde solo con una línea: `JUICIO ESCRITO`.
