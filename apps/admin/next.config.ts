import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin();

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@khal/utils', '@khal/validations'],
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
