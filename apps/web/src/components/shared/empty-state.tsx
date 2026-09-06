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
    <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-10 text-center">
      <p className="text-slate-500">{message}</p>
      {ctaLabel && ctaHref ? (
        <a
          href={ctaHref}
          className="mt-4 inline-block rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-slate-700"
        >
          {ctaLabel}
        </a>
      ) : null}
    </div>
  );
}