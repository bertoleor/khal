import { Header } from './header';
import SiteFooter from './site-footer';

type SkeletonLayoutProps = {
  namespace: string;
  skeleton: string;
};

export function skeletonLayout(namespace: string, skeleton: string) {
  // Admin skeleton layout for design review
  return (
    <div className="relative min-h-dvh">
      <Header />
      <main id="main" tabIndex={-1} className="mx-auto max-w-2xl px-4 py-6">
        <div className="space-y-6">
          <div className="skeleton-shimmer h-8 w-48 rounded bg-zinc-800/60" />
          <div className="skeleton-shimmer h-32 w-full rounded-lg bg-zinc-800/60" />
          <div className="skeleton-shimmer h-32 w-full rounded-lg bg-zinc-800/60" />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
