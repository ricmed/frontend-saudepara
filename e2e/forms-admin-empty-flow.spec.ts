import { test, expect, type Page } from '@playwright/test';

const emptySubmissionsBody = {
  data: [] as unknown[],
  total: 0,
  page: 1,
  limit: 100,
  totalPages: 0,
};

const formEmptyIt = {
  id: 2,
  form_key: 'EMPTY_IT',
  nome: 'Agravo sem notificações',
  status: 'published',
  is_active: true,
  active_version_id: 99,
  created_by: 'seed',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const activeVersionEmptyIt = {
  id: 99,
  form_id: 2,
  version: 1,
  schema_json: {
    agravo: 'EMPTY_IT',
    sections: [
      {
        id: 's1',
        title: 'E2E',
        order: 1,
        fields: [
          {
            key: 'obs.e2e',
            type: 'text',
            label: 'Campo E2E',
            placeholder: 'empty-flow-ph',
            order: 1,
            required: false,
          },
        ],
      },
    ],
  },
  published_at: '2026-01-01T00:00:00.000Z',
  form: { nome: 'Agravo sem notificações', form_key: 'EMPTY_IT' },
};

async function offlineLogin(page: Page, roles: string[]) {
  await page.addInitScript((rs: string[]) => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-multi-flow',
        sub: 'e2e-multi-flow',
        roles: rs,
        groups: [],
      }),
    );
  }, roles);
}

test.describe('Formulários — admin e estado vazio', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('admin: lista vazia, abre construtor Novo Formulário', async ({ page }) => {
    await offlineLogin(page, ['admin']);

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms/admin') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [],
            total: 0,
            page: 1,
            limit: 30,
            totalPages: 1
          }),
        });
      }

      if (method === 'GET' && pathname === '/api/database/tables') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([]),
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

    await page.goto('/private/formularios-admin');

    await expect(page).not.toHaveURL(/\/access-denied/);
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Gerenciar Formulários' })).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByText('Nenhum formulário criado')).toBeVisible();

    await page.getByRole('button', { name: 'Criar Formulário' }).click();

    await expect(page).toHaveURL(/\/private\/formularios-admin\/novo\/?$/);
    await expect(page.getByRole('heading', { name: 'Novo Formulário' })).toBeVisible();
    await expect(page.getByText('Construtor visual de formulários SINAN/e-SUS')).toBeVisible();
  });

  test('notificador: lista de submissões vazia e CTA para nova notificação', async ({ page }) => {
    await offlineLogin(page, ['notificador']);

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms/key/EMPTY_IT') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formEmptyIt),
        });
      }

      if (method === 'GET' && pathname === '/api/forms/key/EMPTY_IT/active') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activeVersionEmptyIt),
        });
      }

      if (method === 'GET' && pathname === '/api/submissions' && url.includes('form_version_id=99')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(emptySubmissionsBody),
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

    await page.goto('/private/formularios/EMPTY_IT');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByText('0 notificação(ões) cadastrada(s)')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Nenhuma notificação cadastrada ainda')).toBeVisible();

    await page.getByRole('button', { name: 'Cadastrar Primeira Notificação' }).click();

    await expect(page).toHaveURL(/\/private\/formularios\/EMPTY_IT\/nova\/?$/);
    await expect(page.getByRole('heading', { name: 'EMPTY_IT' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByPlaceholder('empty-flow-ph')).toBeVisible();
  });
});
