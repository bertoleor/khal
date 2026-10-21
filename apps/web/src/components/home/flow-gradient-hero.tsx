'use client';

import { ThemeToggle } from '@/components/shared/theme-toggle';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';

/**
 * Hero de la home clienta — el visual aprobado por la owner + su clienta en
 * 4 iteraciones (docs/ux-flows/fondo-demo-khal.html). Reproduce el look del
 * bundle elegido con el fallback de licencia limpia (MeshGradient, Apache
 * 2.0 — ver mesh-gradient-canvas.tsx para el gate de licencia completo).
 *
 * Estructura del demo aprobado: kicker mono arriba-izquierda · wordmark
 * "Khal" en TAN Nightingale centrado · CTA "Agendá tu turno" en UNA línea
 * (white-space: nowrap, fix de la iteración 1) · toggle tipográfico
 * arriba-derecha. El pause-btn nativo NO va (iteración 4): lo cubre
 * prefers-reduced-motion.
 *
 * Code-splitting (T-F1.4): el canvas del shader viaja en un chunk lazy —
 * solo lo descarga la home, después del primer paint (el HTML del hero con
 * wordmark+CTA es SSR; el fallback CSS de abajo cubre el hueco).
 */

// Look aprobado, extraído de los uniforms del bundle (uColor1..6).
const FALLBACK_DARK =
  'radial-gradient(120% 90% at 20% 15%, rgba(241,90,34,0.55) 0%, rgba(241,90,34,0) 55%), radial-gradient(130% 110% at 80% 85%, rgba(10,14,39,0.9) 0%, rgba(10,14,39,0.4) 60%), linear-gradient(160deg, #0a0e27 0%, #10142e 55%, #f15a22 160%)';
const FALLBACK_LIGHT =
  'radial-gradient(120% 90% at 20% 15%, rgba(255,201,163,0.9) 0%, rgba(255,201,163,0) 55%), radial-gradient(130% 110% at 80% 85%, rgba(227,232,246,0.95) 0%, rgba(227,232,246,0.5) 60%), linear-gradient(160deg, #eef1fa 0%, #e3e8f6 55%, #ffc9a3 160%)';

const MeshGradientCanvas = lazy(() => import('@/components/home/mesh-gradient-canvas'));

const MAX_OFFSET = 0.18;
const clamp = (v: number) => Math.max(-MAX_OFFSET, Math.min(MAX_OFFSET, v));

export function FlowGradientHero() {
  const { resolvedTheme } = useTheme();
  const isDark = resolvedTheme !== 'light';
  const t = useTranslations('hero');

  const [reducedMotion, setReducedMotion] = useState(false);
  const [tabPaused, setTabPaused] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const target = useRef({ x: 0, y: 0 });
  const raf = useRef<number | null>(null);

  // prefers-reduced-motion: la clienta pidió menos movimiento → pausa total
  // del flujo y sin respuesta al puntero (T-F1.3).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReducedMotion(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Pestaña no visible → pausa (ahorro de batería del teléfono, T-F1.3).
  useEffect(() => {
    const onVisibility = () => setTabPaused(document.hidden);
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  // El flujo PERSIGUE al puntero/touch con lerp (rAF): movimiento orgánico,
  // sin saltos. setState por frame con delta mínimo — el shader solo setea
  // uniforms, no re-crea el WebGL.
  useEffect(() => {
    if (reducedMotion) return;
    let last = { x: 0, y: 0 };
    const tick = () => {
      const next = {
        x: last.x + (target.current.x - last.x) * 0.06,
        y: last.y + (target.current.y - last.y) * 0.06,
      };
      if (Math.abs(next.x - last.x) > 0.0004 || Math.abs(next.y - last.y) > 0.0004) {
        last = next;
        setPointer(next);
      }
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
    };
  }, [reducedMotion]);

  // Pointer events unifican mouse + touch (el bundle original registraba
  // pointermove/touchmove/pointerdown — mismo contrato).
  const onPointer = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (reducedMotion) return;
      const rect = event.currentTarget.getBoundingClientRect();
      target.current = {
        x: clamp(((event.clientX - rect.left) / rect.width - 0.5) * 0.5),
        y: clamp(((event.clientY - rect.top) / rect.height - 0.5) * 0.5),
      };
    },
    [reducedMotion]
  );

  return (
    <section
      onPointerMove={onPointer}
      onPointerDown={onPointer}
      className="relative h-dvh min-h-[560px] w-full overflow-hidden"
      aria-label={t('sectionLabel')}
    >
      {/* Fallback CSS (pre-canvas, sin WebGL) — misma paleta, estático. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{ background: isDark ? FALLBACK_DARK : FALLBACK_LIGHT }}
      />
      <div aria-hidden="true" className="absolute inset-0">
        <Suspense fallback={null}>
          <MeshGradientCanvas
            isDark={isDark}
            paused={reducedMotion || tabPaused}
            offsetX={pointer.x}
            offsetY={pointer.y}
          />
        </Suspense>
      </div>

      {/* Kicker (demo: #khal-kicker) — sin caja, mono chiquito. Marca
          constante, igual en ambos idiomas. */}
      <p className="absolute left-4 top-5 z-10 font-mono-khal text-[10px] uppercase tracking-[3px] text-white/75 light:text-[#1a1a2e]/75 sm:left-6 sm:top-6">
        estudio de pestañas
      </p>

      {/* Toggle tipográfico (demo: #khal-toggle) — arriba a la derecha,
          sin caja. */}
      <div className="absolute right-4 top-4 z-10 sm:right-6 sm:top-5">
        <ThemeToggle />
      </div>

      {/* Wordmark + CTA — el corazón del visual aprobado. En claro el
          overlay pasa a tinta oscura (como el CTA del demo: #1a1a2e). */}
      <div className="pointer-events-none absolute inset-0 z-10 flex flex-col items-center justify-center">
        <h1 className="select-none font-wordmark text-[clamp(2.5rem,10vw,7rem)] font-bold leading-none tracking-[-0.02em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.35)] light:text-[#1a1a2e] light:drop-shadow-[0_2px_24px_rgba(255,255,255,0.4)]">
          Khal
        </h1>
        <a
          href="#servicios"
          className="pointer-events-auto mt-10 whitespace-nowrap border border-white/30 bg-white/10 px-10 py-4 text-sm font-semibold uppercase tracking-[0.05em] text-white backdrop-blur-md transition-transform duration-300 hover:scale-[1.03] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white active:scale-[0.98] light:border-[#1a1a2e]/30 light:bg-white/40 light:text-[#1a1a2e] light:focus-visible:outline-[#1a1a2e]"
          style={{ borderRadius: 30, minHeight: 48 }}
        >
          {t('cta')}
        </a>
      </div>
    </section>
  );
}
