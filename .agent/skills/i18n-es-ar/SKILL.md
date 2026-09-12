---
name: i18n-es-ar
description: >
  Rioplatense Spanish (es-AR) UI copy and formatting for PAEONIA.
  Trigger: When writing Spanish UI copy, voseo text, or es-AR date/number formatting.
license: Apache-2.0
metadata:
  author: gentleman-programming
  version: "1.0"
---

## Scope

This skill covers UI copy only: labels, buttons, empty states, errors, dates, numbers, currency.

Astrological interpretation voice (tone, literary style, tiers) belongs to `paeonia-astro-voice`. Do NOT mix the two: this skill decides HOW the interface speaks, never WHAT the stars say.

## Voseo Decision Tree

```
Writing UI copy?          → voseo imperatives (calculá, descubrí, elegí)
Writing interpretations?  → STOP, use paeonia-astro-voice (usted)
Unsure tuteo vs voseo?    → voseo ALWAYS wins in UI
```

## Voseo Imperatives (REQUIRED)

```typescript
// ✅ ALWAYS: voseo imperatives in UI copy
"Calculá tu carta natal";
"Descubrí tus tránsitos";
"Elegí tu plan";
"Subí tu comprobante";

// ❌ NEVER: tuteo forms
"Calcula tu carta natal"; // NO
"Descubre tus tránsitos"; // NO
"Sube tu comprobante"; // NO
```

Common pairs: calculá/calcula, descubrí/descubre, elegí/elige, subí/sube, mirá/mira, tocá/toca, empezá/empieza, guardá/guarda.

## Locale Formatting (REQUIRED)

```typescript
// ✅ ALWAYS: explicit es-AR locale, never bare toString()
const dateFmt = new Intl.DateTimeFormat("es-AR", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
dateFmt.format(new Date()); // "8 de septiembre de 2026"

const numberFmt = new Intl.NumberFormat("es-AR");
numberFmt.format(1234567.89); // "1.234.567,89"

const arsFmt = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
});
arsFmt.format(1999.99); // "$1.999,99"

// ❌ NEVER: locale-less formatting (renders en-US order/separators)
new Date().toLocaleDateString(); // NO — environment-dependent
`Total: $${amount}`; // NO — wrong separators, no ARS rules
```

## html lang Attribute (REQUIRED)

```tsx
// ✅ ALWAYS: es-AR on the root layout
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="es-AR">{children}</html>;
}

// ❌ NEVER: lang="en" or a missing lang attribute
```

## No Hardcoded English UI Strings (REQUIRED)

```tsx
// ❌ NEVER: English strings in rendered UI
<button>Submit</button>; // NO
<p>Loading...</p>; // NO
<span>Payment failed</span>; // NO

// ✅ ALWAYS: Spanish copy (or a copy constant for reuse)
<button>Confirmar</button>;
<p>Cargando...</p>;
<span>El pago no se pudo procesar. Intentá de nuevo.</span>;
```

Error copy stays in voseo too: "Revisá los datos e intentá de nuevo", "Tu sesión expiró. Iniciá sesión otra vez."

## Copy Conventions

- Use opening marks: ¿ and ¡ are mandatory ("¿Ya tenés cuenta?", "¡Tu carta está lista!").
- Currency: ARS with es-AR separators ("$1.999,99"); never "ARS 1999.99".
- Dates: day-first ("8/9/2026", "8 de septiembre de 2026"); never month-first.
- Prefer `type` over `interface` for copy dictionaries, zero `any`.

```typescript
// ✅ Copy dictionaries keep UI strings out of JSX
const COPY = {
  CTA_CALCULATE: "Calculá tu carta natal",
  ERROR_RETRY: "Algo salió mal. Intentá de nuevo.",
} as const;

type CopyKey = (typeof COPY)[keyof typeof COPY];
```

## Keywords

i18n, es-AR, voseo, rioplatense, spanish copy, Intl, formatting, locale, ARS
