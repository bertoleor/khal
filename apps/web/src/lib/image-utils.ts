import { unstable_cache } from 'next/cache';

/**
 * Generates a low-quality base64 data URL for use as a blur placeholder.
 * Uses a simple solid color based on the URL hash for consistent, fast placeholders.
 * Synchronous version for use with Next.js Image blurDataURL prop.
 */
export function getBlurDataURL(url: string): string {
  // Simple hash-based color for consistent placeholder
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Generate a muted color from hash
  const r = (hash & 0xFF) % 200;
  const g = ((hash >> 8) & 0xFF) % 200;
  const b = ((hash >> 16) & 0xFF) % 200;
  
  // Return a simple SVG data URL (synchronous)
  const color = `rgb(${r}, ${g}, ${b})`;
  return `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="${color}"/></svg>`
  ).toString('base64')}`;
}

/**
 * Generates responsive sizes attribute for common breakpoints.
 * Usage: sizes={getSizesAttr('(max-width: 390px) 100vw, 50vw')}
 */
export function getSizesAttr(sizes: string): string {
  return sizes;
}

/**
 * Common sizes presets for common layouts
 */
export const IMAGE_SIZES = {
  hero: '(max-width: 390px) 100vw, (max-width: 768px) 100vw, 1200px',
  card: '(max-width: 390px) 50vw, 320px',
  thumbnail: '(max-width: 390px) 25vw, 160px',
  fullWidth: '(max-width: 390px) 100vw, (max-width: 768px) 100vw, 1200px',
} as const;

/**
 * Generates fill + sizes props for responsive images
 */
export function getFillProps(
  sizes: keyof typeof IMAGE_SIZES | string = 'card',
  loading: 'lazy' | 'eager' = 'lazy'
) {
  const sizesValue = typeof sizes === 'string' && sizes in IMAGE_SIZES 
    ? IMAGE_SIZES[sizes as keyof typeof IMAGE_SIZES] 
    : sizes;
  
  return {
    fill: true,
    sizes: sizesValue,
    loading,
    placeholder: 'blur' as const,
  };
}
