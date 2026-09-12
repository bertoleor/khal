---
name: khal-admin
description: >
  Use when editing apps/admin or admin-facing backoffice code. Uses the provisional
  cookie role check (CQ-04 → Supabase JWT custom claims ADMIN-04), middleware auth
  for /admin, typed Server Actions requiring auth + revalidatePath, and the
  transition guard.
metadata:
  author: khal
  version: "0.1.0"
---

# Khal admin

`apps/admin` is Next App Router backoffice with the public routes `/admin`,
`/admin/clientes`, `/admin/servicios`, `/admin/bloqueos`, gated by middleware to
`/admin/:path*`. Data through Server Actions + `revalidatePath`, with mocks as
CQ-04 provisional stores that mirror the Supabase contract.

## Auth — admin role goes through a single function (MUST)

```ts
// apps/admin/src/lib/auth.ts
export type Role = "admin" | "anon";
export function getRole(request: NextRequest): Role {            // middleware
  return cookie.get("khal_role")?.value === "admin" ? "admin" : "anon";
}
export async function requireAuth(): Promise<AuthResult> {
  const role = extractRole(await cookies()); // "khal_role" === "admin"
  if (role !== "admin") return { ok: false, error: "Unauthorized: admin role required" };
  return { ok: true, ctx: { role: "admin", userId: "mock-admin" } };
}
```
- Two variants for a reason: middleware reads from `NextRequest.cookies` (Edge),
  Server Actions read via `await cookies()` from `next/headers`.
- 🚫 never implement a third auth check inline; this is the **single swap point**
  for the future Supabase JWT (`auth.jwt()->'app_metadata'->>'role'` ADMIN-04).
- Middleware: `export function middleware(request) { if (getRole(request) !== "admin")
  return NextResponse.redirect(new URL("/login", request.url));
  return handleI18nRouting(request); }` with `config = { matcher: ["/admin/:path*"] }`.
- Client code asserts the role through the Server Action's `requireAuth` result
  (never the cookie directly).

## Server Actions — every mutating action MUST

1. Start with `"use server";`.
2. Call `const auth = await requireAuth();` first; return `{ error: auth.error }`
   when not ok.
3. Validate user input with **@khal/validations** (`safeParse`, no throws).
4. Mutate through the mock store (mock = CQ-04; the class is the adapter).
5. Call `revalidatePath(route)` to re-render the page.

Reference shape: `apps/admin/src/lib/actions/appointments.ts` transitionAppointment,
`clients.ts` toggleBlacklisted, `services.ts` bulkIncrease + toggleVisibility,
`exceptions.ts` addException. Stick with the existing error return contract
`{ error?: string }`, and map invalid-status to a plain string error.

## Domain lock (MUST NOT)

- 🚫 never bypass the appointment state machine: transitions run through
  `canTransitionAppointment` (via `appointmentStatusSchema` + the store), never
  direct status mutation. Valid transitions only:
  `pendiente → {confirmado, cancelado, no_asistio}`,
  `confirmado → {cancelado, no_asistio}`, terminals have no outgoing.
- 🚫 never set client's `is_blacklisted` from booking flow; it's manual toggle only.
- Money: `bulkIncrease` uses `increaseCentsByBp(price_cents, 1000)` (= 10%).
  Use the `@khal/utils` integer money helpers for any new admin mutation.

## Pages/i18n

Pages read from `messages/*.json` under a single `Admin` namespace (`Admin.Nav`,
`Admin.appointments/services/clients/exceptions`, `Admin.error`, `Admin.login`,
`Admin.notFound`). Validate the nav keys if you add a page — the boundary lives
in `apps/admin/src/app/admin/layout.tsx`.

## Mocks (CQ-04)

`apps/admin/src/lib/mocks/*` are classes (`appointmentsStore`, `clientsStore`,
`exceptionsStore`, `servicesStore`) — keep mutation semantics there, not in the
Server Action. The stores are the seam for Supabase integration later.