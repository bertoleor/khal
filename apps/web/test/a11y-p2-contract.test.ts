import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [ORN-59/t_e7321201] Accessibility contract tests for the P2 findings of the
 * 2026-09-29 audit (docs/auditoria-a11y-2026-09-29.md, commit fdb9e29).
 *
 * These are textual contracts over the JSX sources, following the repo's
 * established contract-test pattern (see dep-audit.test.ts and
 * seed-contract.test.ts). The audit findings are static, class-level defects
 * (missing focus-visible ring, sub-AA contrast token), so the contract pins
 * the *outcome*: every interactive control in the audited flows must carry
 * the repo's focus-visible ring convention, and price/LTV text must not use
 * the sub-AA slate-400 token on white surfaces.
 *
 * H1 (P2, WCAG 1.4.3): booking-form.tsx price text used text-slate-400
 *   (#94a3b8 on #ffffff = 2.56:1 < 4.5:1 AA). Same class of defect:
 *   client-list.tsx LTV label (text-slate-400 on white card).
 * H2 (P2, WCAG 2.4.7): six audited submit/CTA points had no focus-visible
 *   outline, so keyboard users cannot see focus on the booking flow's most
 *   critical actions.
 */
const repoRoot = resolve(__dirname, '../../..');

function read(appPath: string): string {
  return readFileSync(resolve(repoRoot, appPath), 'utf8');
}

/** Extract the className strings of every <button>/<Link> tag in a source. */
function buttonClassNames(source: string): string[] {
  // Tag block from `<button`/`<Link` up to the tag's closing `>`.
  const out: string[] = [];
  const tagRe = /<(button|Link)\b([\s\S]*?)(?:\/>|>)/g;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(source)) !== null) {
    const attrs = m[2];
    // Direct literal: className="..." / className={`...`}
    const lit = /className=(["'`])([\s\S]*?)\1/.exec(attrs);
    if (lit && !lit[2].includes('?')) {
      out.push(lit[2]);
      continue;
    }
    // Braced expression: className={cond ? 'a' : 'b'} — every string literal
    // after the `?` is a className the control can render, so each branch
    // counts. Literals before the `?` are the condition's comparand, not
    // classes (e.g. `to === 'confirmado' ? ... : ...`).
    const expr = /className=\{([\s\S]*?)\}/.exec(attrs);
    if (expr) {
      const branches = expr[1].slice(expr[1].indexOf('?') + 1);
      for (const s of branches.match(/(['"`])([^'"`]+)\1/g) ?? []) {
        out.push(s.slice(1, -1));
      }
    }
  }
  return out;
}

const RING = 'focus-visible:outline-2';
const RING_OFFSET = 'focus-visible:outline-offset-2';

/**
 * H1 — price/LTV text contrast (WCAG 1.4.3 AA: 4.5:1).
 *
 * slate-400 (#94a3b8) on white is 2.56:1 — fails AA even for large text.
 * slate-500 (#64748b) is 4.76:1 and passes. The contract forbids the
 * sub-AA token on the audited text surfaces.
 */
describe('[ORN-59 H1] price & LTV text contrast on white surfaces', () => {
  it('booking form price line does not use the sub-AA slate-400 token', () => {
    const src = read('apps/web/src/components/booking/booking-form.tsx');
    const lines = src.split('\n');
    const contentIdx = lines.findIndex((l) => l.includes('formatCents(service.price_cents'));
    expect(contentIdx).toBeGreaterThan(-1);
    // The opening tag with the className sits above the content line.
    const opening = lines
      .slice(Math.max(0, contentIdx - 3), contentIdx)
      .reverse()
      .find((l) => l.includes('className='));
    expect(opening).toBeDefined();
    expect(opening).toContain('text-slate-500');
    expect(opening).not.toContain('text-slate-400');
  });

  it('admin client list LTV label does not use the sub-AA slate-400 token', () => {
    const src = read('apps/admin/src/components/admin/client-list.tsx');
    const ltvLine = src.split('\n').find((l) => l.includes("t('clients.ltv')"));
    expect(ltvLine).toBeDefined();
    expect(ltvLine).not.toContain('text-slate-400');
  });
});

/**
 * H2 — focus-visible ring on the audited interactive controls (WCAG 2.4.7).
 *
 * The repo convention (error.tsx, not-found.tsx, payment-step.tsx:45) is
 * `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-*`.
 * Every button/submit control in the audited flow files must carry it.
 */
describe('[ORN-59 H2] focus-visible ring on audited interactive controls', () => {
  const RING_TARGETS: Array<{ file: string; hint: string }> = [
    { file: 'apps/web/src/app/[locale]/servicios/[id]/page.tsx', hint: 'CTA Reservar (Link)' },
    { file: 'apps/web/src/components/booking/booking-form.tsx', hint: 'submit Confirmar' },
    { file: 'apps/web/src/components/payment/payment-step.tsx', hint: 'Pagar online' },
    { file: 'apps/admin/src/components/admin/appointment-list.tsx', hint: 'transiciones admin' },
    { file: 'apps/admin/src/components/admin/service-list.tsx', hint: 'toggle visibilidad + bulk' },
    { file: 'apps/admin/src/components/admin/exceptions-list.tsx', hint: 'submit excepciones' },
    { file: 'apps/admin/src/components/admin/client-list.tsx', hint: 'toggle blacklist' },
  ];

  it.each(RING_TARGETS)('$hint ($file): every button className carries the ring', ({ file }) => {
    const src = read(file);
    const buttonClasses = buttonClassNames(src);
    // Sanity: each file has at least one interactive control.
    expect(buttonClasses.length, `${file} should expose interactive controls`).toBeGreaterThan(0);
    for (const cls of buttonClasses) {
      expect(cls, `${file}: <${cls}>`).toContain(RING);
      expect(cls, `${file}: <${cls}>`).toContain(RING_OFFSET);
    }
  });
});
