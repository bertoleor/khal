# Cleanup Specification

## Purpose

Remove dead files, fix missing directives, improve error handling, and deduplicate shared utilities across the monorepo.

## Requirements

### Requirement: Dead File Removal

ALL empty or dead files with no functional purpose SHALL be removed from the project.

#### Scenario: Empty packages/ui barrel export removed

- GIVEN `packages/ui/src/index.ts` is an empty barrel export
- WHEN the file is checked for imports
- THEN NO file in the monorepo imports from `@khal/ui`
- AND the empty file is removed
- AND `transpilePackages` in `next.config.ts` no longer references `@khal/ui` (or the package is scaffolded with minimal content)

#### Scenario: Dead apps/admin/src/index.ts removed

- GIVEN `apps/admin/src/index.ts` exists
- WHEN the file is checked for references
- THEN NO file imports or references it
- AND the file is deleted

### Requirement: Unused Type Export Pruning

ALL type exports from `packages/types/src/index.ts` that are not imported anywhere in the monorepo SHALL be removed.

#### Scenario: Unused types removed from packages/types

- GIVEN `packages/types` exports UUID, ISODateTime, CurrencyCode, Cents
- WHEN each type is searched across the monorepo
- THEN NONE of these types are imported by any file
- AND they are removed from the barrel export
- AND the remaining types continue to be exported correctly

### Requirement: Missing "use server" Directive

ALL Server Action files SHALL have the `"use server"` directive at the top of the file.

#### Scenario: catalog.ts gets "use server" directive

- GIVEN `apps/web/src/lib/actions/catalog.ts` contains Server Actions
- WHEN the file is checked for the directive
- THEN `"use server"` is present as the first line
- AND the Server Actions continue to function correctly

### Requirement: Environment Config Error Handling

`apps/web/src/config/env.ts` SHALL wrap environment validation in a try/catch to provide clear error messages when environment variables are missing.

#### Scenario: Missing env variable produces clear error

- GIVEN a required environment variable is missing
- WHEN the app starts and env validation runs
- THEN the error message names the missing variable(s)
- AND the error message includes the expected format
- AND the app fails to start (does not run with invalid config)

#### Scenario: Valid env configuration passes

- GIVEN all required environment variables are set
- WHEN the app starts and env validation runs
- THEN the parsed environment object is returned
- AND the app starts normally

### Requirement: Utility Deduplication — toIsoDate

`toIsoDate` SHALL exist in exactly ONE location: `@khal/utils`. Any duplicate implementations in apps or packages SHALL be removed.

#### Scenario: toIsoDate exists in @khal/utils

- GIVEN `packages/utils` contains a `toIsoDate` function
- WHEN any app or package needs date formatting
- THEN it imports `toIsoDate` from `@khal/utils`
- AND NO local duplicate implementations exist

#### Scenario: All imports updated to @khal/utils

- GIVEN `toIsoDate` is moved to `@khal/utils`
- WHEN any file previously imported a local `toIsoDate`
- THEN the import path is updated to `@khal/utils`
- AND the function continues to work correctly in all consumers
