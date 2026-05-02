import { test, expect } from '@playwright/test';

const formListItem = {
  id: 1,
  form_key: 'LIST_IT',
  nome: 'Formulário Lista E2E',
  descricao: 'Form mockado para E2E',
  status: 'published',
  is_active: true,
  active_version_id: 42,
  created_by: 'seed',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const formByAgravoBody = {
  ...formListItem,
  versions: [],
};

const responsesListBody = {
  data: [
    {
      id: 7,
      form_version_id: 42,
      status: 'submitted' as const,
      data_json: {},
      created_by: 'it-list-flow',
      created_at: '2026-01-15T15:30:00.000Z',
      submitted_at: '2026-01-15T16:00:00.000Z',
      synced_at: null,
    },
  ],
  total: 1,
  page: 1,
  limit: 50,
  totalPages: 1,
};

test.describe('Formulários dinâmicos — lista e submissões', () => {
  test('lista de agravos mockada e tabela de notificações do agravo', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-forms-list',
          sub: 'e2e-forms-list',
          roles: ['notificador'],
          groups: [],
        }),
      );
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([formListItem]),
        });
      }

      if (method === 'GET' && pathname === '/api/forms/key/LIST_IT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formByAgravoBody),
        });
      }

      if (method === 'GET' && pathname === '/api/forms/1/responses') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(responsesListBody),
        });
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

    await page.goto('/private/formularios');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Formulários de Notificação' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByRole('heading', { name: 'Formulário Lista E2E' })).toBeVisible();

    await page.getByRole('heading', { name: 'Formulário Lista E2E' }).click();

    await expect(page).toHaveURL(/\/private\/formularios\/LIST_IT\/?$/);
    await expect(page.getByText('1 notificação(ões) cadastrada(s)')).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Lido no E2E', exact: true })).toBeVisible();
    await expect(page.getByText('Enviada')).toBeVisible();
    await expect(page.getByText('Data do envio')).toBeVisible();
  });
});
