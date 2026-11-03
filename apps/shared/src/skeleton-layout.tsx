import { getTranslations } from 'next-intl/server';

export const skeletonLayout = (titleKey: string, skeleton = '1') => {
  if (skeleton === '1') {
    const t = await getTranslations(titleKey);
    return (
      <main id="main" tabIndex="-1" className="mx-auto max-w-2xl px-4 py-6">
        <h1><span className="sr-only">{t(titleKey)}</span></h1>
        <div
          aria-hidden="true"
          className="skeleton-shimmer mt-3 h-2 w-16 rounded bg-zinc-800/60"
        />
      </main>
    );
  }
  // Default layout when not in skeleton mode
  return null;
};