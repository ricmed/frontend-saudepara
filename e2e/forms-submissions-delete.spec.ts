import { test, expect, type Page } from '@playwright/test';

const formByAgravoBody = {
  id: 1,
  agravo_key: 'LIST_IT',
  nome: 'Formulário Lista E2E',
  status: 'published',
  is_active: true,
  active_version_id: 42,
  created_by: 'seed',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  versions: [],
};

const submissionsListWithOne = {
  data: [
    {
      id: 7,
      form_version_id: 42,
      status: 'draft' as const,
      data_json: {},
      created_by: 'it-delete',
      created_at: '2026-01-15T15:30:00.000Z',
      updated_at: '2026-01-15T15:30:00.000Z',
      created_offline: false,
    },
  ],
  total: 1,
  page: 1,
  limit: 100,
  totalPages: 1,
};

const submissionsListEmpty = { data: [], total: 0, page: 1, limit: 100, totalPages: 0 };

async function offlineNotificador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-delete',
        sub: 'e2e-delete',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

test.describe('Formulários — excluir submissão (lista)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('clica em Excluir, confirma e lista fica vazia', async ({ page }) => {
    await offlineNotificador(page);

    page.on('dialog', (d) => d.accept());

    let deleted = false;
    let deleteBody: any = null;

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms/agravo/LIST_IT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formByAgravoBody),
        });
      }

      if (method === 'GET' && pathname === '/api/submissions' && url.includes('form_version_id=42')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(deleted ? submissionsListEmpty : submissionsListWithOne),
        });
      }

      if (method === 'DELETE' && pathname === '/api/submissions/7') {
        deleted = true;
        try {
          deleteBody = route.request().postDataJSON();
        } catch {
          deleteBody = route.request().postData();
        }
        return route.fulfill({ status: 204, body: '' });
      }

      if (url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }

      return route.continue();
    });

    await page.goto('/private/formularios/LIST_IT');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('cell', { name: '#7' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Excluir' }).click();

    await expect(page.getByText('Nenhuma notificação cadastrada ainda')).toBeVisible({ timeout: 30_000 });
    expect(deleteBody).toMatchObject({ deleted_by: 'user-id' });
  });
});

