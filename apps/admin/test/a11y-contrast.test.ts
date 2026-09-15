import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * C2–C4 — contrato estático de fuente.
 * Los componentes admin importan alias @/ y server actions, irresolubles
 * bajo vitest sin jsdom/config extra; se verifica la clase exacta en el
 * nodo que la auditoría marcó (archivo:línea con evidencia).
 */
const SRC = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf-8');

describe('contraste admin (C2–C4)', () => {
  it('C2: nombre de servicio oculto usa text-slate-500 (no slate-400)', () => {
    const src = SRC('components', 'admin', 'service-list.tsx');
    expect(src).toContain('text-slate-500');
    expect(src).not.toContain('text-slate-400');
  });

  it('C3: etiqueta LTV usa text-slate-600 (no slate-400)', () => {
    const src = SRC('components', 'admin', 'client-list.tsx');
    expect(src).toContain('text-xs text-slate-600');
    expect(src).not.toContain('text-slate-400');
  });

  it('C4: badge no-show usa text-red-700 (no red-600)', () => {
    const src = SRC('components', 'admin', 'client-list.tsx');
    expect(src).toContain('bg-red-50 px-2 py-0.5 text-xs text-red-700');
    expect(src).not.toContain('bg-red-50 px-2 py-0.5 text-xs text-red-600');
    // Nota: el botón "blacklist" conserva text-red-600 sobre blanco (4.83:1,
    // PASS según auditoría §3) — fuera del alcance de C4.
  });
});
