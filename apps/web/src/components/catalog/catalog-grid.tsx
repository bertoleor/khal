import { Link } from "@/i18n/navigation";
import { formatCents } from "@khal/utils";
import type { Service } from "@khal/validations";
import { EmptyState } from "@/components/shared/empty-state";

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
    <div className="mt-6 grid grid-cols-1 gap-4">
      {services.map((service) => (
        <Link
          key={service.id}
          href={`/servicios/${service.id}`}
          className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-transform active:scale-[0.98]"
        >
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-xl font-semibold text-slate-400">
            {service.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-semibold text-slate-900">
              {service.name}
            </h3>
            <p className="text-sm text-slate-500">
              {formatCents(service.price_cents, service.currency_code)}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}