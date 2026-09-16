import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * G7 — paridad i18n es/en (apps/web).
 *
 * Garantiza que los diccionarios es.json y en.json no deriven entre sí:
 *  - mismos conjuntos de claves (en ambas direcciones),
 *  - mismos placeholders de interpolación ({service}, {amount}, …) por clave.
 *
 * Fuente: docs/auditoria-nocturna-2026-09-12.md → G7 "Paridad i18n es/en sin test".
 */

const MESSAGES_DIR = join(__dirname, '..', 'messages');

type Messages = Record<string, unknown>;

function load(locale: 'es' | 'en'): Messages {
  const raw = readFileSync(join(MESSAGES_DIR, `${locale}.json`), 'utf-8');
  return JSON.parse(raw) as Messages;
}

/** Aplana claves anidadas a rutas `a.b.c`. */
function flatten(obj: Messages, prefix = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object') {
      Object.assign(out, flatten(value as Messages, path));
    } else {
      out[path] = String(value);
    }
  }
  return out;
}

/** Extrae los placeholders `{name}` de un string de mensaje. */
function placeholders(msg: string): Set<string> {
  return new Set([...msg.matchAll(/\{([A-Za-z][A-Za-z0-9]*)\}/g)].map((m) => m[1]));
}

const es = flatten(load('es'));
const en = flatten(load('en'));

describe('apps/web i18n parity (es/en)', () => {
  it('has the same set of keys in es and en', () => {
    const esKeys = Object.keys(es);
    const enKeys = Object.keys(en);
    expect(esKeys.length).toBeGreaterThan(0);
    expect(enKeys.length).toBe(esKeys.length);

    const onlyEs = esKeys.filter((k) => !(k in en));
    const onlyEn = enKeys.filter((k) => !(k in es));
    expect(onlyEs).toEqual([]);
    expect(onlyEn).toEqual([]);
  });

  it('has matching interpolation placeholders per key', () => {
    const keys = Object.keys(es);
    for (const key of keys) {
      const esPh = placeholders(es[key]);
      const enPh = placeholders(en[key]);
      expect([...enPh].sort(), `placeholders mismatch at "${key}"`).toEqual([...esPh].sort());
    }
  });
});
