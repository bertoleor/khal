# Security Specification

## Purpose

Secure the admin app authentication flow, cookie handling, and Server Action access control. All auth stays mock-based (Supabase not connected) but must be structurally ready for JWT verification.

## Requirements

### Requirement: Cookie Security Flags

ALL authentication cookies SHALL be set with `httpOnly: true`, `secure: true` (in production), `sameSite: 'lax'`, and a `maxAge` of 24 hours minimum.

#### Scenario: Cookie set with all flags

- GIVEN a user logs in via the admin login page
- WHEN the server sets the `khal_role` cookie
- THEN the cookie includes `httpOnly`, `secure`, `sameSite: 'lax'`, and `maxAge`
- AND the cookie value is NOT readable from `document.cookie` in the browser

#### Scenario: Cookie set in development without secure

- GIVEN the app runs in development mode (`NODE_ENV !== 'production'`)
- WHEN the server sets the `khal_role` cookie
- THEN the cookie is set with `httpOnly: true`, `sameSite: 'lax'`, `maxAge` set
- AND `secure` is `false` to allow localhost HTTP

### Requirement: Auth Guards on Server Actions

ALL admin Server Actions SHALL verify a valid session/authentication before executing. No Server Action SHALL be callable without authentication.

#### Scenario: Authenticated user calls Server Action

- GIVEN a user has a valid session cookie
- WHEN the user calls an admin Server Action (e.g., update appointment status)
- THEN the action executes normally
- AND the response returns the expected result

#### Scenario: Unauthenticated user calls Server Action

- GIVEN no session cookie exists or the cookie is invalid
- WHEN a request calls an admin Server Action
- THEN the action returns a 401/403 error
- AND the action does NOT execute any business logic

#### Scenario: Server Action with spoofed cookie

- GIVEN a user sets `khal_role=admin` manually in DevTools
- WHEN the user calls an admin Server Action
- THEN the action rejects the request (cookie not verified against server-side state)
- AND the response returns an authentication error

### Requirement: Auth Verification Structure

The auth verification layer SHALL use a centralized `requireAuth()` helper that Server Actions call before executing business logic. This helper SHALL be mock-based now and MUST accept JWT verification when Supabase connects.

#### Scenario: Server Action uses requireAuth

- GIVEN an admin Server Action needs to verify authentication
- WHEN the action is invoked
- THEN it calls `requireAuth()` before any business logic
- AND if `requireAuth()` throws, the action returns an error response

#### Scenario: requireAuth returns structured user context

- GIVEN a valid session exists
- WHEN `requireAuth()` is called
- THEN it returns a user context object (role, user ID placeholder)
- AND the Server Action can use this context for authorization decisions

### Requirement: Zod Validation on Server Actions

ALL admin Server Action inputs SHALL be validated with Zod schemas before processing. Unsafe type assertions (`as Type`) MUST NOT be used as a substitute for runtime validation.

#### Scenario: Valid input passes Zod validation

- GIVEN an admin Server Action accepts appointment data
- WHEN the action receives a valid payload matching the Zod schema
- THEN the action processes the request normally

#### Scenario: Invalid input fails Zod validation

- GIVEN an admin Server Action accepts appointment data
- WHEN the action receives a payload that fails Zod validation (missing fields, wrong types)
- THEN the action returns a structured validation error
- AND the action does NOT process the invalid data

#### Scenario: Type assertion replaced by Zod

- GIVEN an admin Server Action previously used `as AppointmentStatus` to cast input
- WHEN the action is refactored
- THEN the type assertion is removed
- AND a Zod schema validates and infers the correct type instead
