"use client";

import dynamic from 'next/dynamic';

// The 21st.dev component (LiquidGradient) renders only the Three.js canvas
// as a decorative background. No CTA, no pause, no cursor, no title, no footer.
// All interactive elements live in the khal UI layer above.
const LiquidGradient = dynamic(
  () => import('@/components/ui/flow-gradient-hero-section'),
  { ssr: false },
);

/**
 * Full-page decorative gradient background.
 * Renders the 21st.dev LiquidGradient component as a fixed layer behind everything.
 * The component itself is aria-hidden and contains no interactive elements.
 */
export function FlowGradientBackground() {
  return (
    <div aria-hidden="true" className="fixed inset-0 z-0">
      <LiquidGradient />
    </div>
  );
}
