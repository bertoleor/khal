// NEW: Shared skeleton presentation component (khal-design-system T3)
/**
 * Skeleton presentation mode for design review.
 * Rendered when ?skeleton=1 query param is present.
 * Keeps UI consistency across catalog, conocenos, and pago pages
 * without revealing actual content during design reviews.
 */
import { useSearchParams } from 'next/navigation';
import { Header } from '@/components/shared/header';
import SiteFooter from '@/components/shared/site-footer';

export function useSkeletonPresentation() {
  const params = useSearchParams();
  const skeleton = params.get('skeleton');

  // If skeleton mode is active, return presentation-only layout
  if (skeleton === '1') {
    return {
      mode: 'skeleton',
      render: () => (
        <div className="relative flex min-h-dvh flex-col">
          <Header />
          <main
            id="main"
            tabIndex={-1}
            className="mx-auto w-full max-w-lg flex-1 px-5 pb-16"
          >
            <div
              aria-hidden="true"
              className="skeleton-shimmer mt-3 h-2 w-16 rounded bg-zinc-800/60"
            ></div>
            <div
              aria-hidden="true"
              className="skeleton-shimmer mt-3 h-5 w-32 rounded bg-zinc-800"
            ></div>
            <div className="mt-3 grid grid-cols-2 gap-[9px]">
              {[0, 1, 2, 3].map((cardIndex) => (
                <div key={cardIndex} className="rounded bg-zinc-800/50 h-24">
                  {/* placeholder card */}
                </div>
              ))}
            </div>
          </main>
        </div>
      ),
    };
  }

  // Normal mode - return null so the calling page renders its content
  return { mode: 'normal', render: () => null };
};

export default useSkeletonPresentation;
