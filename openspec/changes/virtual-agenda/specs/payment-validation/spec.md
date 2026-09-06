# Delta for payment-validation

## ADDED Requirements

### Requirement: Manual Mercado Pago transfer display

The system MUST display manual Mercado Pago payment instructions (Alias/CVU) with copy-to-clipboard, since online card processing is out of scope this phase.

#### Scenario: Payment instructions shown

- WHEN a client reaches the payment step
- THEN the Alias/CVU is displayed with a copy-to-clipboard control and the amount due

### Requirement: Deposit or full upfront payment

The amount due MUST reflect the configured payment model: full upfront amount, or a deposit (fixed integer amount or percentage), validated server-side without float arithmetic (binding decision 1, MONEY-01/02).

#### Scenario: Percentage deposit amount

- WHEN a service is configured for a percentage deposit
- THEN the due amount is computed as integer cents using arbitrary-precision math (Decimal.js) with explicit rounding
- AND the currency code is always carried with the amount

### Requirement: WhatsApp comprobante flow

The client MUST submit proof of transfer via a pre-filled `wa.me` deep link that opens a WhatsApp conversation with the comprobante context.

#### Scenario: Client sends comprobante

- WHEN a client completes the manual transfer
- THEN a pre-filled wa.me link opens WhatsApp carrying booking and amount context for the comprobante

### Requirement: Manual payment confirmation

An owner/manager MUST manually mark a booking as confirmed after reviewing the comprobante; there is no automatic payment webhook this phase (binding decision 2).

#### Scenario: Owner confirms payment

- WHEN an owner verifies the comprobante
- THEN the booking transitions `pendiente` → `confirmado` and the calendar marks it confirmed

### Requirement: Blacklist admission filter

Before accepting a booking from a phone number, the system MUST reject the WhatsApp/booking flow if the client `is_blacklisted` OR has more than 2 `no_asistio` records.

#### Scenario: Blacklisted client rejected

- WHEN a client has `is_blacklisted = true` or more than 2 no-shows
- THEN the booking flow is rejected and the client is directed to WhatsApp instead of confirmed