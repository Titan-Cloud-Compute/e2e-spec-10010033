/**
 * Hermetic oracle for the foundation auth guards (admin_only).
 * Every /api/** call is mocked; the session is seeded in localStorage the same
 * way AuthService persists it.
 */
import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page): Promise<void> {
  await page.route('**/api/**', async (route) => {
    const method = route.request().method().toUpperCase();
    const body = method === 'GET' ? [] : { ok: true };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
}

async function seedSession(page: Page, role: 'USER' | 'ADMIN'): Promise<void> {
  const user = { id: `u-${role}`, email: `${role.toLowerCase()}@example.com`, name: role, role };
  await page.addInitScript((u) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('isAuthenticated', 'true');
  }, user);
}

test.use({ serviceWorkers: 'block' });
test.beforeEach(async ({ page }) => { await mockApi(page); });

test('signed-out visitor opening /#/admin/users lands on sign-in', async ({ page }) => {
  await page.goto('/#/admin/users');
  await expect(page).toHaveURL(/#\/login/, { timeout: 10_000 });
});

test('signed-out visitor opening /#/dashboard lands on sign-in', async ({ page }) => {
  await page.goto('/#/dashboard');
  await expect(page).toHaveURL(/#\/login/, { timeout: 10_000 });
});

test("a 'USER' session opening /#/admin/users lands on the dashboard", async ({ page }) => {
  await seedSession(page, 'USER');
  await page.goto('/#/admin/users');
  await expect(page).toHaveURL(/#\/dashboard/, { timeout: 10_000 });
  await expect(page.locator('aside.sidebar')).toBeVisible();
});

test("an 'ADMIN' session stays on /#/admin/users inside the sidebar shell", async ({ page }) => {
  await seedSession(page, 'ADMIN');
  await page.goto('/#/admin/users');
  await expect(page.locator('aside.sidebar')).toBeVisible({ timeout: 10_000 });
  expect(page.url()).toMatch(/#\/admin\/users/);
});
