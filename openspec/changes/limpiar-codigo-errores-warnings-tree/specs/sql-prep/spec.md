# SQL Preparation Specification

## Purpose

Document SQL migration patterns and Supabase connection preparation so the team can connect to Supabase when ready, without blocking current development.

## Requirements

### Requirement: Migration Documentation

The project SHALL include documentation in `DOCS/` describing the SQL migration patterns needed when connecting to Supabase.

#### Scenario: Migration docs exist in DOCS/

- GIVEN the project plans to connect to Supabase
- WHEN a developer reads `DOCS/`
- THEN a migration guide exists (e.g., `DOCS/supabase-migration.md`)
- AND the guide covers: schema creation, RLS policies, seed data, and connection setup

#### Scenario: Migration docs reference existing schema

- GIVEN the migration guide is created
- WHEN a developer compares it to the current DB schema
- THEN the guide accurately references table names, column types, and constraints
- AND the guide maps current mock/mock data patterns to real Supabase tables

### Requirement: Auth Migration Path

The documentation SHALL describe how the current mock auth flow maps to Supabase Auth + JWT verification.

#### Scenario: Auth migration documented

- GIVEN the current auth uses cookie-based mock sessions
- WHEN a developer reads the auth migration section
- THEN the doc explains: cookie → Supabase Auth session, mock role check → JWT role claim, `requireAuth()` → `supabase.auth.getUser()` + JWT verify

#### Scenario: Auth code is structurally ready

- GIVEN the current `requireAuth()` helper exists
- WHEN Supabase connects
- THEN the helper's internal implementation can be swapped without changing Server Action call sites
- AND the helper's return type (user context) remains compatible

### Requirement: Environment Variable Documentation

The documentation SHALL list all environment variables required for Supabase connection and their expected values.

#### Scenario: Env vars documented

- GIVEN the project will connect to Supabase
- WHEN a developer sets up the environment
- THEN `DOCS/` contains a list of required env vars: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET`
- AND each variable includes a description and example value format

#### Scenario: Env vars added to validation schema

- GIVEN the env documentation lists Supabase variables
- WHEN the env validation schema is updated for Supabase
- THEN the schema includes all required Supabase variables
- AND the schema marks them as optional (to avoid breaking current dev setup)
- AND validation only enforces them when `SUPABASE_ENABLED=true` or similar flag is set

### Requirement: RLS Policy Patterns

The documentation SHALL include recommended Row-Level Security (RLS) policy patterns for the main entities (appointments, users, etc.).

#### Scenario: RLS patterns documented

- GIVEN Supabase RLS is required for production
- WHEN a developer reads the RLS section
- THEN it includes example policies for SELECT, INSERT, UPDATE, DELETE
- AND policies reference the auth.uid() and JWT claims pattern
- AND policies cover the admin vs. regular user roles
