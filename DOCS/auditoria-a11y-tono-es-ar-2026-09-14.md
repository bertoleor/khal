# Auditoría a11y + tono es-AR — KHAL — 2026-09-14

> Perfil 15-a11y. Cierra G8 (a11y keyboard/contraste) + revisión de tono es-AR + verificación G7 (paridad de claves).
> Alcance: `apps/web` y `apps/admin` (Next 15/React 19, Tailwind v4, next-intl). Lectura estática del código real.
> Método: inspección de componentes + cálculo de ratios WCAG 2.x para cada par de color efectivamente usado.
> Todo lo que sigue es VERIFICADO contra el código fuente; *no* es una corrida viva en navegador.

---

## 1. Resumen ejecutivo

- **G7 (paridad i18n):** ✅ SIN drift. `apps/web/messages` 48/48, `apps/admin/messages` 39/39 claves idénticas es/en.
- **G8 keyboard:** estructura sana en general (`<button>` nativos, `aria-pressed` correcto). Hallazgos concretos: falta **skip-link**, falta **`aria-current`** en nav admin, `aria-live` mal ubicado en botón "copiar", day-picker es un scroll horizontal sin rol de tablist.
- **G8 contraste:** **4 hallazgos de contenido con FAIL AA (texto normal)**, de los cuales 2 son texto informativo (precio de servicio, LTV, nombre de servicio oculto, badge no-show).
- **Tono es-AR:** voseo coherente en el 100% de los 48+39 mensajes. Un único defecto duro: `payment.whatsappMessage` abre con `"Hola!"` sin signo de apertura `¡`. Dos observaciones menores (capitalización inconsistente en `book`, `lang="es"` genérico en vez de `es-AR`).

---

## 2. Keyboard (G8)

### ✅ Correcto (no tocar)
| Punto | Dónde | Detalle |
|---|---|---|
| Selectores de día/horario son `<button>` nativos | `slot-picker.tsx` | Tab + Enter/Space funcionan sin JS extra. |
| `aria-pressed` para estado activo | `slot-picker.tsx:42,71` | Semántica de toggle bien aplicada. |
| Etiquetas implícitas | `field.tsx:15` | `<label>` envuelve `<span>{label}</span>` + `<input>` → asociación implícita válida. |
| `<button>` con texto visible en toda acción | booking/admin/exception/payment | Sin iconos mudos. |
| Foco visible declarado | `focus-visible:outline-2` en payment-step, error, not-found | ✅ |
| Select nativo | `exceptions-list.tsx:34` | Accesible por teclado por defecto. |

### ⚠️ Hallazgos (ordenados por impacto)
1. **[Alta] No hay skip-link ("ir al contenido").** Tanto el header web (`header.tsx`) como el nav admin (`admin/layout.tsx`) son sticky. Un usuario de teclado debe Tab por toda la navegación (web: 1 item; admin: 5 links) en *cada* página antes de llegar al `<main>`. Falta un link `href="#main"` al inicio del `<body>` + `id="main"`/`tabIndex={-1}` en `<main>`.
2. **[Media] Nav admin sin `aria-current`.** Los 4 links de `admin/layout.tsx:12-23` no indican la página activa a lectores de pantalla. Agregar `aria-current="page"` al link correspondiente.
3. **[Media] Day-picker es scroll horizontal sin landmarks de tablist.** `slot-picker.tsx:33` (`overflow-x-auto` + buttons) es funcional por Tab, pero no expone rol de lista de pestañas ni navegación con flechas. Aceptable, pero un patrón `role="tablist"` + `aria-controls`/flechas mejoraría la ergonomía. Nota: los días `disabled` (cerrados) salen del orden de Tab (`disabled` nativo) — correcto.
4. **[Baja] `aria-live="polite"` mal ubicado.** En `payment-step.tsx:44`, `aria-live` está en el *botón* "Copiar" en vez de una región `status`/`aria-live` contigua. El anuncio del cambio "Copiar → ¡Copiado!" es frágil. Sugerencia: mover el texto de confirmación a un `<span aria-live="polite">` o usar `role="status"`.
5. **[Baja] "Copiar" no expone estado real.** No hay vínculo semántico entre el clic y el anuncio; no se usa `aria-label`/`aria-describedby` con el valor a copiar (el CBU/alias). El lector ve "Copiar", no "Copiar CBU 0000…". (info de método en `CopyRow`, `payment-step.tsx:21-51`).

### No-a11y pero relacionado (fuera de alcance, se deja nota)
- `apps/web/src/app/error.tsx:33,14` y `not-found.tsx:14` usan `href="/"` hardcodeado, rompiendo el prefijo `[locale]` de next-intl. Redirecciona al locale default, no al locale activo. (Candidato a bug i18n, no de esta auditoría.)

---

## 3. Contraste (G8)

Criterio WCAG 2.x AA: texto normal ≥ 4.5:1; texto grande/bold ≥ 3:1. Ratios calculados para la paleta Tailwind v4 efectiva (valores hex oficiales).

### 🔴 FAIL — texto informativo (corregir)
| Ratio | Par | Dónde | Impacto |
|---|---|---|---|
| **2.56:1** | `slate-400` sobre blanco | `booking-form.tsx:99` — **precio del servicio** al pie del formulario (`text-xs text-slate-400`) | Info de precio ilegible para baja visión. |
| **2.56:1** | `slate-400` sobre blanco | `service-list.tsx:38-40` — **nombre de servicio oculto** (`text-slate-400` cuando `is_visible === false`) | Nombre del servicio oculto ilegible; y además se usa solo color (no texto) para el estado, duplicando info. |
| **2.56:1** | `slate-400` sobre blanco | `client-list.tsx:34` — **etiqueta "LTV"** (`text-xs text-slate-400`) | Etiqueta ilegible. |
| **4.41:1** | `red-600` sobre `red-50` | `client-list.tsx:49` — **badge "No asistió ×N"** (`text-xs text-red-600 bg-red-50`) | Justo por debajo de 4.5; `text-xs` no califica como grande → FAIL AA. |

### 🔴 FAIL — decorativo / gran tamaño (baja prioridad)
| Ratio | Par | Dónde | Nota |
|---|---|---|---|
| **2.56:1** | `slate-400` sobre blanco | `catalog-grid.tsx:25` — inicial del servicio en avatar | Decorativo (el nombre está al lado en `slate-900`); LOW. |
| **1.48:1** | `slate-300` sobre `slate-100` | `servicios/[id]/page.tsx:34` — inicial del servicio en hero | Decorativo; LOW. |
| **1.42:1** | `slate-300` sobre `slate-50` | `slot-picker.tsx:46` — día deshabilitado/cerrado | Control `disabled`: exento de WCAG; OK, solo se documenta. |
| 2.56:1 | `slate-400` sobre blanco | `not-found.tsx:9` "404" | Gran tamaño/decorativo; LOW. |

### ✅ PASS
| Ratio | Par | Nota |
|---|---|---|
| 4.76 | `slate-500` sobre blanco | headings pickDay/pickSlot, precios catálogo, meta. ✅ |
| 4.55 | `slate-500` sobre `slate-50` | empty-state. ✅ |
| 4.83 | `red-600` sobre blanco | mensajes de error. ✅ |
| 4.84 / 6.84 | `amber-700`/`amber-800` sobre `amber-50` | seña pendiente. ✅ |
| 7.29 | `emerald-800` sobre `emerald-50` | seña confirmada. ✅ |
| 7.58 | `slate-600` sobre blanco | nav admin links. ✅ |
| 17.85 | `white` sobre `slate-900` | botones primarios. ✅ |
| 4.10 | `white` sobre `sky-600` | botón "Pagar online" (pasa 3:1 large). ✅ |
| (n/d ≥7) | `white` sobre `emerald-600` | CTA WhatsApp. ✅ |

### Recomendación de corrección (mínima, sin redesign)
- Sustituir `text-slate-400` → `text-slate-600` en los 3 textos informativos (booking-form:99, client-list:34, y para el nombre oculto en service-list usar `text-slate-500` mínimo, o mejor no desvanecer el nombre y añadir un texto "oculto"/"visible" explícito).
- Badge no-show: `text-red-600` → `text-red-700` (o `bg-red-100`) para superar 4.5:1.
- Los decorativos (avatares/hero/"404") pueden quedarse siempre que el texto equivalente exista en otro nodo accesible (hoy sí existe).

---

## 4. Tono es-AR (revisión formal)

Regla base (voseo rioplatense) verificada contra los 87 mensajes (48 web + 39 admin).

### ✅ Coherente
- Imperativos voseantes correctos: "Elegí", "agendá", "Revisá", "Transferí", "enviá", "Completalo", "Comunicate", "Intentá", "Probá", "Subí"/"Subir".
- Consistencia web ↔ admin. No hay mezcla `vos`/`usted` ni residuos de tuteo.
- Errores semánticos en voseo: "Elegí otro", "Comunicate por WhatsApp" ✅.
- Sin inglés hardcodeado en copy es (verificado string por string).
- Signos de apertura: la mayoría correctos — "¿…?" no hay interrogaciones en copy; "¡Copiado!" usa apertura ✅.

### 🔴 Defecto único
- `web/messages/es.json:60` — `payment.whatsappMessage`: `"Hola! Agendé para {service}..."` abre con **"Hola!" sin signo de apertura**. Debe ser **"¡Hola! ..."** (la convención exige apertura `¡`/`¿`).
  - Nota adicional: este texto es el mensaje que se precompone para WhatsApp; el `"Hola!"` suelto suena menos cuidado que el resto del tono. Sugerencia de redacción: `"¡Hola! Agendé {service} para el {date} a las {slot}. Te adjunto el comprobante de pago."`.

### 🟡 Observaciones menores (no bloqueantes)
1. **Capitalización inconsistente.** `web/messages/es.json:6` `"book": "Agendar Cita"` en title-case; el resto del copy es sentence-case ("Elegí el día", "Confirmar turno"). Sugerencia: "Agendar cita".
2. **`lang` genérico, no `es-AR`.** `admin/layout.tsx:15` fija `lang="es"`; `web/[locale]/layout.tsx:25` usa `lang={locale}` → `"es"`, no `"es-AR"`. Para localización rioplatense (y lectores de pantalla con voz regional) conviene `es-AR`. Criterio: la skill de estilo exige `lang="es-AR"`.
3. **`whatsappMessage` sin signos en cadena pre-rellenada** (mismo punto del defecto duro): el resto del copy del mensaje ("Adjunto el comprobante de pago.") está bien.

### G7 (paridad es/en) — verificación extra
- ✅ **Cero drift.** 48/48 (web) y 39/39 (admin) claves es/en idénticas (verificado con script). El test de paridad que pedía el plan de acción ya tiene resultado verde por esta vía (aunque conviene formalizarlo en CI como snapshot).
- 🟡 Nota: `error.*`/`notFound.*` están duplicados en es.json de web *y* de admin (literales idénticos). Mantenimiento manual doble — se mantiene como observación de la auditoría nocturna, no es a11y.

---

## 5. Consolidación de hallazgos

| ID | Tipo | Severidad | Archivo | Acción |
|---|---|---|---|---|
| A1 | Keyboard | Alta | `header.tsx` + `admin/layout.tsx` | Agregar skip-link + `id="main"`. |
| A2 | Keyboard | Media | `admin/layout.tsx` | `aria-current="page"` en nav. |
| A3 | Keyboard | Baja | `payment-step.tsx` | Mover `aria-live` a región status; etiquetar botón copiar con el valor. |
| A4 | Keyboard | Baja | `slot-picker.tsx` | Opcional: tablist + flechas. |
| C1 | Contraste | Alta | `booking-form.tsx:99` | `slate-400` → `slate-600` (precio). |
| C2 | Contraste | Alta | `service-list.tsx:38` | No desvanecer nombre oculto; state con texto, no solo color. |
| C3 | Contraste | Alta | `client-list.tsx:34` | LTV `slate-400` → `slate-600`. |
| C4 | Contraste | Media | `client-list.tsx:49` | badge no-show `red-600`→`red-700`. |
| C5 | Contraste | Baja | catalog/hero/not-found | Decorativo; opcional. |
| T1 | Tono | Alta | `web/messages/es.json:60` | Añadir `¡` de apertura en "Hola!". |
| T2 | Tono | Baja | `web/messages/es.json:6` | "Agendar cita" (sentence-case). |
| T3 | Tono | Baja | `admin/layout.tsx:15`, `web/[locale]/layout.tsx:25` | `lang="es-AR"`. |

---

## 6. Estado

- G8 keyboard: auditado. Estructura sólida; 1 hallazgo alto (skip-link), 3 menores.
- G8 contraste: auditado con ratios calculados. 4 FAIL de texto informativo (3 con ratio 2.56, 1 con 4.41).
- Tono es-AR: revisado. 1 defecto duro (signo de apertura), 2 observaciones menores.
- G7 paridad: verificada limpia (48/48 y 39/39).

Ningún fix aplicado en este turno (la auditoría es de lectura; el plan de acción asigna los fixes de a11y a la fase 3 con gate propio). Los ratios y hallazgos son reproducibles con el script de contraste adjunto al workspace del task.