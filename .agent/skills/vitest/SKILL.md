---
name: vitest
description: >
  Vitest testing patterns for PAEONIA. Trigger: When writing, reviewing, or running unit/integration tests.
license: Apache-2.0
metadata:
  author: paeonia
  version: "1.0"
---

# Vitest Testing Patterns for PAEONIA

## Stack

- **Runner**: Vitest 4.x
- **Environment**: jsdom
- **Coverage**: v8 provider, 90% threshold
- **Assertions**: Vitest built-in (chai-compatible)

## AAA Pattern (Obligatorio)

```typescript
import { describe, it, expect } from "vitest";

describe("calculateAspectOrb", () => {
  it("should return exact orb for conjunction at same degree", () => {
    // Arrange
    const planet1 = 15.0 as Degree;
    const planet2 = 15.0 as Degree;

    // Act
    const orb = calculateAspectOrb(planet1, planet2, "conjunction");

    // Assert
    expect(orb).toBe(0.0);
  });
});
```

## Fake It 'Til You Make It

1. Write the test with expected result
2. Hardcode return to pass (GREEN)
3. Add tests that force real implementation
4. Replace hardcode with real logic

## Triangulation

Multiple tests with different inputs force generic implementation:

```typescript
expect(normalizeAngle(0)).toBe(0);
expect(normalizeAngle(360)).toBe(0);
expect(normalizeAngle(720)).toBe(0);
expect(normalizeAngle(-90)).toBe(270);
```

## Query Priority (Testing Library)

1. `getByRole` — accessibility verified
2. `getByLabelText` — labels verified
3. `getByText` — visible content
4. `getByTestId` — last resort

## Mocking Supabase

```typescript
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockResolvedValue({ data: mockData, error: null }),
  }),
}));
```

## Testing Server Actions

```typescript
it("should create booking with valid data", async () => {
  const formData = new FormData();
  formData.append("serviceId", "123");
  formData.append("date", "2026-04-01");

  const result = await createBookingAction(formData);

  expect(result.success).toBe(true);
  expect(result.data).toBeDefined();
});
```

## Coverage Targets

| Type               | Target | Critical |
| ------------------ | ------ | -------- |
| Utilities/Hooks    | 90%+   | < 80%    |
| Components         | 85%+   | < 70%    |
| Engine (astrology) | 95%+   | < 90%    |

## DON'T Test

- Implementation details
- Third-party library internals
- CSS styling
- Type checking (TypeScript handles it)
