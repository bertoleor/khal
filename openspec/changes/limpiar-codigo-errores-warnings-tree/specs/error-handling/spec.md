# Error Handling Specification

## Purpose

Add proper error boundaries and not-found pages to both the web and admin apps, ensuring users see meaningful error messages instead of blank screens or default Next.js errors.

## Requirements

### Requirement: error.tsx Boundary in Both Apps

Each app (web and admin) SHALL have an `error.tsx` file at the app root that catches unhandled runtime errors and renders a user-friendly error page.

#### Scenario: Runtime error caught by error boundary

- GIVEN a page component throws an unhandled error during render
- WHEN the error is caught by the boundary
- THEN the user sees a styled error page with a message
- AND the page includes a "Try Again" or "Go Home" recovery action

#### Scenario: Error boundary does not leak stack traces

- GIVEN an error is caught by the boundary
- WHEN the error page renders
- THEN NO stack trace or technical error details are shown to the user
- AND the error details are logged to the console or error reporting service

#### Scenario: error.tsx handles both server and client errors

- GIVEN a Next.js App Router app with `error.tsx`
- WHEN a server-side error occurs
- THEN the boundary catches it and renders the error UI
- WHEN a client-side error occurs
- THEN the boundary catches it and renders the error UI

### Requirement: not-found.tsx Page in Both Apps

Each app (web and admin) SHALL have a `not-found.tsx` file that renders when a user navigates to a non-existent route.

#### Scenario: User navigates to invalid route

- GIVEN the web or admin app is running
- WHEN the user navigates to a URL that matches no defined route
- THEN the `not-found.tsx` page renders
- AND the page displays a friendly "Page Not Found" message
- AND the page includes a link back to the home page or dashboard

#### Scenario: not-found page matches app design system

- GIVEN the `not-found.tsx` page renders
- WHEN the user views the page
- THEN it uses the project's Tailwind CSS styling and Shadcn components
- AND it is visually consistent with other app pages

### Requirement: Server Action Error Responses

ALL admin Server Actions SHALL return structured error responses instead of throwing raw errors. Error responses SHALL include a `success: false` field and an `error` message.

#### Scenario: Server Action returns structured error

- GIVEN an admin Server Action encounters a business logic error
- WHEN the action returns the error
- THEN the response has `{ success: false, error: "message" }`
- AND the calling component can check `success` to handle the error

#### Scenario: Server Action returns validation error

- GIVEN an admin Server Action receives invalid input
- WHEN Zod validation fails
- THEN the response has `{ success: false, error: "Validation failed", details: [...] }`
- AND the `details` array contains field-level error messages

#### Scenario: Server Action throws unexpected error

- GIVEN an admin Server Action encounters an unexpected error (e.g., DB connection)
- WHEN the error is caught by the action's try/catch
- THEN the action returns `{ success: false, error: "Internal error" }`
- AND the original error is logged server-side
- AND NO raw error message leaks to the client
