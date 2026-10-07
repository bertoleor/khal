import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * [ORN-57/t_44d71e6c] Supply-chain regression test for the pnpm audit HIGHs.
 *
 * The monorepo closes its transitive CVEs via `pnpm.overrides` in the root
 * package.json (sharp and postcss are bundled by next@15.5.25, so direct
 * bumps in apps are overwritten by next's own tree). This test pins the
 * *outcome* of that policy: it parses pnpm-lock.yaml and asserts that every
 * resolved version of both packages meets the patched floor, so a future
 * `pnpm install` that silently reintroduces a vulnerable resolution fails CI
 * instead of shipping.
 *
 *   - sharp >= 0.35.4
 *       CVE-2026-33327 + CVE-2026-33328 (libvips) — fixed in 0.35.0 line,
 *       GHSA-g89c-p67h-r497 + GHSA-2jg2-4c8w-9m2x (libheif) — fixed in 0.35.4.
 *   - postcss >= 8.5.23
 *       GHSA-68xf-6m6c-pvwj arbitrary file read via source map
 *       (`from` unset) and GHSA-fxqj-rqcc-2cmp path traversal in source-map
 *       auto-load — both closed at 8.5.23. next@15.5.25 bundles 8.4.31;
 *       the moderate `</style>` XSS (GHSA-7pxx-4mx2-g3jf) is also closed by
 *       the same override.
 *
 * The floors intentionally use `>=` semantics: the override pins minimums
 * ("sharp": ">=0.35.4", "postcss": ">=8.5.23"), so newer patch releases stay
 * green without touching this file.
 */
const repoRoot = resolve(__dirname, '../../..');
const lockPath = resolve(repoRoot, 'pnpm-lock.yaml');

const PATCHED_FLOOR = {
  sharp: '0.35.4',
  postcss: '8.5.23',
} as const;

/**
 * Collect every version resolved for `pkg` in the lockfile. Matches the
 * `  pkg@X.Y.Z:` package/snapshot entries (both the `packages:` metadata
 * section and the `snapshots:` section), deduplicated — the same version is
 * typically listed in both.
 */
function resolvedVersions(lock: string, pkg: string): string[] {
  const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(?:^|\\n)\\s*${escaped}@(\\d+\\.\\d+\\.\\d+):`, 'g');
  const versions = new Set<string>();
  for (const match of lock.matchAll(re)) {
    versions.add(match[1]);
  }
  return [...versions].sort(compareVersions);
}

/** Triadic semver comparison for the plain X.Y.Z versions these packages use. */
function compareVersions(a: string, b: string): number {
  const pa = a.split('.').map(Number);
  const pb = b.split('.').map(Number);
  for (let i = 0; i < 3; i += 1) {
    if (pa[i] !== pb[i]) return (pa[i] ?? 0) - (pb[i] ?? 0);
  }
  return 0;
}

function isAtLeast(version: string, floor: string): boolean {
  return compareVersions(version, floor) >= 0;
}

describe('supply-chain: patched dependency floors (pnpm audit HIGHs)', () => {
  const lock = readFileSync(lockPath, 'utf8');

  it.each([
    { pkg: 'sharp', floor: PATCHED_FLOOR.sharp },
    { pkg: 'postcss', floor: PATCHED_FLOOR.postcss },
  ] as const)('every resolved $pkg in pnpm-lock.yaml is >= $floor', ({ pkg, floor }) => {
    const versions = resolvedVersions(lock, pkg);

    // Guard: an empty match set would pass the floor assertion trivially
    // while meaning the lockfile (or this parser) drifted silently.
    expect(versions, `no ${pkg} entries found in pnpm-lock.yaml`).not.toHaveLength(0);

    const vulnerable = versions.filter((v) => !isAtLeast(v, floor));
    expect(
      vulnerable,
      `vulnerable ${pkg} resolutions below ${floor}: ${vulnerable.join(', ')}\n` +
        'expected: root package.json pnpm.overrides forces every resolution to the patched floor'
    ).toEqual([]);
  });

  it('the next-bundled postcss (was 8.4.31) is covered by the >=8.5.23 override', () => {
    const versions = resolvedVersions(lock, 'postcss');
    // next@15.5.25 bundles postcss 8.4.31; after the override the whole tree
    // must collapse to patched resolutions only.
    expect(versions).not.toContain('8.4.31');
    for (const v of versions) {
      expect(isAtLeast(v, PATCHED_FLOOR.postcss), `postcss ${v} < ${PATCHED_FLOOR.postcss}`).toBe(
        true
      );
    }
  });
});
