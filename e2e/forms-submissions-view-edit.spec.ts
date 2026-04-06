import { test, expect, type Page } from '@playwright/test';

const formListItem = {
  id: 1,
  agravo_key: 'LIST_IT',
  nome: 'Formulário Lista E2E',
  descricao: 'Form mockado para E2E',
  status: 'published',
  is_active: true,
  active_version_id: 42,
  created_by: 'seed',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const formByAgravoBody = { ...formListItem, versions: [] };

const activeVersionBody = {
  id: 42,
  form_id: 1,
  version: 1,
  schema_json: {
    agravo: 'LIST_IT',
    sections: [
      {
        id: 's_ve',
        title: 'Dados E2E',
        order: 1,
        fields: [
          {
            key: 'obs.campo_e2e',
            type: 'text',
            label: 'Campo E2E',
            placeholder: 'list-ve-placeholder',
            order: 1,
            required: false,
          },
        ],
      },
    ],
  },
  published_at: '2026-01-01T00:00:00.000Z',
  form: { nome: 'Formulário Lista E2E', agravo_key: 'LIST_IT' },
};

const submission7 = {
  id: 7,
  form_version_id: 42,
  status: 'submitted' as const,
  data_json: { obs: { campo_e2e: 'Lido no E2E' } },
  created_by: 'it-list-flow',
  created_at: '2026-01-15T15:30:00.000Z',
  updated_at: '2026-01-15T15:30:00.000Z',
  created_offline: false,
};

const submissionsListBody = {
  data: [submission7],
  total: 1,
  page: 1,
  limit: 100,
  totalPages: 1,
};

async function offlineNotificador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-view-edit',
        sub: 'e2e-view-edit',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

async function registerFormListMocks(page: Page) {
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

    if (method === 'GET' && pathname === '/api/forms/agravo/LIST_IT/active') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeVersionBody),
      });
    }

    if (method === 'GET' && pathname === '/api/forms/agravo/LIST_IT') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(formByAgravoBody),
      });
    }

    if (method === 'GET' && pathname === '/api/submissions/7') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(submission7),
      });
    }

    if (method === 'GET' && pathname === '/api/submissions' && url.includes('form_version_id=42')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(submissionsListBody),
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
}

test.describe('Formulários — visualizar e editar a partir da lista', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('ícone Visualizar abre notificação somente leitura com dados da submissão', async ({
    page,
  }) => {
    await offlineNotificador(page);
    await registerFormListMocks(page);

    await page.goto('/private/formularios/LIST_IT');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('cell', { name: '#7' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Visualizar' }).click();

    await expect(page).toHaveURL(/\/private\/formularios\/LIST_IT\/visualizar\/7\/?$/);
    await expect(page.getByRole('heading', { name: 'Visualizar Notificação', level: 1 })).toBeVisible();
    const viewField = page.getByPlaceholder('list-ve-placeholder');
    await expect(viewField).toBeVisible({ timeout: 30_000 });
    await expect(viewField).toHaveValue('Lido no E2E', { timeout: 30_000 });
    await expect(viewField).toBeDisabled();
    // Em readOnly o FormRenderer não renderiza o rodapé (cancelar/enviar).
    await expect(page.getByRole('button', { name: 'Atualizar e Enviar' })).toHaveCount(0);
  });

  test('ícone Editar abre formulário com botão Atualizar e Enviar e campo editável', async ({
    page,
  }) => {
    await offlineNotificador(page);
    await registerFormListMocks(page);

    await page.goto('/private/formularios/LIST_IT');

    await expect(page.getByRole('cell', { name: '#7' })).toBeVisible({ timeout: 30_000 });

    await page.getByRole('button', { name: 'Editar' }).click();

    await expect(page).toHaveURL(/\/private\/formularios\/LIST_IT\/editar\/7\/?$/);
    await expect(page.getByRole('heading', { name: 'Editar Notificação', level: 1 })).toBeVisible();
    const field = page.getByPlaceholder('list-ve-placeholder');
    await expect(field).toBeVisible({ timeout: 30_000 });
    await expect(field).toHaveValue('Lido no E2E', { timeout: 30_000 });
    await expect(field).toBeEnabled();
    await expect(page.getByRole('button', { name: 'Atualizar e Enviar' })).toBeVisible();
  });
});
