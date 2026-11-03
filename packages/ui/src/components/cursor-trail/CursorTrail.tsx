"use client";

import React, { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

export interface CursorTrailProps {
  className?: string;
  zIndex?: number;
}

export function CursorTrail({ className, zIndex = 30 }: CursorTrailProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const [showCursor, setShowCursor] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!mounted || prefersReducedMotion) return null;

  useEffect(() => {
    const ring = ringRef.current;
    const dot = dotRef.current;
    if (!ring || !dot) return;

    let cursorX = 0, cursorY = 0, dotX = 0, dotY = 0;
    let animId: number;

    const animate = () => {
      ring.style.transform = `translate(${cursorX - 20}px, ${cursorY - 20}px)`;
      dot.style.transform = `translate(${dotX - 4}px, ${dotY - 4}px)`;
      animId = requestAnimationFrame(animate);
    };
    animate();

    const onMove = (e: MouseEvent) => {
      cursorX += (e.clientX - cursorX) * 0.12;
      cursorY += (e.clientY - cursorY) * 0.12;
      dotX += (e.clientX - dotX) * 0.3;
      dotY += (e.clientY - dotY) * 0.3;
    };

    window.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover)');
    setShowCursor(mq.matches);
    const handler = (e: MediaQueryListEvent) => setShowCursor(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  if (!showCursor) return null;

  return (
    <>
      <div
        ref={ringRef}
        className={clsx(
          'fixed pointer-events-none z-[30] transition-opacity duration-150',
          'w-[var(--cursor-ring-size,40px)] h-[var(--cursor-ring-size,40px)]',
          'rounded-full border border-foreground/50 dark:border-foreground/60',
          'will-change-transform',
        )}
        style={{
          opacity: showCursor ? 1 : 0,
          zIndex,
          transform: 'translate(-50%, -50%)',
          left: 0,
          top: 0,
        }}
        aria-hidden="true"
      />
      <div
        ref={dotRef}
        className={clsx(
          'fixed pointer-events-none z-[30] transition-opacity duration-150',
          'w-[var(--cursor-dot-size,8px)] h-[var(--cursor-dot-size,8px)]',
          'rounded-full bg-foreground dark:bg-background',
          'will-change-transform',
        )}
        style={{
          opacity: showCursor ? 1 : 0,
          zIndex: zIndex + 1,
          transform: 'translate(-50%, -50%)',
          left: 0,
          top: 0,
        }}
        aria-hidden="true"
      />
      <style jsx global>{`
        @media (prefers-reduced-motion: reduce) {
          .cursor-trail-ring,
          .cursor-trail-dot {
            display: none;
          }
        }
        @media (hover: none) {
          .cursor-trail-ring,
          .cursor-trail-dot {
            display: none;
          }
        }
      `}</style>
    </>
  );
}

export interface CursorTrailProps {
  className?: string;
  zIndex?: number;
}
