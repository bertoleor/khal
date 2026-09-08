# i18n Specification

## Purpose

Add internationalization support to the admin app using `next-intl`, covering both server-side and client-side strings. All hardcoded Spanish UI strings SHALL be extracted to translation files.

## Requirements

### Requirement: next-intl Setup in Admin App

The admin app SHALL configure `next-intl` with a default locale of `es` (Spanish). The setup MUST support both Server Components and Client Components.

#### Scenario: next-intl provider wraps admin app

- GIVEN the admin app renders any page
- WHEN the page loads
- THEN the `NextIntlClientProvider` wraps the component tree
- AND the default locale is `es`

#### Scenario: Translation files exist for admin

- GIVEN the admin app is configured with next-intl
- WHEN the project builds
- THEN translation JSON files exist at `apps/admin/messages/es.json`
- AND the file structure supports future locale additions (e.g., `en.json`)

### Requirement: Server-Side String Extraction

ALL hardcoded Spanish strings in admin Server Components and Server Actions SHALL be replaced with `useTranslations()` or `getTranslations()` calls.

#### Scenario: Server Component uses translated strings

- GIVEN an admin Server Component renders UI text
- WHEN the component is refactored for i18n
- THEN all user-visible strings use `getTranslations()` or `t()` from next-intl
- AND NO hardcoded Spanish strings remain in the JSX

#### Scenario: Server Action error messages are translatable

- GIVEN an admin Server Action returns error messages
- WHEN the action is refactored for i18n
- THEN error messages use translation keys
- AND the caller receives the translated string or a key that the client can translate

### Requirement: Client-Side String Extraction

ALL hardcoded Spanish strings in admin Client Components SHALL be replaced with `useTranslations()` hook calls.

#### Scenario: Client Component uses translated strings

- GIVEN an admin Client Component renders UI text (labels, buttons, messages)
- WHEN the component is refactored for i18n
- THEN all user-visible strings use `useTranslations()` hook
- AND NO hardcoded Spanish strings remain

#### Scenario: Dynamic strings from translation keys

- GIVEN a Client Component displays a message with variables (e.g., appointment count)
- WHEN the component renders
- THEN it uses translation keys with parameter interpolation (e.g., `t('count', { n: 5 })`)

### Requirement: Translation Key Structure

Translation keys SHALL follow a flat or nested dot-notation structure organized by feature area (e.g., `auth.login`, `appointments.status`, `common.save`).

#### Scenario: Keys are organized by feature

- GIVEN the translation file contains admin strings
- WHEN a developer looks up a key
- THEN keys are grouped by feature domain (auth, appointments, navigation, common)
- AND key names are descriptive and follow `{domain}.{entity}.{property}` pattern

#### Scenario: No duplicate keys across features

- GIVEN the translation file has keys for multiple features
- WHEN checking for key collisions
- THEN NO two features share the same key name
- AND each key maps to exactly one UI string
