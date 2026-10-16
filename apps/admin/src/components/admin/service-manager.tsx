'use client';

import { PhotoUploader } from '@/components/admin/photo-uploader';
import { RichTextEditor } from '@/components/admin/rich-text-editor';
import {
  bulkIncrease,
  createService,
  deleteService,
  toggleVisibility,
  updateService,
} from '@/lib/actions/services';
import { serviceFormSchema } from '@/lib/schemas';
import { formatCents } from '@khal/utils';
import type { Service } from '@khal/validations';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type FormEvent } from 'react';

/**
 * Catalog manager (khal-admin-100-operable T4).
 *
 * The full operable admin surface for services: live list from the DB
 * (passed by the server page), search + sort, create/edit dialog with the
 * Tiptap rich text editor and photo upload, pesos-first inputs (the owner
 * thinks in pesos — cents only exist at the boundary), inline zod errors,
 * visibility toggle, soft delete, and a bulk +10% price action.
 *
 * All mutations go through the server actions (requireAuth + zod + RLS).
 * Local state is updated optimistically from each action's result.
 */

type FormState = {
  name: string;
  price: string; // pesos (25.000 -> 2500000 cents at the boundary)
  duration: string; // minutes
  buffer: string; // minutes
  description: string; // rich text HTML
  photo_path: string | null;
  is_visible: boolean;
  sort_order: string;
  deposit_mode: 'none' | 'fixed' | 'percentage';
  deposit_amount: string; // pesos (fixed) | percent (percentage)
};

type SortKey = 'order' | 'name' | 'price';

const DEPOSIT_NONE = 'none' as const;
const DEPOSIT_FIXED = 'fixed' as const;
const DEPOSIT_PERCENTAGE = 'percentage' as const;

/** Accepts "12.500" or "12,500,50"-ish input; NaN when unparseable. */
function toNumber(raw: string): number {
  const cleaned = raw.trim().replace(/\./g, '').replace(',', '.');
  if (cleaned === '') return Number.NaN;
  return Number(cleaned);
}

function serviceToForm(s: Service): FormState {
  const mode = (s.deposit_mode ?? DEPOSIT_NONE) as FormState['deposit_mode'];
  return {
    name: s.name,
    price: (s.price_cents / 100).toString(),
    duration: s.duration_minutes.toString(),
    buffer: (s.buffer_minutes ?? 0).toString(),
    description: s.description ?? '',
    photo_path: s.photo_path ?? null,
    is_visible: s.is_visible,
    sort_order: s.sort_order.toString(),
    deposit_mode: mode,
    deposit_amount:
      mode === DEPOSIT_FIXED
        ? ((s.deposit_fixed_cents ?? 0) / 100).toString()
        : mode === DEPOSIT_PERCENTAGE
          ? ((s.deposit_percentage_bp ?? 0) / 100).toString()
          : '',
  };
}

function emptyForm(nextSort: number): FormState {
  return {
    name: '',
    price: '',
    duration: '60',
    buffer: '15',
    description: '',
    photo_path: null,
    is_visible: true,
    sort_order: nextSort.toString(),
    deposit_mode: DEPOSIT_PERCENTAGE,
    deposit_amount: '30',
  };
}

export function ServiceManager({ initialServices }: { initialServices: Service[] }) {
  const t = useTranslations('Admin.services');
  const router = useRouter();

  const [services, setServices] = useState<Service[]>(initialServices);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('order');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const [dialog, setDialog] = useState<
    { mode: 'create' } | { mode: 'edit'; service: Service } | null
  >(null);
  const [form, setForm] = useState<FormState | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list =
      q === '' ? [...services] : services.filter((s) => s.name.toLowerCase().includes(q));
    switch (sort) {
      case 'name':
        list.sort((a, b) => a.name.localeCompare(b.name, 'es'));
        break;
      case 'price':
        list.sort((a, b) => b.price_cents - a.price_cents);
        break;
      default:
        list.sort((a, b) => a.sort_order - b.sort_order);
    }
    return list;
  }, [services, query, sort]);

  function openCreate() {
    const nextSort = services.reduce((max, s) => Math.max(max, s.sort_order), 0) + 1;
    setForm(emptyForm(nextSort));
    setErrors({});
    setBanner(null);
    setDialog({ mode: 'create' });
  }

  function openEdit(service: Service) {
    setForm(serviceToForm(service));
    setErrors({});
    setBanner(null);
    setDialog({ mode: 'edit', service });
  }

  function closeDialog() {
    setDialog(null);
    setForm(null);
    setErrors({});
    setBanner(null);
  }

  function patchForm(patch: Partial<FormState>) {
    setForm((prev) => (prev === null ? prev : { ...prev, ...patch }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (form === null || dialog === null) return;

    const price = toNumber(form.price);
    const duration = toNumber(form.duration);
    const buffer = toNumber(form.buffer);
    const sortOrder = toNumber(form.sort_order);
    const depositAmount = toNumber(form.deposit_amount);

    const candidate = {
      name: form.name,
      description: form.description === '' ? null : form.description,
      price_cents: Number.isFinite(price) ? Math.round(price * 100) : Number.NaN,
      currency_code: 'ARS',
      duration_minutes: duration,
      buffer_minutes: Number.isFinite(buffer) ? buffer : Number.NaN,
      is_visible: form.is_visible,
      sort_order: Number.isFinite(sortOrder) ? Math.round(sortOrder) : Number.NaN,
      photo_path: form.photo_path,
      deposit_mode:
        form.deposit_mode === DEPOSIT_NONE ? null : (form.deposit_mode as 'fixed' | 'percentage'),
      deposit_fixed_cents:
        form.deposit_mode === DEPOSIT_FIXED && Number.isFinite(depositAmount)
          ? Math.round(depositAmount * 100)
          : form.deposit_mode === DEPOSIT_FIXED
            ? Number.NaN
            : null,
      deposit_percentage_bp:
        form.deposit_mode === DEPOSIT_PERCENTAGE && Number.isFinite(depositAmount)
          ? Math.round(depositAmount * 100)
          : form.deposit_mode === DEPOSIT_PERCENTAGE
            ? Number.NaN
            : null,
    };

    const parsed = serviceFormSchema.safeParse(candidate);
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === 'string' && fieldErrors[key] === undefined) {
          fieldErrors[key] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setBusy(true);
    setBanner(null);
    const res =
      dialog.mode === 'create'
        ? await createService(parsed.data)
        : await updateService(dialog.service.id, parsed.data);
    setBusy(false);

    if (!res.ok) {
      setBanner(res.error);
      return;
    }

    const saved = res.data;
    setServices((prev) =>
      dialog.mode === 'create'
        ? [...prev, saved].sort((a, b) => a.sort_order - b.sort_order)
        : prev.map((s) => (s.id === saved.id ? saved : s))
    );
    closeDialog();
    router.refresh();
  }

  async function onToggle(service: Service) {
    setListError(null);
    const res = await toggleVisibility(service.id, !service.is_visible);
    if (res.ok) {
      setServices((prev) => prev.map((s) => (s.id === service.id ? res.data : s)));
    } else {
      setListError(res.error);
    }
  }

  async function onDelete(service: Service) {
    if (!window.confirm(t('confirmDelete', { name: service.name }))) return;
    setListError(null);
    const res = await deleteService(service.id);
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== service.id));
      setSelected((prev) => {
        const next = new Set(prev);
        next.delete(service.id);
        return next;
      });
    } else {
      setListError(res.error);
    }
  }

  async function onBulkIncrease() {
    if (selected.size === 0) return;
    setListError(null);
    const res = await bulkIncrease([...selected], 1000);
    if (res.ok) {
      // Same formula as the action (additive percentage on cents).
      setServices((prev) =>
        prev.map((s) =>
          selected.has(s.id)
            ? { ...s, price_cents: s.price_cents + Math.round((s.price_cents * 1000) / 10000) }
            : s
        )
      );
      setSelected(new Set());
    } else {
      setListError(res.error);
    }
  }

  function toggleSelected(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const inputClass =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-500';
  const errorClass = 'mt-1 text-xs text-red-600';

  const formDialog =
    form !== null && dialog !== null ? (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="service-dialog-title"
          className="max-h-[92dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-white p-6 shadow-xl sm:rounded-2xl"
        >
          <h2 id="service-dialog-title" className="mb-4 text-lg font-semibold text-slate-900">
            {dialog.mode === 'create' ? t('dialog.newTitle') : t('dialog.editTitle')}
          </h2>

          {banner !== null && (
            <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              {banner}
            </p>
          )}

          <form className="space-y-4" onSubmit={onSubmit} noValidate>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="svc-name">
                {t('fields.name')}
              </label>
              <input
                id="svc-name"
                type="text"
                required
                className={inputClass}
                value={form.name}
                onChange={(e) => patchForm({ name: e.target.value })}
              />
              {errors.name !== undefined && <p className={errorClass}>{errors.name}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="svc-price"
                >
                  {t('fields.price')}
                </label>
                <input
                  id="svc-price"
                  type="text"
                  inputMode="decimal"
                  required
                  className={inputClass}
                  value={form.price}
                  onChange={(e) => patchForm({ price: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">{t('fields.priceHint')}</p>
                {errors.price_cents !== undefined && (
                  <p className={errorClass}>{errors.price_cents}</p>
                )}
              </div>
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="svc-duration"
                >
                  {t('fields.duration')}
                </label>
                <input
                  id="svc-duration"
                  type="text"
                  inputMode="numeric"
                  required
                  className={inputClass}
                  value={form.duration}
                  onChange={(e) => patchForm({ duration: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">{t('fields.durationHint')}</p>
                {errors.duration_minutes !== undefined && (
                  <p className={errorClass}>{errors.duration_minutes}</p>
                )}
              </div>
            </div>

            <div>
              <label
                className="mb-1 block text-sm font-medium text-slate-700"
                htmlFor="svc-description"
              >
                {t('fields.description')}
              </label>
              <RichTextEditor
                key={dialog.mode === 'edit' ? dialog.service.id : 'create'}
                value={form.description}
                ariaLabel={t('fields.description')}
                labels={{
                  bold: t('editor.bold'),
                  italic: t('editor.italic'),
                  underline: t('editor.underline'),
                  strike: t('editor.strike'),
                  bulletList: t('editor.bulletList'),
                  orderedList: t('editor.orderedList'),
                  undo: t('editor.undo'),
                  redo: t('editor.redo'),
                }}
                onChange={(html) => patchForm({ description: html })}
              />
            </div>

            <div>
              <span className="mb-1 block text-sm font-medium text-slate-700">
                {t('fields.photo')}
              </span>
              <PhotoUploader
                url={form.photo_path}
                altLabel={t('fields.photo')}
                labels={{
                  upload: t('photo.upload'),
                  uploading: t('photo.uploading'),
                  remove: t('photo.remove'),
                  empty: t('photo.empty'),
                }}
                onPhotoChange={(url) => patchForm({ photo_path: url })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="svc-deposit-mode"
                >
                  {t('fields.deposit')}
                </label>
                <select
                  id="svc-deposit-mode"
                  className={inputClass}
                  value={form.deposit_mode}
                  onChange={(e) =>
                    patchForm({ deposit_mode: e.target.value as FormState['deposit_mode'] })
                  }
                >
                  <option value={DEPOSIT_NONE}>{t('deposit.none')}</option>
                  <option value={DEPOSIT_FIXED}>{t('deposit.fixed')}</option>
                  <option value={DEPOSIT_PERCENTAGE}>{t('deposit.percentage')}</option>
                </select>
              </div>
              {form.deposit_mode !== DEPOSIT_NONE && (
                <div>
                  <label
                    className="mb-1 block text-sm font-medium text-slate-700"
                    htmlFor="svc-deposit-amount"
                  >
                    {form.deposit_mode === DEPOSIT_FIXED
                      ? t('deposit.fixedAmount')
                      : t('deposit.percentageAmount')}
                  </label>
                  <input
                    id="svc-deposit-amount"
                    type="text"
                    inputMode="decimal"
                    required
                    className={inputClass}
                    value={form.deposit_amount}
                    onChange={(e) => patchForm({ deposit_amount: e.target.value })}
                  />
                  {errors.deposit_fixed_cents !== undefined && (
                    <p className={errorClass}>{errors.deposit_fixed_cents}</p>
                  )}
                  {errors.deposit_percentage_bp !== undefined && (
                    <p className={errorClass}>{errors.deposit_percentage_bp}</p>
                  )}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="mb-1 block text-sm font-medium text-slate-700"
                  htmlFor="svc-buffer"
                >
                  {t('fields.buffer')}
                </label>
                <input
                  id="svc-buffer"
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  value={form.buffer}
                  onChange={(e) => patchForm({ buffer: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">{t('fields.bufferHint')}</p>
                {errors.buffer_minutes !== undefined && (
                  <p className={errorClass}>{errors.buffer_minutes}</p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="svc-sort">
                  {t('fields.sort')}
                </label>
                <input
                  id="svc-sort"
                  type="text"
                  inputMode="numeric"
                  className={inputClass}
                  value={form.sort_order}
                  onChange={(e) => patchForm({ sort_order: e.target.value })}
                />
                <p className="mt-1 text-xs text-slate-500">{t('fields.sortHint')}</p>
                {errors.sort_order !== undefined && (
                  <p className={errorClass}>{errors.sort_order}</p>
                )}
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm text-slate-700">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-slate-300"
                checked={form.is_visible}
                onChange={(e) => patchForm({ is_visible: e.target.checked })}
              />
              {t('fields.visible')}
            </label>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={closeDialog}
                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600"
              >
                {t('actions.cancel')}
              </button>
              <button
                type="submit"
                disabled={busy}
                className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {busy
                  ? t('actions.saving')
                  : dialog.mode === 'create'
                    ? t('actions.create')
                    : t('actions.save')}
              </button>
            </div>
          </form>
        </div>
      </div>
    ) : null;

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center gap-2">
          <div className="min-w-40 flex-1 sm:max-w-64">
            <label className="sr-only" htmlFor="svc-search">
              {t('search.label')}
            </label>
            <input
              id="svc-search"
              type="search"
              className={inputClass}
              placeholder={t('search.placeholder')}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
          <div>
            <label className="sr-only" htmlFor="svc-sort">
              {t('sort.label')}
            </label>
            <select
              id="svc-sort"
              className={`${inputClass} w-auto`}
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
            >
              <option value="order">{t('sort.order')}</option>
              <option value="name">{t('sort.name')}</option>
              <option value="price">{t('sort.price')}</option>
            </select>
          </div>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
        >
          {t('new')}
        </button>
      </div>

      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-slate-500">{t('count', { count: filtered.length })}</p>
        {selected.size > 0 && (
          <button
            type="button"
            onClick={onBulkIncrease}
            className="rounded-full border border-slate-900 px-3 py-1 text-xs font-medium text-slate-900 hover:bg-slate-900 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900"
          >
            {t('bulkIncrease', { count: selected.size })}
          </button>
        )}
      </div>

      {listError !== null && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {listError}
        </p>
      )}

      <div className="mt-4 space-y-3">
        {filtered.map((service) => (
          <article
            key={service.id}
            className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <input
              type="checkbox"
              aria-label={service.name}
              checked={selected.has(service.id)}
              onChange={() => toggleSelected(service.id)}
              className="mt-12 h-4 w-4 shrink-0 rounded border-slate-300"
            />
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
              {service.photo_path !== undefined ? (
                <Image
                  src={service.photo_path}
                  alt={service.name}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-[10px] text-slate-500">
                  {t('photo.empty')}
                </span>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="truncate font-medium text-slate-900">{service.name}</h2>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    service.is_visible
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {service.is_visible ? t('visible') : t('hidden')}
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-600">
                {formatCents(service.price_cents, service.currency_code)} ·{' '}
                {t('duration', { count: service.duration_minutes })}
                {service.deposit_mode === 'percentage' &&
                  service.deposit_percentage_bp !== undefined && (
                    <> · {t('deposit.badge', { count: service.deposit_percentage_bp / 100 })}</>
                  )}
                {service.deposit_mode === 'fixed' && service.deposit_fixed_cents !== undefined && (
                  <>
                    {' '}
                    ·{' '}
                    {t('deposit.fixedBadge', {
                      amount: formatCents(service.deposit_fixed_cents, service.currency_code),
                    })}
                  </>
                )}
              </p>
              {service.description !== undefined && service.description !== '' && (
                <div
                  className="prose-sm mt-2 max-w-none text-slate-600 [&_p]:m-0 [&_ul]:my-1 [&_ol]:my-1"
                  dangerouslySetInnerHTML={{ __html: service.description }}
                />
              )}
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEdit(service)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
                >
                  {t('actions.edit')}
                </button>
                <button
                  type="button"
                  onClick={() => void onToggle(service)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
                >
                  {service.is_visible ? t('actions.hide') : t('actions.show')}
                </button>
                <button
                  type="button"
                  onClick={() => void onDelete(service)}
                  className="rounded-full border border-slate-300 px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:border-red-300 hover:bg-red-50 hover:text-red-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700"
                >
                  {t('actions.delete')}
                </button>
              </div>
            </div>
          </article>
        ))}

        {filtered.length === 0 && (
          <p className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            {t('empty')}
          </p>
        )}
      </div>

      {formDialog}
    </div>
  );
}
