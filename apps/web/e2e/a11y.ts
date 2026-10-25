import { AxeBuilder } from '@axe-core/playwright';
import { expect, type Page } from '@playwright/test';

/**
 * FQ3 — axe scan at a happy-path stop. The jsx-a11y ESLint rules (FQ1)
 * police the SOURCE; this polices the rendered DOM the client actually
 * sees: contrast as computed, real heading/landmark structure, labels
 * wired at runtime. Fails the test on critical/serious impact violations
 * (the plan's bar); moderate/minor findings are not gating at demo stage.
 */
const BLOCKING_IMPACTS: ReadonlySet<string> = new Set(['critical', 'serious']);

/**
 * WCAG 1.4.3 exempts pure decoration from contrast requirements. The
 * footer's ghost wordmark (D9, board s1: "el wordmark fantasma ES la
 * transición") is one such permanent fixture on every screen: aria-hidden,
 * carries no information, and its near-invisibility IS the design. Excluded
 * from the contrast check only — never from semantic rules.
 */
const DECORATIVE: string[] = ['footer div[aria-hidden="true"]'];

export async function expectNoSeriousA11yViolations(page: Page, screen: string): Promise<void> {
  const results = await new AxeBuilder({ page }).exclude(...DECORATIVE).analyze();
  const blocking = results.violations
    .filter(
      (violation) => typeof violation.impact === 'string' && BLOCKING_IMPACTS.has(violation.impact)
    )
    .map((violation) => ({
      rule: violation.id,
      impact: violation.impact,
      nodes: violation.nodes.length,
      help: violation.help,
      where: violation.nodes.slice(0, 3).map((node) => node.target.join(' ')),
    }));
  // Soft on purpose: a broken screen must not hide the findings on the
  // other four — every stop reports, then the run fails with the full list.
  expect
    .soft(
      blocking,
      `[a11y] ${screen}: ${blocking.length} critical/serious axe violation type(s) — fix the DOM, not the gate`
    )
    .toEqual([]);
}
