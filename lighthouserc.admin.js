// @ts-check
/** @type {import('@lhci/cli').LHCIConfig} */
module.exports = {
  ci: {
    collect: {
      // Admin panel URLs to audit
      url: [
        'http://localhost:3100/admin',
        'http://localhost:3100/admin/servicios',
        'http://localhost:3100/admin/citas',
        'http://localhost:3100/admin/clientes',
      ],
      // Run 3 times for median
      numberOfRuns: 3,
      // Start dev server for tests
      startServerCommand: 'pnpm dev --filter=apps/admin',
      // Wait for server ready
      settings: {
        headful: false,
        staticDistDir: './apps/admin/.next',
      },
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.9 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.8 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 4000 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
        'interactive': ['error', { maxNumericValue: 3800 }],
      },
    },
    upload: {
      target: 'temporary-public-storage',
    },
  },
};
