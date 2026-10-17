# Khal Lash Studio - Full Flow UI Skeletons

## Objective
Implement coherent UI skeletons for all client and admin routes to provide an official presentation of the app flow. Skeletons are a PRESENTATION MODE (`?skeleton=1`) — real content flows are never replaced.

## Branch
main (repo's established pattern; previous khal work committed here)

## Delivery Strategy
ask-on-risk (default)

## Test Runner
vitest run, playwright test

## Specs
S1: Client home page keeps real content; adds ?skeleton=1 presentation variant
S2: Client politicas page keeps real content; adds ?skeleton=1 presentation variant
S3: Client servicio detail page keeps real content; adds ?skeleton=1 presentation variant
S4: Client servicio reservar page keeps real content (BookingForm, slots, payment settings); adds ?skeleton=1 variant
S5: Admin login page keeps real LoginForm; adds ?skeleton=1 variant
S6: Admin dashboard keeps real AppointmentList; adds ?skeleton=1 variant
S7: Admin bloqueos page keeps real ExceptionsList; adds ?skeleton=1 variant
S8: Admin clientes page keeps real ClientList; adds ?skeleton=1 variant
S9: Admin servicios page keeps real ServiceManager (auth-gated); adds ?skeleton=1 variant
S10: Consistent shimmer styling across all skeletons, wired into the CSS both apps actually import
S11 (user, verbatim): "haz los proximos pasos, verifica que todo funcione tanto cliente como admin"

## Tasks
T1: Review existing client routes and components (linked to S1-S4) - DONE
T2: politicas skeleton variant (S2) - DONE (repaired: real content restored + variant)
T3: servicio detail skeleton variant (S3) - DONE (repaired)
T4: servicio reservar skeleton variant (S4) - DONE (repaired)
T5: Review admin routes and components (S5-S9) - DONE
T6: admin login skeleton variant (S5) - DONE (repaired: LoginForm restored)
T7: admin dashboard skeleton variant (S6) - DONE (mechanism fixed)
T8: admin bloqueos skeleton variant (S7) - DONE (mechanism fixed)
T9: admin clientes skeleton variant (S8) - DONE (mechanism fixed)
T10: admin servicios skeleton variant (S9) - DONE (mechanism fixed)
T11: Consistent skeleton styling wired into imported globals (S10) - DONE
T12: Verify responsiveness and coherence - DONE (runtime HTTP battery, both modes)
T13: Update feature document - DONE
T14: Build + lint + tests, no regressions - DONE (builds exit 0, lint clean, 198/198)

## Log
L1: haz todos los skeleton, de todo el flujo del lado cliente y admin, quiero la presentacion oficial y coherente.
L2: Created feature document for full flow skeleton implementation.
L3: Implemented skeleton for politicas page (T2).
L4: Implemented skeleton for servicio detail page (T3).
L5: Implemented skeleton for servicio reservar page (T4).
L6: Implemented skeleton for admin login page (T5).
L7: "si, continua implementando pero despues dame el html presentando todos los skelentons" — user approved continuing + HTML presentation deliverable.
L8: "haz los proximos pasos, verifica que todo funcione tanto cliente como admin" — user required full verification.
L9 (repair): Verification found the first skeleton pass had DESTROYED real content — politicas, servicio detail, reservar and admin login rendered skeletons permanently (booking form, policy text, LoginForm gone), with antipatterns (`{true ? ... : null}`, `key={Math.random()}`). The 4 admin pages used `typeof window !== 'undefined' && document.documentElement.classList.contains('skeleton-mode')` — DEAD CODE in async server components (window never exists server-side; the branch could never render).
L10 (repair): Restored all real content from git HEAD (politicas i18n sections, service detail with getService/notFound/deposit, reservar with BookingForm + computed slots + payment settings, admin LoginForm with Supabase OTP). Rebuilt every skeleton as a `?skeleton=1` searchParams variant — server-safe, demoable by adding the query param to any URL.
L11 (repair): Skeleton CSS lived in an orphaned file (`apps/web/src/globals.css` — never imported; layout imports `src/app/globals.css`). Moved the shimmer sweep (`::after` translateX animation) into the imported globals of BOTH apps. Admin skeletons use light slate palette for the light admin theme.
L12 (repair): Fixed 2 broken tests found during verification: (1) CopyRow in payment-step had LOST its blank-value guard (`if (value.length === 0) return null`) — the KHAL-A1 anti-empty-CVU defense; restored it. (2) a11y header test rendered the new nav-bearing Header (uses next-intl Link) without intl context; wrapped in NextIntlClientProvider.
L13 (evidence): Builds pass (web + admin, exit 0, all routes compile). Lint clean (--max-warnings 0). Tests 198/198 (baseline was 176). Runtime HTTP battery on production servers (ports 3100/3101): web real mode renders real content (marker "Nuestros servicios"=2, "Seña"=2, empty-catalog fail-soft state without local DB), web skeleton mode renders 20-38 shimmer blocks per page, admin login real renders LoginForm subtitle, admin login skeleton renders 6 shimmers, /admin/* correctly 302-redirects to /login (middleware auth gate intact — admin skeletons render behind login).
L14 (deliverable): Complete standalone HTML presentation at E:/Hermes/skeleton-presentation.html — 9 sections (4 client + 5 admin), phone-framed, self-contained shimmer CSS. Earlier truncated version preserved in scratch.

## Presentation
The skeletons provide a coherent wireframe of both flows, and they are LIVE in the real site: add `?skeleton=1` to any URL.
1. **Client Flow**: Home → Politicas → Servicio Detail → Reservar
2. **Admin Flow**: Login → Dashboard → Bloqueos → Clientes → Servicios (behind auth middleware)

Standalone HTML: E:/Hermes/skeleton-presentation.html

## Technical Implementation
- `?skeleton=1` searchParams variant per page (server-component-safe; checked BEFORE data fetches so skeletons render without DB)
- Shimmer: `.skeleton-shimmer` sets `display:block; position:relative; overflow:hidden` and animates a `::after` gradient sweep (translateX -100% → 100%, 1.4s loop); colors come from Tailwind bg-* utilities (zinc dark theme web / slate light theme admin)
- Wired into `apps/web/src/app/globals.css` and `apps/admin/src/app/globals.css` (the files the layouts import); the orphaned `apps/web/src/globals.css` was moved to scratch
- Real content branches untouched in behavior: same components, same data fetching, same auth gates