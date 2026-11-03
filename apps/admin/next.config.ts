import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin();

/** @type {import("next").NextConfig} */
const nextConfig = {
  transpilePackages: ["@khal/utils", "@khal/validations"],
  // Service photos live in Supabase Storage (service.photo_path) and render
  // through next/image in the admin catalog manager.
  images: {
    remotePatterns: [{ protocol: "https" as const, hostname: "epykihchzlbbptrvvawg.supabase.co" }],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Low-RAM build host (4 vCPU, ~3.5GB free with the Hermes fleet resident):
  // cap page-data/static-gen workers (each loads a full copy of the module
  // graph) and shrink webpack memory. Refs: nextjs.org/docs/app/guides/memory-usage
  // and vercel/next.js#95744 (validated combo: cpus 2 + webpackMemoryOptimizations).
  experimental: {
    cpus: 2,
    webpackMemoryOptimizations: true,
    // Performance: optimize package imports
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
  },
  // Performance: compress responses
  compress: true,
  // Performance: enable React strict mode for development
  reactStrictMode: true,
  // Performance: SWC minification (enabled by default in Next 16)
  swcMinify: true,
  // Performance: optimize fonts
  optimizeFonts: true,
};

export default withNextIntl(nextConfig);
