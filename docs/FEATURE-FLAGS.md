# Feature Flags System — Khal Admin

**Versión:** 1.0  
**Ubicación:** `apps/admin/src/lib/feature-flags.ts`, `apps/admin/src/lib/feature-flags-react.tsx`

---

## Resumen

Sistema de feature flags type-safe para habilitar/deshabilitar funcionalidades del panel de admin sin deployments. Soporta evaluación server-side (SSR) y client-side (React), con prioridades configurables.

---

## Arquitectura

```
apps/admin/src/lib/
├── feature-flags.ts          # Core logic (enum, defaults, evaluation)
├── feature-flags-react.tsx   # React hooks, context, HOCs, gates
```

### Flujo de Evaluación (Prioridad)

| Prioridad | Fuente | Descripción |
|-----------|--------|-------------|
| 1 (Máxima) | Environment Variables | `KHAL_FF_<FLAG_NAME>=true|false` — Control de deployment |
| 2 | Database | Per-user/tenant overrides (futuro) |
| 3 | User Preferences | `localStorage` key `ff_<flag>` — Client-side |
| 4 (Mínima) | Defaults | `FLAG_DEFAULTS` en código |

---

## Flags Disponibles

### Dashboard
| Flag | Default | Descripción |
|------|---------|-------------|
| `NEW_DASHBOARD` | `false` | Nuevo diseño de dashboard con analytics avanzados |
| `ADVANCED_ANALYTICS` | `false` | Gráficos detallados, métricas de conversión |

### Servicios
| Flag | Default | Descripción |
|------|---------|-------------|
| `SERVICE_BULK_ACTIONS` | `true` | Acciones en lote (ya implementado) |
| `SERVICE_IMPORT_EXPORT` | `false` | Importar/exportar catálogo CSV/JSON |
| `SERVICE_AI_DESCRIPTIONS` | `false` | Generación de descripciones con IA |

### Citas
| Flag | Default | Descripción |
|------|---------|-------------|
| `APPOINTMENT_REMINDERS` | `false` | Recordatorios automáticos WhatsApp/Email |
| `APPOINTMENT_RECURRING` | `false` | Citas recurrentes (semanal, mensual) |
| `APPOINTMENT_CALENDAR_VIEW` | `false` | Vista calendario drag-and-drop |

### Clientes
| Flag | Default | Descripción |
|------|---------|-------------|
| `CLIENT_PROFILES` | `false` | Perfiles detallados con historial médico |
| `CLIENT_COMMUNICATION` | `false` | Chat interno, notas, comunicaciones |

### Sistema
| Flag | Default | Descripción |
|------|---------|-------------|
| `DARK_MODE_ONLY` | `false` | Forzar modo oscuro (accesibilidad) |
| `EXPERIMENTAL_UI` | `false` | Componentes experimentales |
| `BETA_FEATURES` | `false` | Acceso a features beta globales |

---

## Uso en Componentes

### Hook Simple
```tsx
import { useFeatureFlag, FeatureFlags } from '@/lib/feature-flags-react';

export function ServicesPage() {
  const bulkActions = useFeatureFlag(FeatureFlags.SERVICE_BULK_ACTIONS);
  const importExport = useFeatureFlag(FeatureFlags.SERVICE_IMPORT_EXPORT);
  
  return (
    <div>
      {bulkActions && <BulkActionsToolbar />}
      {importExport && <ImportExportButtons />}
    </div>
  );
}
```

### Componente Gate (Declarativo)
```tsx
import { FeatureGate, FeatureFlags } from '@/lib/feature-flags-react';

export function ServicesPage() {
  return (
    <div>
      <FeatureGate 
        flag={FeatureFlags.SERVICE_IMPORT_EXPORT}
        fallback={<p>Próximamente: Import/Export</p>}
      >
        <ImportExportButtons />
      </FeatureGate>
      
      <AnyFeatureGate
        flags={[FeatureFlags.NEW_DASHBOARD, FeatureFlags.ADVANCED_ANALYTICS]}
        fallback={<StandardDashboard />}
      >
        <AdvancedDashboard />
      </AnyFeatureGate>
    </div>
  );
}
```

### HOC (Higher-Order Component)
```tsx
import { withFeatureFlag, FeatureFlags } from '@/lib/feature-flags-react';

const BulkActionsToolbar = withFeatureFlag(
  FeatureFlags.SERVICE_BULK_ACTIONS,
  BulkActionsToolbarComponent,
  () => <div className="text-zinc-400">Disponible en beta</div>
);

export default BulkActionsToolbar;
```

### Server-Side (Server Components / Actions)
```tsx
import { isFeatureEnabled, FeatureFlags } from '@/lib/feature-flags';

export async function ServicesPage() {
  const bulkActions = await isFeatureEnabled(FeatureFlags.SERVICE_BULK_ACTIONS);
  
  return (
    <div>
      {bulkActions && <BulkActionsToolbar />}
    </div>
  );
}
```

---

## Configuración

### Variables de Entorno (Vercel / .env.local)

```bash
# Habilitar flag en producción
KHAL_FF_SERVICE_IMPORT_EXPORT=true
KHAL_FF_NEW_DASHBOARD=true

# Deshabilitar flag
KHAL_FF_BETA_FEATURES=false
```

**Formato:** `KHAL_FF_<FLAG_NAME>=true|false` (mayúsculas, guiones bajos)

### Preferencias de Usuario (localStorage)

```javascript
// Habilitar para usuario actual (client-side)
import { setUserFeatureFlag, FeatureFlags } from '@/lib/feature-flags';

setUserFeatureFlag(FeatureFlags.BETA_FEATURES, true);
// Se guarda en localStorage: ff_beta_features = "true"

// Escuchar cambios (cross-tab sync)
window.addEventListener('feature-flag-changed', (e: CustomEvent) => {
  const { flag, enabled } = e.detail;
  console.log(`Flag ${flag} changed to ${enabled}`);
});
```

---

## Testing

### E2E Tests (Playwright)
```typescript
// tests/e2e/feature-flags.spec.ts
test('Beta features gate works', async ({ page }) => {
  // Enable via localStorage before navigation
  await page.evaluate(() => localStorage.setItem('ff_beta_features', 'true'));
  
  await page.goto('/admin/servicios');
  
  // Verify beta feature appears
  await expect(page.getByRole('button', { name: /Importar/i })).toBeVisible();
});
```

### Unit Tests (Vitest)
```typescript
// tests/unit/feature-flags.test.ts
import { isFeatureEnabledSync, FeatureFlags } from '@/lib/feature-flags';

test('returns default when no env/user override', () => {
  expect(isFeatureEnabledSync(FeatureFlags.NEW_DASHBOARD)).toBe(false);
});

test('respects environment variable', () => {
  process.env.KHAL_FF_NEW_DASHBOARD = 'true';
  expect(isFeatureEnabledSync(FeatureFlags.NEW_DASHBOARD)).toBe(true);
  delete process.env.KHAL_FF_NEW_DASHBOARD;
});
```

---

## Agregar Nueva Flag

1. **Agregar a enum** en `feature-flags.ts`:
```typescript
export enum FeatureFlags {
  // ... existentes
  MY_NEW_FEATURE = 'my_new_feature',
}
```

2. **Agregar default** en `FLAG_DEFAULTS`:
```typescript
const FLAG_DEFAULTS: Record<FeatureFlags, boolean> = {
  // ... existentes
  [FeatureFlags.MY_NEW_FEATURE]: false,
};
```

3. **Usar en componentes**:
```tsx
const enabled = useFeatureFlag(FeatureFlags.MY_NEW_FEATURE);
```

4. **Documentar aquí** en esta tabla

5. **Agregar tests** para la nueva flag

---

## Debugging

### Ver todas las flags actuales (DevTools Console)
```javascript
// En browser console
Object.entries(localStorage)
  .filter(([k]) => k.startsWith('ff_'))
  .forEach(([k, v]) => console.log(k, v));
```

### Feature Flags Panel (Admin)
```tsx
// En una página de admin solo para desarrolladores
import { useFeatureFlags, FeatureFlags } from '@/lib/feature-flags-react';

export function FeatureFlagsDebugPanel() {
  const { flags, setFlag } = useFeatureFlags();
  
  return (
    <div className="space-y-2">
      {Object.entries(flags).map(([flag, enabled]) => (
        <label key={flag} className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setFlag(flag as FeatureFlags, e.target.checked)}
          />
          <code className="text-sm">{flag}</code>
        </label>
      ))}
    </div>
  );
}
```

---

## Mejores Prácticas

1. **Naming:** Usar `snake_case` descriptivo: `service_bulk_actions`, no `sba`
2. **Defaults conservadores:** `false` por defecto, habilitar explícitamente
3. **Documentar:** Cada flag nueva debe documentarse en esta tabla
4. **Testear:** Agregar tests E2E y unit para cada flag
4. **Limpiar:** Remover flags obsoletas después de rollout completo
5. **Monitorear:** Loggear uso de flags en analytics para decisiones de rollout

---

## Migración Futura

Cuando se necesite:
- **Per-user flags:** Implementar `getDbFlag` con Supabase `user_preferences` table
- **A/B testing:** Agregar `variant` support (string/number flags)
- **Analytics:** Integrar con PostHog/GA para medir adopción
- **Audit log:** Trackear cambios de flags por admins
