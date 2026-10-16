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
    <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {services.map((service) => (
        <Link
          key={service.id}
          href={`/servicios/${service.id}`}
          className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 backdrop-blur-sm transition-all hover:border-white/25 hover:bg-white/[0.07] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 active:scale-[0.98]"
        >
          {service.photo_path ? (
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
              <Image
                src={service.photo_path}
                alt={service.name}
                width={56}
                height={56}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-white/15 bg-white/[0.06] text-lg font-semibold text-emerald-200 transition-colors group-hover:border-emerald-300/40">
              {service.name.slice(0, 1)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate font-semibold text-white">{service.name}</h2>
            <p className="mt-0.5 text-sm font-medium text-emerald-300">
              {formatCents(service.price_cents, service.currency_code)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
