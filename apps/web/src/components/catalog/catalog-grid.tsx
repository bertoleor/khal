import { EmptyState } from '@/components/shared/empty-state';
import { Link } from '@/i18n/navigation';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import Image from 'next/image';

export function CatalogGrid({
  services,
  emptyMessage,
}: {
  services: Service[];
  emptyMessage: string;
}) {
  if (services.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
      {services.map((service) => (
        <Link
          key={service.id}
          href={`/servicios/${service.id}`}
          className="group flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:scale-[0.98] sm:flex-row sm:items-start sm:gap-4"
        >
          {service.photo_path ? (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl sm:h-20 sm:w-20">
              <Image
                src={service.photo_path}
                alt={service.name}
                width={80}
                height={80}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg font-semibold text-emerald-200 transition-colors group-hover:border-emerald-300/40 sm:h-20 sm:w-20 sm:text-xl">
              {service.name.slice(0, 1)}
            </div>
          )}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <h2 className="min-w-0 truncate font-semibold text-white">{service.name}</h2>
              <span className="shrink-0 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-sm font-semibold text-emerald-300">
                {formatCents(service.price_cents, service.currency_code)}
              </span>
            </div>
            {service.description ? (
              <p className="line-clamp-2 text-sm text-zinc-400">{service.description}</p>
            ) : null}
            <div className="flex items-center justify-between gap-2 border-t border-white/5 pt-2">
              <span className="text-xs text-zinc-500">{service.duration_minutes} min</span>
              <span className="text-sm font-medium text-emerald-300 transition-colors group-hover:text-emerald-200">
                Reservar →
              </span>
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
