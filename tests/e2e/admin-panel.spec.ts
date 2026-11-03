import type { Page } from '@playwright/test';
import { test, expect } from '@playwright/test';

/**
 * Admin Panel E2E Tests — Critical Path Coverage
 *
 * Tests the authenticated admin flows:
 * - Login (OTP + Password modes)
 * - Services CRUD
 * - Appointments management
 * - Clients listing
 *
 * Runs against the zero-dep Supabase stub + next dev server.
 */

// Test data
const ADMIN_EMAIL = 'admin@khal.test';
const TEST_SERVICE = {
  name: 'Test Service E2E',
  duration: 60,
  price: 15000,
  deposit: 10000,
};

test.describe('Admin Panel — Authentication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/login');
  });

  test('Login page loads with both auth modes', async ({ page }) => {
    // Verify page loads
    await expect(page.getByRole('heading', { name: 'Acceso al panel' })).toBeVisible();

    // Verify both modes present
    await expect(page.getByRole('button', { name: /Enviar código/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Usar contraseña/i })).toBeVisible();
  });

  test('OTP flow — code input appears after email submit', async ({ page }) => {
    // Fill email
    await page.getByLabel('Email').fill(ADMIN_EMAIL);

    // Submit OTP request
    await page.getByRole('button', { name: /Enviar código/i }).click();

    // Verify code input appears
    await expect(page.getByLabel('Código')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole('button', { name: /Verificar/i })).toBeVisible();
  });

  test('Password mode toggle works', async ({ page }) => {
    // Switch to password mode
    await page.getByRole('button', { name: /Usar contraseña/i }).click();

    // Verify password field appears
    await expect(page.getByLabel('Contraseña')).toBeVisible();
    await expect(page.getByRole('button', { name: /Iniciar sesión/i })).toBeVisible();

    // Switch back to OTP mode
    await page.getByRole('button', { name: /Usar código/i }).click();
    await expect(page.getByLabel('Código')).toBeHidden();
  });
});

test.describe('Admin Panel — Services CRUD', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/servicios');
  });

  test('Services list loads and displays table', async ({ page }) => {
    // Verify page loads
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Duración' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Precio' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Seña' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Visible' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Acciones' })).toBeVisible();
  });

  test('Create service flow', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /Crear servicio/i }).click();

    // Fill form
    await page.getByLabel('Nombre').fill(TEST_SERVICE.name);
    await page.getByLabel('Duración (min)').fill(String(TEST_SERVICE.duration));
    await page.getByLabel('Precio').fill(String(TEST_SERVICE.price));
    await page.getByLabel('Seña').fill(String(TEST_SERVICE.deposit));

    // Submit
    await page.getByRole('button', { name: /Guardar/i }).click();

    // Verify service appears in list
    await expect(page.getByRole('cell', { name: TEST_SERVICE.name })).toBeVisible({ timeout: 10_000 });
  });

  test('Toggle service visibility', async ({ page }) => {
    // Find the test service row
    const row = page.getByRole('row', { name: TEST_SERVICE.name });

    // Click visibility toggle
    const toggle = row.getByRole('switch', { name: /Visible/i });
    const initialState = await toggle.isChecked();

    await toggle.click();

    // Verify state changed
    await expect(toggle).toBeChecked({ checked: !initialState });
  });

  test('Soft delete service', async ({ page }) => {
    const row = page.getByRole('row', { name: TEST_SERVICE.name });

    // Click delete button
    await row.getByRole('button', { name: /Eliminar/i }).click();

    // Confirm in modal
    await page.getByRole('button', { name: /Confirmar/i }).click();

    // Verify service no longer visible (soft deleted)
    await expect(row).toBeHidden({ timeout: 10_000 });
  });
});

test.describe('Admin Panel — Appointments', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/citas');
  });

  test('Appointments list loads with filters', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Citas' })).toBeVisible();

    // Verify filters
    await expect(page.getByRole('combobox', { name: /Estado/i })).toBeVisible();
    await expect(page.getByLabel('Fecha desde')).toBeVisible();
    await expect(page.getByLabel('Fecha hasta')).toBeVisible();
    await expect(page.getByLabel('Servicio')).toBeVisible();
  });

  test('Filter appointments by status', async ({ page }) => {
    // Select confirmed status
    await page.getByRole('combobox', { name: /Estado/i }).selectOption('confirmed');

    // Verify filtered results
    await expect(page.getByRole('cell', { name: /Confirmado/i })).toBeVisible({ timeout: 10_000 });
  });

  test('Create appointment flow', async ({ page }) => {
    await page.getByRole('button', { name: /Crear cita/i }).click();

    // Fill form (assuming client exists)
    await page.getByLabel('Cliente').click();
    await page.getByRole('option', { name: /Test Client/i }).first().click();

    await page.getByLabel('Servicio').click();
    await page.getByRole('option', { name: TEST_SERVICE.name }).first().click();

    await page.getByLabel('Fecha').fill('2026-11-15');
    await page.getByLabel('Hora').fill('10:00');

    await page.getByRole('button', { name: /Guardar/i }).click();

    // Verify appointment appears
    await expect(page.getByRole('cell', { name: /Test Client/i })).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Admin Panel — Clients', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/clientes');
  });

  test('Clients list loads', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Clientes' })).toBeVisible();

    // Verify table headers
    await expect(page.getByRole('columnheader', { name: 'Nombre' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Teléfono' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Total citas' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Última cita' })).toBeVisible();
  });

  test('Client detail modal opens', async ({ page }) => {
    // Click on first client row
    const firstRow = page.getByRole('row').first();
    await firstRow.click();

    // Verify modal opens
    await expect(page.getByRole('dialog', { name: /Detalle del cliente/i })).toBeVisible();

    // Verify client info displayed
    await expect(page.getByText(/Citas:/i)).toBeVisible();
  });
});

test.describe('Admin Panel — Theme Toggle', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin');
  });

  test('Theme toggle flips and persists', async ({ page }) => {
    const toggle = page.getByRole('button', { name: /Cambiar modo claro\/oscuro/i });
    await expect(toggle).toBeVisible();

    const classBefore = await page.evaluate(() => document.documentElement.className);
    await toggle.click();
    const classAfter = await page.evaluate(() => document.documentElement.className);

    expect(classAfter).not.toBe(classBefore);

    // Persisted
    const stored = await page.evaluate(() => localStorage.getItem('theme'));
    expect(['light', 'dark']).toContain(stored);

    await page.reload();
    const classReload = await page.evaluate(() => document.documentElement.className);
    expect(classReload).toBe(classAfter);
  });
});

test.describe('Admin Panel — Accessibility', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Keyboard navigation works on services page', async ({ page }) => {
    await page.goto('/admin/servicios');

    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // First focusable should be create button or first row action
    const focused = await page.evaluate(() => document.activeElement?.tagName);
    expect(['BUTTON', 'A', 'INPUT', 'SELECT']).toContain(focused);
  });

  test('Focus indicators visible', async ({ page }) => {
    await page.goto('/admin/servicios');

    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement);

    // Check focus ring is visible (not outline: none)
    const hasFocusRing = await page.evaluate((el) => {
      const styles = getComputedStyle(el);
      return styles.outline !== 'none' || styles.boxShadow.includes('0 0');
    }, focusedElement);

    expect(hasFocusRing).toBe(true);
  });

  test('All form inputs have labels', async ({ page }) => {
    await page.goto('/admin/login');

    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const label = await page.locator(`label[for="${id}"]`).count();
      expect(label).toBeGreaterThan(0);
    }
  });
});

test.describe('Admin Panel — Visual Regression', () => {
  test.use({ storageState: 'playwright/.auth/admin.json' });

  test('Dashboard visual baseline', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Panel de control' })).toBeVisible();

    await expect(page).toHaveScreenshot('admin-dashboard.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });

  test('Services list visual baseline', async ({ page }) => {
    await page.goto('/admin/servicios');
    await expect(page.getByRole('heading', { name: 'Servicios' })).toBeVisible();

    await expect(page).toHaveScreenshot('admin-services.png', {
      maxDiffPixels: 100,
      threshold: 0.2,
    });
  });
});
