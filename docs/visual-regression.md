# Visual Regression Testing (E7)

## Overview
Visual regression testing ensures UI consistency across breakpoints by comparing screenshots against approved baselines.

## Stack
- **Playwright** + **@playwright/test**
- **Pixelmatch** for diff comparison (built-in)
- **Baseline images** committed to repo

## Breakpoints
| Name | Width | Height | Device |
|------|-------|--------|--------|
| Mobile | 390px | 844px | iPhone 12/13/14 |
| Tablet | 768px | 1024px | iPad Pro |
| Desktop | 1440px | 900px | MacBook Pro |

## Commands

### Run all visual tests
```bash
cd apps/web
npx playwright test
```

### Run specific viewport
```bash
npx playwright test --project=mobile-chromium
npx playwright test --project=tablet-chromium
npx playwright test --project=desktop-chromium
```

### Run specific test file
```bash
npx playwright test visual-regression.spec.ts
npx playwright test components.spec.ts
```

### Update baselines (after approved design changes)
```bash
npx playwright test --update-snapshots
```

### View HTML report
```bash
npx playwright show-report
```

## CI Integration
GitHub Actions workflow runs on every PR:
1. Starts dev server
2. Runs visual regression tests
3. Fails PR if diff > threshold
4. Uploads diff artifacts for review

## Approval Workflow

### When screenshots change:
1. **CI fails** with diff report
2. **Reviewer** checks diff in Playwright HTML report
3. **If intentional** (design change): Run `npx playwright test --update-snapshots` locally, commit new baselines
4. **If unintentional** (regression): Fix code, re-run tests

### Thresholds
- `maxDiffPixels: 100` (full page)
- `maxDiffPixels: 50` (components)
- `threshold: 0.2` (20% color difference allowed)

## Directory Structure
```
apps/web/playwright/
├── baseline/          # Approved baseline images (committed)
├── diff/              # Diff images (generated on failure)
├── screenshots/       # Current screenshots
├── visual-regression.spec.ts  # Full page tests
├── components.spec.ts         # Component tests
└── playwright.config.ts       # Configuration
```

## Adding New Pages to Test
1. Add page to `PAGES` array in `visual-regression.spec.ts`
2. Run tests to generate baselines: `npx playwright test --update-snapshots`
3. Commit new baseline images

## Adding New Components
1. Add component test in `components.spec.ts`
2. Ensure component has stable test IDs or selectors
3. Run tests to generate baselines

## Handling Dynamic Content
Add CSS to hide dynamic elements in test:
```typescript
await page.addStyleTag({
  content: `
    [data-testid="current-date"],
    [data-testid="timestamp"],
    .animate-spin,
    .animate-pulse {
      visibility: hidden !important;
    }
    *,
    *::before,
    *::after {
      animation-duration: 0s !important;
      transition-duration: 0s !important;
    }
  `,
});
```

## Debugging Failures
1. Run `npx playwright show-report` to see diffs
2. Check `playwright/diff/` for diff images
3. Use `--debug` flag: `npx playwright test --debug`
4. Increase `maxDiffPixels` threshold if needed for legitimate changes

## Best Practices
- ✅ Test full pages AND key components
- ✅ Disable animations for consistent screenshots
- ✅ Wait for `networkidle` + timeout for fonts
- ✅ Use `data-testid` for reliable component targeting
- ✅ Review diffs before updating baselines
- ❌ Don't commit baselines without review
- ❌ Don't set thresholds too high (misses regressions)
