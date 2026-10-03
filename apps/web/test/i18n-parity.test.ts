import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [KHAL-A7] i18n parity contract — es must equal en (web).
 *
 * Audit finding 2026-10-02 (KHAL-A7): parity verified manually (48/48 keys,
 * 0 drift) but no test pinned it. next-intl silently renders the raw key
 * when a translation is missing, so any feature adding a key on one
 * locale only breaks the other in production without a failing check.
 *
 * This test walks both message trees (recursive descent into nested
 * objects, leaf values treated as translatable strings) and asserts the
 * key-path sets are identical. Failure names every drifted path so the
 * fix is mechanical: add/remove the key on the missing side.
 */

type MessageTree = Record<string, unknown>;

const MESSAGES_DIR = resolve(__dirname, '..', 'messages');

function loadMessages(locale: string): MessageTree {
  const path = resolve(MESSAGES_DIR, `${locale}.json`);
  return JSON.parse(readFileSync(path, 'utf-8')) as MessageTree;
}

function collectKeyPaths(tree: MessageTree, prefix = ''): Set<string> {
  const out = new Set<string>();
  for (const [key, value] of Object.entries(tree)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      for (const nested of collectKeyPaths(value as MessageTree, path)) {
        out.add(nested);
      }
    } else {
      out.add(path);
    }
  }
  return out;
}

function diff(a: Set<string>, b: Set<string>): string[] {
  return [...a].filter((k) => !b.has(k)).sort();
}

describe('KHAL-A7 — web i18n parity (es ↔ en)', () => {
  const es = collectKeyPaths(loadMessages('es'));
  const en = collectKeyPaths(loadMessages('en'));

  it('web messages/es.json and messages/en.json contain the exact same key-paths', () => {
    const esOnly = diff(es, en);
    const enOnly = diff(en, es);
    expect(esOnly, `keys present in es but missing in en:\n  ${esOnly.join('\n  ')}`).toEqual([]);
    expect(enOnly, `keys present in en but missing in es:\n  ${enOnly.join('\n  ')}`).toEqual([]);
  });

  it('sanity: web locales are non-trivially populated (guard against empty file slip)', () => {
    // 2026-10-02 audit: web es=48, en=48. Pin a lower bound so a wipe doesn't pass silently.
    expect(es.size).toBeGreaterThanOrEqual(40);
    expect(en.size).toBeGreaterThanOrEqual(40);
  });
});
