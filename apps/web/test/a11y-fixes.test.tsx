// @vitest-environment node
// A1 (web) + C1 — fixes verificados contra el código real.
// Header usa Link de @/i18n/navigation (next-intl) desde la navbar 2026-10-17,
// así que se renderiza dentro de NextIntlClientProvider. booking-form.tsx usa
// alias @/ irresoluble en vitest → contrato estático de fuente, marcado como tal.
import { NextIntlClientProvider } from 'next-intl';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Header } from '../src/components/shared/header';

describe('a11y fixes (web)', () => {
  it('A1: Header expone un skip-link "Ir al contenido" hacia #main', () => {
    const html = renderToStaticMarkup(
      <NextIntlClientProvider locale="es" messages={{}}>
        <Header />
      </NextIntlClientProvider>
    );
    expect(html).toContain('href="#main"');
    expect(html).toContain('Ir al contenido');
  });

  it('C1: el precio del servicio usa un token AA sobre superficie oscura (no slate-400) — contrato p2', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'app', '[locale]', 'servicios', '[id]', 'reservar', 'page.tsx'),
      'utf-8'
    );
    // v2 (2026-10-23, F2 unit 3a-ii): the price line moved from the booking
    // form to the reservar page header, upgraded from zinc-500 (~5.75:1) to
    // the foreground token on the dark background — comfortably WCAG 1.4.3
    // AA. The contract still forbids the sub-AA slate-400 token everywhere.
    expect(src).toContain('text-foreground');
    expect(src).not.toContain('slate-400');
    expect(src).not.toContain('text-slate-400');
  });
});
