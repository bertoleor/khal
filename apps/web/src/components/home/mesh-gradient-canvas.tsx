'use client';

import { MeshGradient } from '@paper-design/shaders-react';

/**
 * Canvas del fondo interactivo de la home clienta (D10/D12).
 *
 * LICENCIA (gate F1/T-F1.1): el componente original elegido por la owner,
 * flow-gradient-hero-section (21st.dev), figura con licencia "unknown" en la
 * fuente oficial (verificada 2026-10-21) y sin repositorio/licencia del
 * autor → NO es integrable. Se aplica el fallback DECIDIDO en el plan con el
 * mismo look: paper-design MeshGradient (Apache 2.0, LICENSE verificado en
 * github.com/paper-design/shaders) — gradiente líquido + grano, zero-dep
 * (sin three.js, mejor para el gate de perf del iPhone 12 Pro).
 *
 * Look = paleta extraída del bundle aprobado (fondo-demo-khal.html):
 *   uColor1/3/5 = rgb(0.945, 0.353, 0.133) = #F15A22 (naranja-rojo profundo)
 *   uColor2/4/6 = rgb(0.039, 0.055, 0.153) = #0A0E27 (navy oscuro)
 *   uGrainIntensity 0.08, uGradientSize 0.45, uGradientCount 12,
 *   pesos 0.5/1.8 → mapeados a distortion/swirl/grainOverlay calibrados.
 */
export default function MeshGradientCanvas({
  isDark,
  paused,
  offsetX,
  offsetY,
}: {
  isDark: boolean;
  paused: boolean;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <MeshGradient
      // Paleta aprobada: el par naranja/navy alternando, como los 6 uniforms
      // uColor1..6 del bundle original. En claro, mismos tonos levantados
      // (calibración khal: el bundle solo expone la paleta oscura).
      colors={
        isDark
          ? ['#f15a22', '#0a0e27', '#f15a22', '#0a0e27', '#f15a22', '#0a0e27']
          : ['#ffc9a3', '#eef1fa', '#ffb68a', '#e3e8f6', '#ffc9a3', '#eef1fa']
      }
      distortion={0.62}
      swirl={0.42}
      // Grano fino del shader original (uGrainIntensity 0.08): edge-grain +
      // overlay b/w sutil.
      grainMixer={0.3}
      grainOverlay={isDark ? 0.12 : 0.07}
      // Pausa: prefers-reduced-motion o pestaña oculta (T-F1.3). speed=0
      // congela el loop de animación sin destruir el canvas.
      speed={paused ? 0 : 0.32}
      // Interacción puntero/touch: el flujo se corre hacia donde toca la
      // clienta (aproximación del campo uTouchTexture del bundle, vía los
      // offsets nativos del shader — se setean como uniforms, sin re-render
      // del WebGL).
      offsetX={offsetX}
      offsetY={offsetY}
      scale={1.05}
      fit="cover"
      // iOS (D8): densidad calibrada — el shader procesa a lo sumo ~1.4M px
      // (menos que retina completa) y no menos de 1.5x en móvil.
      minPixelRatio={1.5}
      maxPixelCount={1_400_000}
      style={{ width: '100%', height: '100%' }}
    />
  );
}
