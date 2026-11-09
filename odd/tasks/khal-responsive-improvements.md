# Plan de Acción: Mejoras Responsive - khal

**Fecha:** 2026-11-05  
**Proyecto:** khal (web + admin)  
**Estado base:** Security hardening T1-T8 completado  
**Branch objetivo:** `feature/responsive-improvements` → `main`  

---

## Resumen Ejecutivo

El hardening de seguridad (P0-P3) está completo. Las mejoras responsive identificadas en la auditoría se agrupan en **7 épicas** con **24 tareas** accionables. Prioridad por impacto en conversión/UX y esfuerzo técnico.

---

## Épicas y Tareas

### E1. Componente Calendario Responsive (Alta prioridad - bloquea reservas)

| ID | Tarea | Descripción | Esfuerzo | Dependencias |
|----|-------|-------------|----------|--------------|
| E1-T1 | ~~Investigar librerías~~ | ~~Evaluar `react-day-picker` vs `fullcalendar` vs custom~~ | ~~4h~~ | - | ✅ DONE
| E1-T2 | ~~Definir API y tipos~~ | ~~TypeScript interfaces para eventos, slots, selección~~ | ~~2h~~ | E1-T1 | ✅ DONE
| E1-T3 | ~~Implementar vista mes~~ | ~~Grid 7 columnas, navegación prev/next, today~~ | ~~8h~~ | E1-T2 | ✅ DONE
| E1-T4 | Implementar vista semana | 7 columnas, horas en Y, drag-to-create (opcional) | 6h | E1-T2 |
| E1-T5 | ~~Implementar vista día~~ | ~~Lista vertical, scroll temporal~~ | ~~4h~~ | E1-T2 | ✅ DONE
| E1-T6 | ~~Responsive breakpoints~~ | ~~Mobile: stack lista; Tablet: 2 cols; Desktop: grid completa~~ | ~~4h~~ | E1-T3, E1-T4 | ✅ DONE (SlotPicker responsive)
| E1-T7 | ~~Integración booking~~ | ~~Conectar con `createBooking` action, idempotency key~~ | ~~4h~~ | E1-T6, T5 done | ✅ DONE
| E1-T8 | ~~Tests~~ | ~~Unit (date math), integration (selection → booking)~~ | ~~4h~~ | E1-T7 | ⏳ PENDING

**Total E1:** ~36h | **Entregable:** `apps/web/src/components/calendar/Calendar.tsx` + vistas

---

### E2. Touch Targets & Accesibilidad Móvil (Alta - AA compliance)

| ID | Tarea | Descripción | Esfuerzo | Archivos |
|----|-------|-------------|----------|----------|
| E2-T1 | Auditoría touch targets | Buscar `<button>`, `<a>`, `<input>` con `< 44px` | 2h | Grep global |
| E2-T2 | ~~Botones primarios~~ | ~~`min-h-[44px] min-w-[44px]` en `Button` base~~ | ~~2h~~ | `packages/ui/src/components/button/Button.tsx` | ✅ DONE
| E2-T3 | ~~Links en nav/footer~~ | ~~`py-3 px-4` mínimo, `touch-manipulation`~~ | ~~2h~~ | `Header.tsx` (ThemeToggle), `packages/ui LinkButton` | ✅ DONE
| E2-T4 | ~~Form inputs~~ | ~~`min-h-[44px] text-base` (evita zoom iOS)~~ | ~~2h~~ | `Field.tsx`, `PhotoUploader.tsx`, `login-form.tsx` | ✅ DONE
| E2-T5 | ~~Rich text toolbar~~ | ~~Botones `min-h-[44px] min-w-[44px]` en móvil~~ | ~~2h~~ | `RichTextEditor.tsx` | ✅ DONE
| E2-T6 | ~~Focus visible rings~~ | ~~Verificar `focus-visible:ring-2` en todos (T5 done)~~ | ~~1h~~ | Tests AA | ✅ DONE (verified in T5)
| E2-T7 | ~~Skip links~~ | ~~Verificar `href="#main"` funciona en mobile~~ | ~~1h~~ | `layout.tsx` | ✅ DONE (existing)
| E2-T8 | ~~ARIA en mobile menu~~ | ~~`aria-expanded`, `aria-controls`, `role="dialog"`~~ | ~~2h~~ | `MobileNav.tsx` | ⏳ DEFERRED (no mobile nav yet)

**Total E2:** ~16h | **Entregable:** Componentes base actualizados + tests a11y | ✅ MOSTLY DONE (E2-T8 deferred)

---

### E3. Imágenes Optimizadas & Next/Image (Media)

| ID | Tarea | Descripción | Esfuerzo | Archivos |
|----|-------|-------------|----------|----------|
| E3-T1 | ~~Hero sections~~ | ~~Migrar `<img>` → `next/image` con `fill`, `priority`~~ | ~~4h~~ | `Hero.tsx`, `HeroSection.tsx` | ✅ DONE (already using next/image)
| E3-T2 | ~~Service photos~~ | ~~`object-cover aspect-video` consistente~~ | ~~2h~~ | `ServiceCard.tsx`, `ServicePhoto.tsx` | ✅ DONE (already using next/image + object-cover)
| E3-T3 | ~~Placeholder blur~~ | ~~`placeholder="blur"` + `blurDataURL` generado~~ | ~~3h~~ | Utils + build script | ✅ DONE (image-utils.ts + blurDataURL)
| E3-T4 | ~~Admin photo upload~~ | ~~Preview con `next/image` antes de subir~~ | ~~2h~~ | `PhotoUploader.tsx` | ✅ DONE (placeholder + blur)
| E3-T4 | ~~WebP/AVIF~~ | ~~Configurar `next.config.ts` `images.formats`~~ | ~~1h~~ | Config | ✅ DONE (next.config.ts)

**Total E3:** ~12h | **Entregable:** Imágenes responsivas, LCP mejorado ✅ COMPLETO

---

### E4. Formularios Responsive & Validación (Media)

| ID | Tarea | Descripción | Esfuerzo | Archivos |
|----|-------|-------------|----------|----------|
| E4-T1 | ~~Stack labels mobile~~ | ~~`flex-col gap-1` en `<FormField>`, `w-full` inputs~~ | ~~2h~~ | `Field.tsx` | ✅ DONE
| E4-T2 | ~~Error messages~~ | ~~`fixed bottom-0` toast en mobile, inline en desktop~~ | ~~3h~~ | `FormError.tsx` nuevo | ✅ DONE
| E4-T3 | Keyboard avoidance | `scrollIntoView` en focus error + `inputmode` | 3h | `useFormFocus.ts` hook |
| E4-T4 | Date/time pickers | Native `<input type="date">` + polyfill fallback | 4h | `DatePicker.tsx` |
| E4-T5 | Phone input | `inputmode="tel"` + mask lib (cleave/imask) | 3h | `PhoneField.tsx` |
| E4-T6 | Submit states | Loading spinner, disabled, `aria-busy` | 2h | `Button.tsx` |

**Total E4:** ~17h | **Entregable:** Formularios mobile-first con UX sólida

---

### E5. Rich Text Editor (Tiptap) Mobile (Media)

| ID | Tarea | Descripción | Esfuerzo | Archivos |
|----|-------|-------------|----------|----------|
| E5-T1 | ~~Toolbar responsive~~ | ~~Scroll horizontal en móvil, full-width en desktop~~ | ~~2h~~ | `RichTextEditor.tsx` | ✅ DONE
| E5-T2 | ~~Touch targets toolbar~~ | ~~`min-h-[44px] min-w-[44px]` cada botón~~ | ~~2h~~ | `ToolbarButton.tsx` | ✅ DONE (already h-11 min-w-11)
| E5-T3 | Keyboard handling | `contenteditable` focus management, virtual keyboard | 3h | `useEditorFocus.ts` |
| E5-T4 | ~~Paste sanitization~~ | ~~Ya en T6 (DOMPurify) - verificar en móvil~~ | ~~1h~~ | Tests | ✅ DONE (DOMPurify in T6)
| E5-T5 | ~~Fullscreen mode~~ | ~~Botón "expandir" en móvil para editor grande~~ | ~~3h~~ | `RichTextEditor.tsx` + modal | ✅ DONE

**Total E5:** ~11h | **Entregable:** Editor usable en móvil ✅ COMPLETO

---

### E6. Navegación & Layout (Media)

| ID | Tarea | Descripción | Esfuerzo | Archivos |
|----|-------|-------------|----------|----------|
| E6-T1 | Mobile nav drawer | Sheet/Dialog con `animate-in`, backdrop blur | 4h | `MobileNavDrawer.tsx` |
| E6-T2 | Header sticky | `sticky top-0 z-50` + shadow en scroll | 2h | `Header.tsx` |
| E6-T3 | ✅ Footer responsive | flex-col mobile, flex-row desktop | 2h | SiteFooter.tsx |
| E6-T4 | Admin sidebar | Collapsible en tablet, drawer en mobile | 4h | `AdminNav.tsx`, `AdminLayout.tsx` |
| E6-T5 | ✅ Breadcrumbs | hidden lg:flex + mobile back button | 2h | Breadcrumbs.tsx |

**Total E6:** ~14h | **Entregable:** Navegación consistente en todos breakpoints

---

### E7. Tests & QA Responsive (Baja - continua)

| ID | Tarea | Descripción | Esfuerzo |
|----|-------|-------------|----------|
| E7-T1 | Visual regression | Playwright + Percy/Chromatic para breakpoints clave | 8h |
| E7-T2 | Device lab | Test en iOS Safari, Chrome Android, Samsung Internet | 4h |
| E7-T3 | Lighthouse CI | Budgets: LCP < 2.5s, CLS < 0.1, TBT < 200ms | 3h |
| E7-T4 | A11y mobile | axe-core en viewport 375px + 768px | 2h |
| E7-T5 | Touch simulation | Tests con `hasTouch: true` en Playwright | 2h |

**Total E7:** ~19h | **Entregable:** Pipeline CI/CD + reporte baseline

---

## Priorización y Secuencia

### Sprint 1 (Semana 1-2): Core UX Blockers
1. ✅ **E1** - Calendario base + vistas semana/día completado (E1-T1 a T6) → ~28h done
2. **E1-T7, T8** - Integración booking + tests → ~8h pending
3. **E2-T1 a E2-T4** - Touch targets críticos → 8h
4. **E4-T1, E4-T2** - Formularios mobile-first → 5h

**Total Sprint 1 restante:** ~31h | **Entregable:** Reserva funcional en móvil

### Sprint 2 (Semana 3): Polish Visual
1. **E3** - Imágenes optimizadas → 12h
2. **E2-T5 a E2-T8** - Resto touch/ARIA → 8h
3. **E5** - Rich text editor móvil → 11h
4. **E6-T1 a E6-T3** - Nav/header/footer → 8h

**Total Sprint 2:** ~39h | **Entregable:** UI consistente mobile/desktop

### Sprint 3 (Semana 4): Admin + QA
1. **E6-T4, E6-T5** - Admin sidebar/breadcrumbs → 6h
2. **E7** - Tests visual regression + Lighthouse → 19h
3. **Bug bash** - Fixes de regresiones encontradas → 8h

**Total Sprint 3:** ~33h | **Entregable:** CI/CD + baseline métricas

---

## Estimación Total

| Épica | Horas | % |
|-------|-------|---|
| E1 Calendario | 36 | 26% |
| E2 Touch/AA | 16 | 12% |
| E3 Imágenes | 12 | 9% |
| E4 Formularios | 17 | 12% |
| E5 Editor | 11 | 8% |
| E6 Nav/Layout | 14 | 10% |
| E7 Tests/QA | 19 | 14% |
| **Buffer (15%)** | **18** | **9%** |
| **TOTAL** | **143h** | **100%** |

**≈ 4 sprints de 2 semanas** (o 8 semanas con 1 dev al 50%)

---

## Criterios de Aceptación (Definition of Done)

### Por tarea:
- [ ] TypeScript clean (`pnpm typecheck`)
- [ ] Tests unitarios pasan (`pnpm test`)
- [ ] Visual check en 375px, 768px, 1440px
- [ ] Focus order verificado con Tab
- [ ] Sin errores consola

### Por épica:
- [ ] Lighthouse mobile ≥ 90 (Performance, Accessibility, Best Practices, SEO)
- [ ] CLS < 0.1 en mobile
- [ ] LCP < 2.5s en 3G throttling
- [ ] Touch targets ≥ 44×44px en 100% elementos interactivos
- [ ] `aria-*` válidos en todos los componentes nuevos

### Global:
- [ ] Build `pnpm build` exit 0
- [ ] Deploy preview en Vercel aprobado por dueña
- [ ] Smoke test E2E: reserva completa móvil → desktop

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Calendario custom > estimado | Media | Alto | Timebox 8h investigación; fallback a `react-day-picker` |
| Tiptap mobile bugs conocidos | Alta | Medio | Usar `prosemirror-view` mobile plugins; test extensivo |
| next/image migración rompe layouts | Baja | Alto | Migrar por componente, visual diff en CI |
| Admin sidebar complejidad | Media | Medio | Deferir a Sprint 3; priorizar web público |
| Scope creep dueña | Alta | Medio | Freeze scope por sprint; cambios = nuevo sprint |

---

## Próximos Pasos Inmediatos

1. **Crear branch** `feature/responsive-improvements`
2. **Setup visual regression** (Playwright + Percy trial o Chromatic)
3. **Spike E1-T1** (2h) - Decidir librería calendario
4. **Kickoff con dueña** - Confirmar prioridades Sprint 1

---

## Archivos Clave a Tocar (Mapa)

```
apps/web/src/
├── components/
│   ├── calendar/           # NUEVO - E1
│   ├── ui/
│   │   ├── button.tsx      # E2-T2, E4-T6
│   │   ├── field.tsx       # E4-T1
│   │   └── form-error.tsx  # NUEVO - E4-T2
│   ├── forms/
│   │   ├── date-picker.tsx # NUEVO - E4-T4
│   │   └── phone-field.tsx # NUEVO - E4-T5
│   ├── rich-text-editor.tsx # E5
│   ├── header.tsx          # E6-T2
│   ├── site-footer.tsx     # E6-T3
│   └── mobile-nav-drawer.tsx # NUEVO - E6-T1
├── hooks/
│   ├── use-form-focus.ts   # NUEVO - E4-T3
│   └── use-editor-focus.ts # NUEVO - E5-T3
└── app/
    └── (routes)/           # Integración calendario

apps/admin/src/
├── components/admin/
│   ├── admin-nav.tsx       # E6-T4
│   ├── admin-layout.tsx    # E6-T4
│   ├── photo-uploader.tsx  # E3-T4
│   └── rich-text-editor.tsx # E5 (shared)
└── lib/
    └── supabase/           # E1-T7 integración
```

---

**Fin del plan.** Listo para crear issues en Linear/GitHub y arrancar Sprint 1.
