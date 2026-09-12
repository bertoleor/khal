---
name: khal-next-intl
description: >
  Use when editing i18n in khal (apps/web or apps/admin). next-intl with `es`
  default + `en`, routing + navigation + request files, middleware matcher, and
  per-app version difference (web = next-intl 3, admin = 4) — plus message message
  patterns for `t(...)` and `{withValues}` interpolation.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal next-intl

Two apps, both internationalized with next-intl, **different versions** —
do not blindly copy API between them:

- `apps/web` — next-intl **3.26**: has `i18n/navigation.ts` exporting
  `{ Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)`.
- `apps/admin` — next-intl **4.14**: only `i18n/routing.ts` +
  `createMiddleware(routing)`; there's no navigation helper (upgrade or add
  deliberately if needed).

## Canonical setup (web; admin same but without navigation.ts)

```ts
// i18n/routing.ts
export const routing = defineRouting({ locales: ["es", "en"], defaultLocale: "es" });

// i18n/navigation.ts
export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);

// i18n/request.ts
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale =
    requested && routing.locales.includes(requested as (typeof routing.locales)[number])
      ? requested
      : routing.defaultLocale;
  return { locale, messages: (await import(`../../messages/${locale}.json`)).default };
});

// middleware.ts
export default createMiddleware(routing);
export const config = { matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)" };
```

## Anchors

- Locale/currency defaults: default locale **`es`**, messages in
  `apps/{app}/messages/{es,en}.json`. Web is mounted at root `/` + `/[locale]`
  (NextIntlClientProvider in the locale layout), so public URLS are `/...`,
  `/en/...`.
- Intl-as-formatter for **dates/currency** is already pattern-coded: e.g. date
  labels use `new Intl.DateTimeFormat(locale, {...})`, money via `formatCents`
  (`@khal/utils`, default locale `es-AR`).
- **Fallback policy**: unknown locale → `routing.defaultLocale` (`es`), and the
  `[locale]` layout `notFound()`s on a locale outside `routing.locales`.

## Strings discipline (MUST)

- 🚫 never a hardcoded UI string in a component — use `useTranslations`/`getTranslations`.
- Namespaces mirror the file/function section (examples in use):
  `catalog.title`, `booking.pickDay/pickSlot/noSlots/closed`, `booking.confirm`,
  `booking.submitting`, `booking.pendingTitle`, `booking.error.{invalid,duplicate,blacklisted}`,
  `payment.amountDue`, `payment.sendComprobante`, admin `Admin.nav.*`, etc.
- Message parameters use `t("key", { name })` with the same key name in JSON:
  e.g. `"remainderAtStore": "Resto {amount} en el local"`. Keep the JSON key name
  exactly aligned with the value’s placeholder name.
- 🚫 never mix literal raw text with one of these error codes; build the
  translation key from the domain code (`booking.error.{code}`) — the current
  code does `t(errorKeyFor(code))` where the mapping is a small switch, keep it.

## Locale-aware navigation

🚫 never `next/link` for internal routes — import `Link` from `@/i18n/navigation`
(web) so the locale stays attached. Locale-sensitive values must be formatted
with the active `locale` (as the existing reservar page does), not a fixed
`es-AR` unless business policy is explicitly locale-locked.