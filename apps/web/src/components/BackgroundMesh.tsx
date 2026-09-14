"use client";

import React, { useEffect, useRef } from "react";

// ---------------------------------------------------------------------------
// CONFIGURACIÓN — ajustar aquí sin tocar el resto del componente
// Efecto de fundo EROS, adaptado a blanco y negro: fondo NEGRO, aura BLANCA.
// ---------------------------------------------------------------------------

// Pares de blancos/grises que conviven. Se muestran de a una por vez
// con crossfade suave entre ellas.
const COLOR_PAIRS: [RGB, RGB][] = [
  [{ r: 255, g: 255, b: 255 }, { r: 220, g: 220, b: 220 }], // blanco + gris claro
  [{ r: 240, g: 240, b: 240 }, { r: 200, g: 200, b: 200 }], // gris muy claro + gris
  [{ r: 250, g: 250, b: 250 }, { r: 235, g: 235, b: 235 }], // blanco + blanco suave
  [{ r: 230, g: 230, b: 230 }, { r: 255, g: 255, b: 255 }], // gris + blanco
];

const FRAMES_PER_PAIR = 420; // frames que dura cada par (~7s a 60fps). Subir = más lento
const FADE_FRAMES     = 90;  // frames del crossfade entre pares (~1.5s). Bajar = corte más abrupto
const PARTICLE_SPEED  = 0.55; // velocidad de movimiento. 0 = estático, 1 = rápido
const BREATH_AMOUNT   = 0.12; // cuánto pulsa el tamaño (0 = sin respiración, 0.2 = mucho)
const BREATH_SPEED    = 0.003; // velocidad del pulso
const BASE_OPACITY    = 0.5; // opacidad máxima en el centro del gradiente
const VEIL_OPACITY    = 0.0; // velo final que suaviza la mezcla (0 = sin velo, mantiene negro puro)
const BG_COLOR        = "#000000"; // color base del canvas: NEGRO

// ---------------------------------------------------------------------------

interface RGB { r: number; g: number; b: number }

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  baseSize: number;
  size: number;
  color: RGB;
  tick: number;
}

function createParticle(
  width: number,
  height: number,
  color: RGB,
  speed: number
): Particle {
  const baseSize =
    Math.max(width * 0.55, 500) + Math.random() * width * 0.35;
  return {
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * speed,
    vy: (Math.random() - 0.5) * speed,
    baseSize,
    size: baseSize,
    color,
    tick: Math.random() * 100,
  };
}

/**
 * Calcula cuánta opacidad tiene cada par en el frame actual.
 * Solo 1 par (o 2 durante el crossfade) están visibles a la vez.
 */
function getPairOpacities(globalTick: number, pairCount: number): number[] {
  const totalCycle = FRAMES_PER_PAIR * pairCount;
  const t = globalTick % totalCycle;
  const opacities = new Array<number>(pairCount).fill(0);

  for (let i = 0; i < pairCount; i++) {
    const start = i * FRAMES_PER_PAIR;
    const local = t - start;
    if (local < 0 || local >= FRAMES_PER_PAIR) continue;

    let alpha: number;
    if (local < FADE_FRAMES) {
      alpha = local / FADE_FRAMES;
    } else if (local > FRAMES_PER_PAIR - FADE_FRAMES) {
      alpha = (FRAMES_PER_PAIR - local) / FADE_FRAMES;
    } else {
      alpha = 1;
    }
    opacities[i] = alpha;
  }

  // Solapamiento circular: el último par hace crossfade con el primero
  const lastStart = (pairCount - 1) * FRAMES_PER_PAIR;
  const lastLocal = t - lastStart;
  if (lastLocal > FRAMES_PER_PAIR - FADE_FRAMES) {
    const bleed = (lastLocal - (FRAMES_PER_PAIR - FADE_FRAMES)) / FADE_FRAMES;
    opacities[0] = Math.max(opacities[0], bleed);
  }

  return opacities;
}

// Animation helpers defined outside to avoid nesting issues
function initCanvas(canvas: HTMLCanvasElement, speed: number) {
  const w = globalThis.innerWidth;
  const h = globalThis.innerHeight;
  canvas.width = w;
  canvas.height = h;
  const p = COLOR_PAIRS.flatMap((pair) =>
    pair.map((color) => createParticle(w, h, color, speed))
  );
  return { w, h, p };
}

function updateAndDrawParticle(
  ctx: CanvasRenderingContext2D,
  p: Particle,
  color: RGB,
  pairAlpha: number,
  w: number,
  h: number
) {
  p.tick += BREATH_SPEED;
  p.size = p.baseSize + Math.sin(p.tick) * p.baseSize * BREATH_AMOUNT;
  p.x += p.vx;
  p.y += p.vy;
  if (p.x < -p.size) p.x = w + p.size;
  if (p.x > w + p.size) p.x = -p.size;
  if (p.y < -p.size) p.y = h + p.size;
  if (p.y > h + p.size) p.y = -p.size;

  const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
  const { r, g, b } = color;
  grad.addColorStop(0, `rgba(${r},${g},${b},${BASE_OPACITY * pairAlpha})`);
  grad.addColorStop(0.5, `rgba(${r},${g},${b},${0.2 * pairAlpha})`);
  grad.addColorStop(1, `rgba(${r},${g},${b},0)`);

  ctx.beginPath();
  ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function drawParticles(
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  opacities: number[],
  width: number,
  height: number
) {
  COLOR_PAIRS.forEach((pair, pairIndex) => {
    const pairAlpha = opacities[pairIndex];
    if (pairAlpha >= 0.01) {
      pair.forEach((color, colorIndex) => {
        const p = particles[pairIndex * 2 + colorIndex];
        updateAndDrawParticle(ctx, p, color, pairAlpha, width, height);
      });
    }
  });
}

export default function BackgroundMesh(): React.JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reducedMotion = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const speed = reducedMotion ? 0 : PARTICLE_SPEED;

    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let globalTick = FRAMES_PER_PAIR / 2; // Empezar en el medio para evitar flash inicial
    let rafId = 0;
    let resizeTimeout: ReturnType<typeof setTimeout>;

    const drawFrame = () => {
      if (!ctx) return;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);
      globalTick++;
      const opacities = getPairOpacities(globalTick, COLOR_PAIRS.length);
      drawParticles(ctx, particles, opacities, width, height);
      ctx.fillStyle = `rgba(0,0,0,${VEIL_OPACITY})`;
      ctx.fillRect(0, 0, width, height);
      rafId = requestAnimationFrame(drawFrame);
    };

    const start = () => {
      const res = initCanvas(canvas, speed);
      width = res.w;
      height = res.h;
      particles = res.p;
      drawFrame();
    };

    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        if (canvas) {
          const res = initCanvas(canvas, speed);
          width = res.w;
          height = res.h;
          particles = res.p;
        }
      }, 200);
    };

    globalThis.addEventListener("resize", handleResize);
    start();

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(resizeTimeout);
      globalThis.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full -z-10 pointer-events-none"
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}