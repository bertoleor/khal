# Delta for service-catalog

## ADDED Requirements

### Requirement: Public service catalog listing

The system MUST render a mobile-first service catalog grid (landing + catalog) listing every service whose `is_visible` flag is `true`, ordered by admin-defined sort. Desktop layouts are an enhancement; nothing below 768px width may break (UX-01).

#### Scenario: Visible service appears in catalog

- WHEN a client opens the catalog and services exist with `is_visible = true`
- THEN the grid renders a card per visible service with name, price, and photo
- AND services with `is_visible = false` are excluded

#### Scenario: Empty catalog

- WHEN no visible services exist
- THEN an empathetic empty state with a directional CTA renders (UX-05), never a blank screen

### Requirement: Service detail with sticky pricing

The system MUST render a service detail view with a sticky price/CTA bar (sticky bottom on mobile, `w-full`), iOS design language (clean typography, subtle borders, no heavy animation).

#### Scenario: Detail view

- WHEN a client taps a service card
- THEN the detail view renders service description, photos, price, and a primary booking CTA

### Requirement: Integer monetary representation

Every service price MUST be stored as an INTEGER in the smallest currency unit (ARS centavos) with a mandatory `currency_code` column. Floats are prohibited (MONEY-01, MONEY-03).

#### Scenario: Price storage and display

- WHEN a price is persisted
- THEN it is stored as integer cents with an explicit currency code
- AND display conversion `(cents / 100).toFixed(2)` happens only at render via `Intl.NumberFormat`

### Requirement: Configurable payment model per service

Each service MUST declare a payment model: full upfront payment, or a deposit (`seña`). A deposit MUST be either a fixed integer amount or a percentage of the total, and MUST inherit a store-wide default when unset at the service level.

#### Scenario: Service-specific deposit override

- WHEN a service sets a percentage deposit and the store-wide default is full payment
- THEN the service's deposit applies to that service only

#### Scenario: Store-wide default fallback

- WHEN a service omits its own deposit setting
- THEN the store-wide payment-model default applies

### Requirement: Service photos via presigned uploads

Service photos MUST be uploaded through presigned URLs directly to storage (never routed through the Node server), stored as `{bucket}/{organization_id}/{entity}/{uuid}.{ext}`, and served as WebP/AVIF (PERF-06, PERF-07, STOR-01).

#### Scenario: Admin uploads a service photo

- WHEN an admin uploads a photo
- THEN the server issues a presigned URL, the client uploads directly to storage, and the server stores only the object path
- AND the image is compressed/transcoded before being served to clients