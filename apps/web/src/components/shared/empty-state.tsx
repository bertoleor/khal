export function EmptyState({
  message,
  ctaLabel,
  ctaHref,
}: {
  message: string;
  ctaLabel?: string;
  ctaHref?: string;
}) {
  return (
    <div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.04] p-10 text-center backdrop-blur-sm">
      <p className="text-zinc-400">{message}</p>
      {ctaLabel && ctaHref ? (
        <a
          href={ctaHref}
          className="mt-4 inline-block rounded-full border border-white/20 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400"
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}
