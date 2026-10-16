'use client';

import { useRef, useState, type ChangeEvent } from 'react';
import Image from 'next/image';
import { uploadServicePhoto } from '@/lib/actions/services';

/**
 * Catalog photo uploader (khal-admin-100-operable T4).
 *
 * Picks a file -> server action validates (image MIME, <= 4MB) and uploads
 * to the `service-photos` Supabase Storage bucket -> returns the public URL
 * which becomes the service's photo_path. Preview + remove included; the
 * parent owns the value (controlled), this component never touches the
 * services table.
 */
export function PhotoUploader({
  url,
  altLabel,
  onPhotoChange,
  labels,
}: {
  url: string | null;
  altLabel: string;
  onPhotoChange: (url: string | null) => void;
  labels: {
    upload: string;
    uploading: string;
    remove: string;
    empty: string;
  };
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    // Allow re-picking the same file after an error by clearing the value.
    e.target.value = '';
    if (!file) return;
    setBusy(true);
    setError(null);
    const res = await uploadServicePhoto(file);
    if (res.ok) {
      onPhotoChange(res.data.url);
    } else {
      setError(res.error);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
          {url !== null ? (
            <Image
              src={url}
              alt={altLabel}
              fill
              sizes="96px"
              className="object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[10px] leading-tight text-slate-500">
              {labels.empty}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/avif,image/gif"
            className="hidden"
            onChange={onPick}
            aria-label={labels.upload}
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? labels.uploading : labels.upload}
          </button>
          {url !== null && (
            <button
              type="button"
              onClick={() => onPhotoChange(null)}
              className="rounded-lg px-1 py-0.5 text-left text-xs font-medium text-red-600 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              {labels.remove}
            </button>
          )}
        </div>
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
