import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * C2–C4 — contrato estático de fuente (tema dark, 2026-10-17).
 * El admin es dark (#000 background): los tokens AA se verifican sobre negro.
 * Ratios sobre #000: zinc-400 #a1a1aa ≈ 8.3:1 ✓; red-300 #fca5a5 ≈ 10.6:1 ✓;
 * red-400 #f87171 ≈ 7.6:1 ✓ (botón blacklist); zinc-500 #71717a ≈ 4.3:1 —
 * FALLA AA 4.5:1, por eso los guards negativos.
 * Los componentes admin importan alias @/ y server actions, irresolubles
 * bajo vitest sin jsdom/config extra; se verifica la clase exacta en el
 * nodo que la auditoría marcó.
 */
const SRC = (...p: string[]) => readFileSync(join(__dirname, '..', 'src', ...p), 'utf-8');

describe('contraste admin (C2–C4)', () => {
  it('C2: nombre de servicio oculto usa text-zinc-400 sobre negro (~8.3:1, no zinc-500)', () => {
    const src = SRC('components', 'admin', 'service-manager.tsx');
    expect(src).toContain('text-zinc-400');
    expect(src).not.toContain('text-zinc-500');
    expect(src).not.toContain('text-slate-400');
  });

  it('C3: etiqueta LTV usa text-zinc-400 sobre negro (~8.3:1, no zinc-500)', () => {
    const src = SRC('components', 'admin', 'client-list.tsx');
    expect(src).toContain('text-xs text-zinc-400');
    expect(src).not.toContain('text-zinc-500');
    expect(src).not.toContain('text-slate-400');
  });

  it('C4: badge no-show usa text-red-300 sobre bg-red-500/10 (dark AA ~10.6:1, no red-600)', () => {
    const src = SRC('components', 'admin', 'client-list.tsx');
    expect(src).toContain('bg-red-500/10 px-2 py-0.5 text-xs text-red-300');
    expect(src).not.toContain('text-red-600');
    // Nota: el botón "blacklist" usa text-red-400 sobre negro (~7.6:1, AA).
  });
});
