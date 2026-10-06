import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * A1 (admin) + A2 + T3 — contrato estático de fuente.
 * El layout admin es server component (next-intl/server) y el nav client
 * usa alias @/; ambos irresolubles bajo vitest node → se verifica estructura.
 */
const SRC = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf-8');

describe('nav admin + lang (A1/A2/T3)', () => {
  it('A2: existe admin-nav client con usePathname y aria-current="page"', () => {
    const navPath = join(__dirname, '..', 'src', 'components', 'admin', 'admin-nav.tsx');
    expect(existsSync(navPath)).toBe(true);
    const src = readFileSync(navPath, 'utf-8');
    expect(src).toContain('usePathname');
    expect(src).toContain('aria-current');
  });

  it('A1: el layout admin expone un skip-link hacia #main', () => {
    expect(SRC('app', 'admin', 'layout.tsx')).toContain('href="#main"');
  });

  it('T3: el layout admin declara lang="es-AR"', () => {
    expect(SRC('app', 'layout.tsx')).toContain('lang="es-AR"');
  });
});
