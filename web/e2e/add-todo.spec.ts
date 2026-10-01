/**
 * Hermetic oracle for story card add-todo: a signed-in user with an empty
 * to-do list submits a task title on the dashboard and sees it in the list.
 */
import { test, expect, type Page } from '@playwright/test';

async function mockApi(page: Page): Promise<string[]> {
  const posted: string[] = [];
  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const method = req.method().toUpperCase();
    const url = new URL(req.url());
    if (url.pathname.endsWith('/api/todos') && method === 'POST') {
      const { title } = req.postDataJSON() as { title: string };
      posted.push(title);
      await route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ id: `t-${posted.length}`, title, completed: false, createdAt: new Date().toISOString() }),
      });
      return;
    }
    const body = method === 'GET' ? [] : { ok: true };
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  return posted;
}

async function seedSession(page: Page): Promise<void> {
  const user = { id: 'u-USER', email: 'user@example.com', name: 'USER', role: 'USER' };
  await page.addInitScript((u) => {
    localStorage.setItem('user', JSON.stringify(u));
    localStorage.setItem('isAuthenticated', 'true');
  }, user);
}

test.use({ serviceWorkers: 'block' });

test('user adds a task to an empty to-do list', async ({ page }) => {
  const posted = await mockApi(page);
  await seedSession(page);
  await page.goto('/#/dashboard');

  const list = page.getByTestId('todo-list');
  await expect(list).toBeVisible({ timeout: 10_000 });
  await expect(page.getByTestId('todo-empty')).toBeVisible();
  await expect(page.getByText('Your content will appear here.')).toHaveCount(0);

  await page.getByTestId('todo-title-input').fill('Buy milk');
  await expect(page.getByTestId('todo-add')).toBeEnabled();
  await page.getByTestId('todo-add').click();

  await expect(list.getByText('Buy milk')).toBeVisible();
  await expect(page.getByTestId('todo-title-input')).toHaveValue('');
  await expect(page.getByTestId('todo-empty')).toHaveCount(0);
  expect(posted).toEqual(['Buy milk']);
});
