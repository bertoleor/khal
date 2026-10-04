import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [ORN-59] Accessibility contract tests for the P3/SUGG findings of the
 * 2026-09-29 audit (docs/auditoria-a11y-2026-09-29.md). Same static-contract
 * pattern as a11y-p2-contract.test.ts: the audit findings are textual
 * class-level defects, so the contract pins the fixed outcome.
 *
 * H3 (P3, WCAG 1.3.1 / 4.1.2): exceptions-list.tsx form fields lack an
 *   accessible name (title uses only a disappearing placeholder; type select
 *   and date input have no label at all).
 * H4 (P3, WCAG 4.1.3): payment-step.tsx puts aria-live="polite" on the very
 *   button whose own text mutates ({copied ? ...}), so most screen readers
 *   never announce the state change. The live region must be a dedicated,
 *   visually separate element (sr-only) with a stable-button label.
 * H5 (P3, a11y-ops): appointment-list.tsx fires destructive transitions
 *   (cancelado / no_asistio) in a single click with no confirmation.
 *   Contract: every destructive action button must confirm before acting.
 * H6 (SUGG): appointment status is conveyed color-only via dots; there must
 *   be a text alternative (sr-only span with the status) in each row.
 */
const repoRoot = resolve(__dirname, '../../..');

function read(appPath: string): string {
  return readFileSync(resolve(repoRoot, appPath), 'utf8');
}

describe('H3 — exceptions-list admin form has accessible names', () => {
  const src = () => read('apps/admin/src/components/admin/exceptions-list.tsx');

  it('title input has aria-label or an associated label (not only placeholder)', () => {
    const s = src();
    const titleInput = /<input[^>]*name="title"[\s\S]*?\/>/.exec(s)?.[0] ?? '';
    expect(titleInput).toMatch(/aria-label|id="/);
  });

  it('type select has aria-label or an associated label', () => {
    const s = src();
    const typeSelect = /<select[^>]*name="type"[\s\S]*?>/.exec(s)?.[0] ?? '';
    expect(typeSelect).toMatch(/aria-label|aria-labelledby|id="/);
  });

  it('date input has aria-label or an associated label', () => {
    const s = src();
    const dateInput = /<input[^>]*name="date"[\s\S]*?\/>/.exec(s)?.[0] ?? '';
    expect(dateInput).toMatch(/aria-label|aria-labelledby|id="/);
  });
});

describe('H4 — payment-step copy status announced outside the mutating button', () => {
  const src = () => read('apps/web/src/components/payment/payment-step.tsx');

  it('the copy button itself does NOT carry aria-live', () => {
    const s = src();
    const buttonTag = /<button[\s\S]*?type="button"[\s\S]*?>/.exec(s)?.[0] ?? '';
    expect(buttonTag).not.toMatch(/aria-live/);
  });

  it('a dedicated sr-only live region announces the copied state', () => {
    const s = src();
    // A separate element (span/visually-hidden) with aria-live, referencing the copied state.
    expect(s).toMatch(
      /aria-live="polite"[\s\S]{0,120}role="status"|role="status"[\s\S]{0,120}aria-live="polite"/
    );
    expect(s).toMatch(/sr-only|visually-hidden/);
  });
});

describe('H5 — destructive appointment transitions require confirmation', () => {
  const src = () => read('apps/admin/src/components/admin/appointment-list.tsx');

  it('transition handler confirms before cancel / no_show', () => {
    const s = src();
    expect(s).toMatch(/confirm\(/);
  });

  it('confirmation is gated to destructive targets only (not confirmado)', () => {
    const s = src();
    // The confirm call must branch on the target status being destructive.
    expect(s).toMatch(/DESTRUCTIVE|destructive/);
  });
});

describe('H6 — appointment status exposed as text for screen readers', () => {
  it('each row renders an sr-only status text next to the color dot', () => {
    const s = read('apps/admin/src/components/admin/appointment-list.tsx');
    expect(s).toMatch(/sr-only/);
  });
});
