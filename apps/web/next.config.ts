import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@khal/utils', '@khal/types', '@khal/validations'],
  // Before/after service photos live in Supabase Storage (service.photo_path).
  images: {
    remotePatterns: [{ protocol: 'https' as const, hostname: 'epykihchzlbbptrvvawg.supabase.co' }],
    // Modern formats for better compression
    formats: ['image/avif', 'image/webp'],
    // Default sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Minimum cache TTL
    minimumCacheTTL: 31536000, // 1 year
    // Allow dangerous external images for Supabase (already in remotePatterns)
    dangerouslyAllowSVG: false,
    contentDispositionType: 'inline',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Low-RAM build host (4 vCPU, ~3.5GB free with the Hermes fleet resident):
  // cap page-data/static-gen workers (each loads a full copy of the module
  // graph) and shrink webpack memory. Refs: nextjs.org/docs/app/guides/memory-usage
  // and vercel/next.js#95744 (validated combo: cpus 2 + webpackMemoryOptimizations).
  experimental: {
    cpus: 2,
    webpackMemoryOptimizations: true,
  },
};

export default withNextIntl(nextConfig);
