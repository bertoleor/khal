import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(__dirname, '../..');

describe('Khal design system validation', () => {
  it('docs/DESIGN.md exists with token definitions', () => {
    const p = path.join(ROOT, 'docs/DESIGN.md');
    expect(fs.existsSync(p)).toBe(true);
    const c = fs.readFileSync(p, 'utf8');
    expect(c).toMatch(/--primary/);
    expect(c).toMatch(/--secondary/);
    expect(c).toMatch(/--background/);
    expect(c.length).toBeGreaterThan(200);
  });
});
