# Spike: Calendar Library Selection for khal

**Fecha:** 2026-11-05  
**Objetivo:** Seleccionar librería para componente calendario responsive (E1-T1)  
**Criterios:** Bundle size, TypeScript, responsive, accesibilidad, mantenimiento, integración Next 15

---

## Candidatas Evaluadas

### 1. react-day-picker (v9+)
| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~12 kB gzipped (tree-shakeable) |
| **TS** | First-class, tipos completos |
| **Responsive** | CSS-based, fully customizable via classNames |
| **A11y** | ARIA rosette, keyboard nav, screen reader support nativo |
| **Mantenimiento** | Activo (última release 2024), 12k+ stars |
| **Next 15** | Compatible (client component) |
| **API** | Headless + componentes compuestos |
| **Vistas** | Mes, semana (custom), multi-mes, range |

**Pros:** Ligero, accesible, flexible, buena DX
**Contras:** Semana/día requieren composición manual

---

### 2. @fullcalendar/react (v6+)
| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~180 kB gzipped (core) + plugins |
| **TS** | Tipos completos |
| **Responsive** | Auto-responsive, vistas móviles adaptativas |
| **A11y** | ARIA, keyboard, pero histórico issues móviles |
| **Mantenimiento** | Muy activo, comercial (licencia) |
| **Next 15** | Requiere `dynamic import` + `ssr: false` |
| **API** | Config-based, plugin system |
| **Vistas** | Mes, semana, día, lista, timeline (out of box) |

**Pros:** Vistas complejas listas, drag-drop, recursos
**Contras:** Pesado, overkill para reserva simple, licencia comercial para features premium

---

### 3. date-fns + custom UI
| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~8 kB (date-fns) + tu CSS |
| **TS** | Tipos en date-fns |
| **Responsive** | 100% control tuyo |
| **A11y** | Tu responsabilidad |
| **Mantenimiento** | date-fns activo, UI tuya |
| **Next 15** | Sin issues |
| **API** | Funciones puras |
| **Vistas** | Lo que construyas |

**Pros:** Control total, mínimo bundle base
**Contras:** Reinventar rueda, A11y fácil fallar, tiempo alto

---

### 4. react-calendar (v5+)
| Aspecto | Detalle |
|---------|---------|
| **Bundle** | ~25 kB gzipped |
| **TS** | Tipos decentes |
| **Responsive** | CSS grid, breakpoints básicos |
| **A11y** | Básico, mejorable |
| **Mantenimiento** | Moderado (última release 2023) |
| **Next 15** | Compatible |
| **API** | Componente único `<Calendar />` |
| **Vistas** | Mes, año, década |

**Pros:** Simple, una sola importación
**Contras:** Menos flexible, semana/día no nativos

---

## Comparativa Rápida

| Criterio | react-day-picker | FullCalendar | Custom | react-calendar |
|----------|------------------|--------------|--------|----------------|
| Bundle size | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★★★☆ |
| A11y nativo | ★★★★★ | ★★★★☆ | ★★☆☆☆ | ★★★☆☆ |
| Vistas lista | ★★★★☆ | ★★★★★ | ★★☆☆☆ | ★★★☆☆ |
| Flexibilidad | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Mantenimiento | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★☆☆ |
| Next 15 ready | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★★★★ |
| Curva aprendizaje | Baja | Media | Alta | Baja |

---

## Requisitos khal (de E1)

1. **Vista mes** - Selección de día → slot picker
2. **Vista semana** - Opcional, para admin/providers
3. **Responsive** - Mobile: lista apilada; Desktop: grid 7 cols
4. **A11y AA** - Keyboard nav, ARIA, focus visible
5. **Integración** - `createBooking` action con idempotency key (T5 done)
6. **i18n** - es-AR / en, week start Monday (AR) vs Sunday (US)
7. **Bundle** - Mantener First Load JS < 150 kB en página reserva

---

## Decisión Recomendada: **react-day-picker**

### Justificación

1. **Bundle óptimo** - 12 kB vs 180 kB FullCalendar; mantiene budget khal
2. **A11y nativo** - Cumple AA sin trabajo extra; crítico para dueña
3. **Componible** - Headless + styled components = control total responsive
4. **Mantenido** - Activo, comunidad grande, Next.js compatible
5. **Flexibilidad vistas** - Mes nativo; semana/día componibles con mismos primitives
6. **i18n** - `locale` prop + `weekStartsOn` configurable

### Implementación Propuesta

```
apps/web/src/components/calendar/
├── Calendar.tsx              # Wrapper principal, vista mes
├── CalendarWeek.tsx          # Vista semana (compuesta)
├── CalendarDay.tsx           # Vista día (lista slots)
├── SlotPicker.tsx            # Selector horario tras click día
├── CalendarHeader.tsx        # Navegación mes/año, today
├── CalendarGrid.tsx          # Grid 7 cols responsive
├── CalendarCell.tsx          # Celda día, estados (disponible/ocupado/pasado)
├── useCalendar.ts            # Hook lógica: navegar, seleccionar, slots
├── types.ts                  # Tipos compartidos
├── calendar.css              # CSS modules / Tailwind classes
└── index.ts                  # Exports públicos
```

### Dependencias a Instalar

```bash
pnpm add react-day-picker date-fns
# date-fns ya está en validations/shared - verificar versión
```

### Arquitectura de Datos

```typescript
// types.ts
interface CalendarSlot {
  id: string;
  serviceId: string;
  date: string;           // YYYY-MM-DD
  startMinutes: number;   // 0-1439
  durationMinutes: number;
  isAvailable: boolean;
  providerId?: string;
}

interface CalendarMonth {
  year: number;
  month: number;          // 0-11
  slots: CalendarSlot[];  // Para pintar disponibilidad
}

interface CalendarSelection {
  date: string;           // Día seleccionado
  slotId?: string;        // Slot elegido (opcional)
}
```

### Integración con Booking Flow

1. **Calendar** muestra mes con disponibilidad (verde/rojo/gris)
2. **Click día** → abre **SlotPicker** (bottom sheet mobile, popover desktop)
3. **SlotPicker** lista horarios disponibles para ese día/servicio
4. **Seleccionar slot** → setea `idempotencyKey` + navega a `/reserva?serviceId=&date=&slotId=`
5. **Página reserva** pre-llena formulario, usuario completa datos

---

## Plan de Implementación (E1)

| Paso | Tarea | Archivos | Estimado |
|------|-------|----------|----------|
| 1 | `pnpm add react-day-picker` | package.json | 5 min |
| 2 | Tipos base + hooks | `types.ts`, `useCalendar.ts` | 2h |
| 3 | Componentes atómicos | `CalendarCell`, `CalendarHeader`, `CalendarGrid` | 4h |
| 4 | Vista mes principal | `Calendar.tsx` | 4h |
| 5 | Responsive CSS | `calendar.css` / Tailwind classes | 3h |
| 6 | SlotPicker (mobile/desktop) | `SlotPicker.tsx` | 4h |
| 7 | Vista semana (opcional Sprint 1) | `CalendarWeek.tsx` | 4h |
| 8 | Integración booking | `app/reserva/page.tsx` + actions | 4h |
| 9 | Tests | `Calendar.test.tsx`, `useCalendar.test.ts` | 4h |
| 10 | Storybook / visual check | `.storybook/` | 2h |

**Total estimado:** ~31h (vs 36h plan - buffer 5h)

---

## Alternativa si react-day-picker falla

**Fallback:** `@fullcalendar/react` con `dynamic import` + `ssr: false`
- Solo si: vistas semana/día complejas son hard requirement Sprint 1
- Mitigación: code-split agresivo, cargar solo en admin

---

## Próximo Paso

**Ejecutar:** `pnpm add react-day-picker` en `apps/web` y crear estructura de carpetas.

¿Aprobado para proceder con react-day-picker?
