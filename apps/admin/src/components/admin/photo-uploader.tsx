'use client';

import { uploadServicePhoto } from '@/lib/actions/services';
import Image from 'next/image';
import { useRef, useState, type ChangeEvent } from 'react';

/**
 * Simple hash-based blur placeholder (local copy to avoid cross-app import).
 * Generates a consistent muted color based on the URL hash.
 */
function getBlurDataURL(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    hash = url.charCodeAt(i) + ((hash << 5) - hash);
  }
  const r = (hash & 0xFF) % 200;
  const g = ((hash >> 8) & 0xFF) % 200;
  const b = ((hash >> 16) & 0xFF) % 200;
  return `data:image/svg+xml;base64,${btoa(`<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><rect width="10" height="10" fill="rgb(${r},${g},${b})"/></svg>`)}`;
}

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
    const formData = new FormData();
    formData.append('file', file);
    const res = await uploadServicePhoto(formData);
    if (res.ok) {
      onPhotoChange(res.data?.url ?? null);
    } else {
      setError(res.error ?? null);
    }
    setBusy(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.06]">
          {url !== null ? (
                      <Image src={url} alt={altLabel} fill sizes="96px" className="object-cover" placeholder="blur" blurDataURL={getBlurDataURL(url)} />
                    ) : (
            <span className="absolute inset-0 flex items-center justify-center px-1 text-center text-[10px] leading-tight text-zinc-400">
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
                      className="rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2 text-sm font-medium text-zinc-300 hover:bg-white/[0.08] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-400 disabled:cursor-not-allowed disabled:opacity-60 min-h-[44px] touch-manipulation"
                    >
                      {busy ? labels.uploading : labels.upload}
                    </button>
                    {url !== null && (
                      <button
                        type="button"
                        onClick={() => onPhotoChange(null)}
                        className="rounded-lg px-3 py-2 text-sm font-medium text-red-400 underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-400 min-h-[44px] touch-manipulation"
                      >
                        {labels.remove}
                      </button>
                    )}
        </div>
      </div>
      {error !== null && (
        <p role="alert" className="text-xs text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
