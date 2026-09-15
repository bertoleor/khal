# Time Format es-AR Specification

## Purpose

Definir el formateo de hora 24h a es-AR y su uso en mensajes con voseo. Sin dependencias de locale runtime.

## Requirements

### Requirement: Formateo HH:mm → es-AR

The system MUST formatear una hora válida `HH:mm` (24h) como `"H:MM h"` con sufijo fijo.

#### Scenario: Hora válida de tarde

- GIVEN la entrada `"19:30"`
- WHEN se llama `formatTimeEsAR("19:30")`
- THEN retorna `"19:30 h"`

#### Scenario: Medianoche y borde

- GIVEN las entradas `"00:00"` y `"23:59"`
- WHEN se formatean
- THEN retornan `"0:00 h"` y `"23:59 h"` respectivamente

#### Scenario: Entrada inválida

- GIVEN una entrada no-24h (`"7:30 PM"`, `"25:00"`, `"ab:cd"`, `""`)
- WHEN se llama `formatTimeEsAR`
- THEN lanza `RangeError` con mensaje que incluye el valor recibido

### Requirement: Mensajes con voseo

The system MUST exponer mensajes que usan la hora formateada con voseo rioplatense (ej: "tenés", nunca "tienes").

#### Scenario: Mensaje de turno

- GIVEN la hora `"19:30"`
- WHEN se compone el mensaje de turno
- THEN contiene `"Tenés turno a las 19:30 h"`

### Requirement: Función pura sin locale runtime

The system MUST implementar `formatTimeEsAR` como función pura, sin leer `Intl`, `next-intl` ni timezone del entorno.

#### Scenario: Determinismo

- GIVEN cualquier timezone del runner
- WHEN se llama `formatTimeEsAR("09:05")`
- THEN siempre retorna `"9:05 h"`
