// @vitest-environment node
// A1 (web) + C1 — fixes verificados contra el código real.
// Header es puro (sin imports) así que se renderiza con ReactDOMServer.
// booking-form.tsx usa alias @/ irresoluble en vitest → contrato estático
// de fuente, marcado como tal.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Header } from '../src/components/shared/header';

describe('a11y fixes (web)', () => {
  it('A1: Header expone un skip-link "Ir al contenido" hacia #main', () => {
    const html = renderToStaticMarkup(<Header />);
    expect(html).toContain('href="#main"');
    expect(html).toContain('Ir al contenido');
  });

  it('C1: el precio del servicio usa text-slate-500 AA (no slate-400) — contrato p2 ratio 4.76:1', () => {
    const src = readFileSync(
      join(__dirname, '..', 'src', 'components', 'booking', 'booking-form.tsx'),
      'utf-8'
    );
    expect(src).toContain('text-slate-500');
    expect(src).not.toContain('slate-400');
    expect(src).not.toContain('text-slate-400');
  });
});
