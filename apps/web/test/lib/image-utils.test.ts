import { describe, it, expect } from 'vitest';
import { getBlurDataURL, getSizesAttr, IMAGE_SIZES, getFillProps } from '@/lib/image-utils';

describe('getBlurDataURL (E3 — blur placeholder)', () => {
  it('returns a valid SVG data URL string (sync)', () => {
    const url = 'https://example.com/image.jpg';
    const result = getBlurDataURL(url);
    
    expect(typeof result).toBe('string');
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });

  it('produces consistent output for same input (deterministic)', () => {
    const url = 'https://example.com/consistent.jpg';
    const r1 = getBlurDataURL(url);
    const r2 = getBlurDataURL(url);
    
    expect(r1).toBe(r2);
  });

  it('produces different output for different inputs', () => {
    const r1 = getBlurDataURL('https://a.com/1.jpg');
    const r2 = getBlurDataURL('https://b.com/2.jpg');
    
    expect(r1).not.toBe(r2);
  });

  it('handles empty string', () => {
    const result = getBlurDataURL('');
    expect(result).toMatch(/^data:image\/svg\+xml;base64,/);
  });
});

describe('getSizesAttr (E3 — responsive sizes)', () => {
  it('returns the input string unchanged', () => {
    const input = '(max-width: 390px) 100vw, 50vw';
    expect(getSizesAttr(input)).toBe(input);
  });
});

describe('IMAGE_SIZES presets (E3)', () => {
  it('has all required presets', () => {
    expect(IMAGE_SIZES.hero).toBeDefined();
    expect(IMAGE_SIZES.card).toBeDefined();
    expect(IMAGE_SIZES.thumbnail).toBeDefined();
    expect(IMAGE_SIZES.fullWidth).toBeDefined();
  });

  it('presets contain valid breakpoint syntax', () => {
    Object.values(IMAGE_SIZES).forEach((sizes) => {
      expect(sizes).toMatch(/max-width/);
      expect(sizes).toMatch(/vw|px/);
    });
  });
});

describe('getFillProps (E3 — fill + sizes props)', () => {
  it('returns fill=true and sizes for known preset', () => {
    const props = getFillProps('card');
    expect(props.fill).toBe(true);
    expect(props.sizes).toBe(IMAGE_SIZES.card);
    expect(props.loading).toBe('lazy');
    expect(props.placeholder).toBe('blur');
  });

  it('returns fill=true and custom sizes string', () => {
    const custom = '(max-width: 600px) 100vw, 300px';
    const props = getFillProps(custom);
    expect(props.sizes).toBe(custom);
  });

  it('respects eager loading override', () => {
    const props = getFillProps('hero', 'eager');
    expect(props.loading).toBe('eager');
  });
});
