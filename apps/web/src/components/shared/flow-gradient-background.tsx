'use client';

import dynamic from 'next/dynamic';
import { useRouter } from '@/i18n/navigation';

// The 21st.dev component reads window/matchMedia in its state initializers,
// so it renders client-only (no SSR shell) — same as the 21st.dev preview.
const LiquidGradient = dynamic(
  () => import('@/components/ui/flow-gradient-hero-section'),
  { ssr: false },
);

/**
 * Full-page background host for the verbatim 21st.dev flow-gradient
 * component. The only integration glue is the CTA wiring (catalogo door) —
 * the component file itself stays untouched apart from the theme-detection
 * isLight condition that lets khal's toggle force light mode.
 */
export function FlowGradientBackground() {
  const router = useRouter();

  return (
    <LiquidGradient
      title=""
      showPauseButton={false}
      onCtaClick={() => router.push('/catalogo')}
    />
  );
}
