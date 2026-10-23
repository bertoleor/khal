'use client';

import { useSyncExternalStore } from 'react';

const emptySubscribe = () => () => {};

/**
 * Hydration-safe "did the client finish hydrating?" — the React 19 canonical
 * gate (no effect, no setState, lint-clean under react-hooks/set-state-in-effect).
 *
 * getServerSnapshot=false keeps the hydration render IDENTICAL to the SSR
 * markup; React flips to the client snapshot (true) immediately after
 * hydration completes. Use it to gate theme-derived output: next-themes
 * `resolvedTheme` is undefined during SSR, so the dark default must render
 * until hydration is done (hero fallback palette, toggle icon) — otherwise
 * the first client render disagrees with the server HTML and React 19
 * throws a hydration error (found 2026-10-23 on the home hero).
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
}
