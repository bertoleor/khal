"use client";

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface LiquidGradientProps {
  /** @deprecated kept for compatibility - no longer used */
  title?: string;
  /** @deprecated kept for compatibility - no longer used */
  showPauseButton?: boolean;
  /** @deprecated kept for compatibility - no longer used */
  ctaText?: string;
  /** @deprecated kept for compatibility - no longer used */
  onCtaClick?: () => void;
}

/**
 * Liquid Gradient — decorative background only (21st.dev verbatim, stripped).
 * Renders only the Three.js canvas. No CTA, no pause, no cursor, no title, no footer.
 * All interactive elements moved to khal UI layer with canonical components.
 */
export default function LiquidGradient(_props: LiquidGradientProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);

  // Platform theme detection (unchanged from 21st.dev)
  const [isDarkMode, setIsDarkMode] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      const html = document.documentElement;
      const body = document.body;
      const isDark = html.classList.contains('dark') ||
                     body.classList.contains('dark') ||
                     html.getAttribute('data-theme') === 'dark' ||
                     window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(isDark);
    };
    checkTheme();
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkTheme);
    return () => { observer.disconnect(); mediaQuery.removeEventListener('change', checkTheme); };
  }, []);

  // Reduced-motion detection
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // Custom cursor trail (TouchTexture) - kept but disabled when reduced-motion
  const touchTextureRef = useRef<any>(null);

  useEffect(() => {
    touchTextureRef.current = new (class {
      size = 64; width = 64; height = 64; maxAge = 64; radius = 0.1; speed = 1/64;
      trail: any[] = []; last: any = null;
      canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; texture: any;
      constructor() {
        this.canvas = document.createElement('canvas');
        this.canvas.width = this.width; this.canvas.height = this.height;
        this.ctx = this.canvas.getContext('2d')!;
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.texture = new THREE.Texture(this.canvas);
      }
      update() {
        if (prefersReducedMotion) return; // Respect reduced-motion
        this.ctx.fillStyle = 'black';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        for (let i = this.trail.length - 1; i >= 0; i--) {
          const p = this.trail[i];
          const f = p.force * this.speed * (1 - p.age / this.maxAge);
          p.x += p.vx * f; p.y += p.vy * f; p.age++;
          if (p.age > this.maxAge) this.trail.splice(i, 1);
          else this.drawPoint(p);
        }
        this.texture.needsUpdate = true;
      }
      addTouch(point: any) {
        let force = 0, vx = 0, vy = 0;
        if (this.last) {
          const dx = point.x - this.last.x, dy = point.y - this.last.y;
          if (dx === 0 && dy === 0) return;
          const d = Math.sqrt(dx*dx + dy*dy);
          vx = dx/d; vy = dy/d;
          force = Math.min((dx*dx + dy*dy) * 20000, 2.0);
        }
        this.last = { x: point.x, y: point.y };
        this.trail.push({ x: point.x, y: point.y, age: 0, force, vx, vy });
      }
      drawPoint(p: any) {
        const pos = { x: p.x * this.width, y: (1 - p.y) * this.height };
        let intensity = p.age < this.maxAge * 0.3
          ? Math.sin((p.age / (this.maxAge * 0.3)) * (Math.PI / 2))
          : -((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) * ((1 - (p.age - this.maxAge * 0.3) / (this.maxAge * 0.7)) - 2));
        intensity *= p.force;
        const color = `${((p.vx + 1) / 2) * 255}, ${((p.vy + 1) / 2) * 255}, ${intensity * 255}`;
        const radius = this.radius * this.width;
        this.ctx.shadowOffsetX = this.size * 5;
        this.ctx.shadowOffsetY = this.size * 5;
        this.ctx.shadowBlur = radius;
        this.ctx.shadowColor = `rgba(${color},${0.2 * intensity})`;
        this.ctx.beginPath();
        this.ctx.fillStyle = 'rgba(255,0,0,1)';
        this.ctx.arc(pos.x - this.size * 5, pos.y - this.size * 5, radius, 0, Math.PI * 2);
        this.ctx.fill();
      }
    })();
  }, [prefersReducedMotion]);

  // GradientBackground class (unchanged shader)
  const gradientBackgroundRef = useRef<any>(null);

  useEffect(() => {
    gradientBackgroundRef.current = new (class {
      mesh: any = null; uniforms: any; sceneManager: { getViewSize: () => { width: number; height: number }; scene: any }; isPaused = false;
      constructor(sceneManager: { getViewSize: () => { width: number; height: number }; scene: any }) {
        this.sceneManager = sceneManager;
        this.uniforms = {
          uTime: { value: 0 },
          uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
          uColor1: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
          uColor2: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
          uColor3: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
          uColor4: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
          uColor5: { value: new THREE.Vector3(0.945, 0.353, 0.133) },
          uColor6: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
          uSpeed: { value: 1.2 }, uIntensity: { value: 1.8 },
          uTouchTexture: { value: null }, uGrainIntensity: { value: 0.08 },
          uDarkNavy: { value: new THREE.Vector3(0.039, 0.055, 0.153) },
          uGradientSize: { value: 0.45 }, uGradientCount: { value: 12.0 },
          uColor1Weight: { value: 0.5 }, uColor2Weight: { value: 1.8 }
        };
      }
      init() {
        const viewSize = this.sceneManager.getViewSize();
        const geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1);
        const material = new THREE.ShaderMaterial({
          uniforms: this.uniforms,
          vertexShader: 'varying vec2 vUv; void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); vUv = uv; }',
          fragmentShader: `
            uniform float uTime, uSpeed, uIntensity, uGrainIntensity, uGradientSize, uGradientCount, uColor1Weight, uColor2Weight;
            uniform vec2 uResolution;
            uniform vec3 uColor1, uColor2, uColor3, uColor4, uColor5, uColor6, uDarkNavy;
            uniform sampler2D uTouchTexture;
            varying vec2 vUv;

            float grain(vec2 uv, float t) { return fract(sin(dot(uv * uResolution * 0.5 + t, vec2(12.9898, 78.233))) * 43758.5453) * 2.0 - 1.0; }

            vec3 getGradientColor(vec2 uv, float time) {
              vec2 c1 = vec2(0.5 + sin(time * uSpeed * 0.4) * 0.4, 0.5 + cos(time * uSpeed * 0.5) * 0.4);
              vec2 c2 = vec2(0.5 + cos(time * uSpeed * 0.6) * 0.5, 0.5 + sin(time * uSpeed * 0.45) * 0.5);
              vec2 c3 = vec2(0.5 + sin(time * uSpeed * 0.35) * 0.45, 0.5 + cos(time * uSpeed * 0.55) * 0.45);
              vec2 c4 = vec2(0.5 + cos(time * uSpeed * 0.5) * 0.4, 0.5 + sin(time * uSpeed * 0.4) * 0.4);
              vec2 c5 = vec2(0.5 + sin(time * uSpeed * 0.7) * 0.35, 0.5 + cos(time * uSpeed * 0.6) * 0.35);
              vec2 c6 = vec2(0.5 + cos(time * uSpeed * 0.45) * 0.5, 0.5 + sin(time * uSpeed * 0.65) * 0.5);

              float i1 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c1));
              float i2 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c2));
              float i3 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c3));
              float i4 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c4));
              float i5 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c5));
              float i6 = 1.0 - smoothstep(0.0, uGradientSize, length(uv - c6));

              vec3 color = vec3(0.0);
              color += uColor1 * i1 * (0.55 + 0.45 * sin(time * uSpeed)) * uColor1Weight;
              color += uColor2 * i2 * (0.55 + 0.45 * cos(time * uSpeed * 1.2)) * uColor2Weight;
              color += uColor3 * i3 * (0.55 + 0.45 * sin(time * uSpeed * 0.8)) * uColor1Weight;
              color += uColor4 * i4 * (0.55 + 0.45 * cos(time * uSpeed * 1.3)) * uColor2Weight;
              color += uColor5 * i5 * (0.55 + 0.45 * sin(time * uSpeed * 1.1)) * uColor1Weight;
              color += uColor6 * i6 * (0.55 + 0.45 * cos(time * uSpeed * 0.9)) * uColor2Weight;

              color = clamp(color, vec3(0.0), vec3(1.0)) * uIntensity;
              float lum = dot(color, vec3(0.299, 0.587, 0.114));
              color = mix(vec3(lum), color, 1.35);
              color = pow(color, vec3(0.92));
              float brightness = length(color);
              color = mix(uDarkNavy, color, max(brightness * 1.2, 0.15));
              return color;
            }

            void main() {
              vec2 uv = vUv;
              vec4 touchTex = texture2D(uTouchTexture, uv);
              uv.x -= (touchTex.r * 2.0 - 1.0) * 0.8 * touchTex.b;
              uv.y -= (touchTex.g * 2.0 - 1.0) * 0.8 * touchTex.b;
              vec2 center = vec2(0.5);
              float dist = length(uv - center);
              float ripple = sin(dist * 20.0 - uTime * 3.0) * 0.04 * touchTex.b;
              uv += vec2(ripple);
              vec3 color = getGradientColor(uv, uTime);
              color += grain(uv, uTime) * uGrainIntensity;
              color = clamp(color, vec3(0.0), vec3(1.0));
              gl_FragColor = vec4(color, 1.0);
            }
          `,
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.sceneManager.scene.add(this.mesh);
      }
      update(delta: number) { if (!this.isPaused) this.uniforms.uTime.value += delta; }
      setTheme(isDark: boolean) {
        if (isDark) {
          this.uniforms.uColor1.value.set(0.945, 0.353, 0.133);
          this.uniforms.uColor2.value.set(0.039, 0.055, 0.153);
          this.uniforms.uDarkNavy.value.set(0.039, 0.055, 0.153);
          this.sceneManager.scene.background = new THREE.Color(0x0a0e27);
        } else {
          this.uniforms.uColor1.value.set(1.0, 0.5, 0.35);
          this.uniforms.uColor2.value.set(0.9, 0.95, 1.0);
          this.uniforms.uDarkNavy.value.set(0.95, 0.97, 1.0);
          this.sceneManager.scene.background = new THREE.Color(0xf5f7ff);
        }
      }
      onResize(w: number, h: number) {
        const viewSize = this.sceneManager.getViewSize();
        if (this.mesh) { this.mesh.geometry.dispose(); this.mesh.geometry = new THREE.PlaneGeometry(viewSize.width, viewSize.height, 1, 1); }
        this.uniforms.uResolution.value.set(w, h);
      }
    })( /* sceneManager */ {
      getViewSize: () => ({ width: window.innerWidth, height: window.innerHeight }),
      scene: { add: () => {}, background: new THREE.Color(0x0a0e27) }
    } as any);
    gradientBackgroundRef.current.init();
    if (touchTextureRef.current) gradientBackgroundRef.current.uniforms.uTouchTexture.value = touchTextureRef.current.texture;
  }, [prefersReducedMotion]);

  // App class - Three.js setup
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const containerEl: HTMLElement = container;

    const app = new (class {
      renderer: any; camera: any; scene: any; clock: any;
      touchTexture: any; gradientBackground: any;
      animationId: number | null = null; container: HTMLElement;
      constructor(containerEl: HTMLElement) {
        this.container = containerEl;
        this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
        this.renderer.setSize(containerEl.clientWidth, containerEl.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        containerEl.appendChild(this.renderer.domElement);
        this.camera = new THREE.PerspectiveCamera(45, containerEl.clientWidth / containerEl.clientHeight, 0.1, 10000);
        this.camera.position.z = 50;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.clock = new THREE.Clock();
        this.touchTexture = touchTextureRef.current;
        this.gradientBackground = gradientBackgroundRef.current;
        this.gradientBackground.sceneManager = this;
        this.gradientBackground.init();
        this.gradientBackground.uniforms.uTouchTexture.value = this.touchTexture.texture;
        this.animate();
      }
      setTheme(isDark: boolean) { this.gradientBackground.setTheme(isDark); }
      setPaused(paused: boolean) { this.gradientBackground.isPaused = paused; }
      getViewSize() {
        const fov = (this.camera.fov * Math.PI) / 180;
        const height = Math.abs(this.camera.position.z * Math.tan(fov / 2) * 2);
        return { width: height * this.camera.aspect, height };
      }
      animate() {
        const delta = this.clock.getDelta();
        this.gradientBackground.update(delta);
        if (!prefersReducedMotion && this.touchTexture) {
          this.touchTexture.update();
        }
        this.renderer.render(this.scene, this.camera);
        this.animationId = requestAnimationFrame(() => this.animate());
      }
      cleanup() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.renderer.dispose();
        if (this.container.contains(this.renderer.domElement)) {
          this.container.removeChild(this.renderer.domElement);
        }
      }
    })(containerEl);

    // Theme sync
    const handleThemeChange = () => app.setTheme(isDarkMode);
    handleThemeChange();
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-theme'] });
    observer.observe(document.body, { attributes: true, attributeFilter: ['class', 'data-theme'] });

    // Reduced-motion sync
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleMotionChange = (e: MediaQueryListEvent) => {
      app.setPaused(e.matches);
    };
    mq.addEventListener('change', handleMotionChange);

    // Mouse move for touch texture (only when not reduced-motion)
    const handleMouseMove = (e: MouseEvent) => {
      if (!prefersReducedMotion && touchTextureRef.current) {
        const rect = containerEl.getBoundingClientRect();
        app.touchTexture.addTouch({ x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height });
      }
    };
    container.addEventListener('mousemove', handleMouseMove);

    // Resize
    const onResize = () => {
      const rect = containerEl.getBoundingClientRect();
      app.renderer.setSize(rect.width, rect.height);
      app.camera.aspect = rect.width / rect.height;
      app.camera.updateProjectionMatrix();
      app.gradientBackground.onResize(rect.width, rect.height);
    };
    window.addEventListener('resize', onResize);
    onResize();

    return () => {
      observer.disconnect();
      mq.removeEventListener('change', handleMotionChange);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', onResize);
      app.cleanup();
    };
  }, [isDarkMode, prefersReducedMotion]);

  // Render: ONLY the canvas wrapper (decorative)
  return (
    <div
      ref={containerRef}
      className="liquid-container"
      aria-hidden="true"
      onMouseMove={prefersReducedMotion ? undefined : (e: React.MouseEvent) => {
        if (!touchTextureRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        touchTextureRef.current.addTouch({ x: (e.clientX - rect.left) / rect.width, y: 1 - (e.clientY - rect.top) / rect.height });
      }}
    >
      <div ref={containerRef} className="liquid-canvas-wrapper" />
    </div>
  );
}

export { LiquidGradient as Component };
