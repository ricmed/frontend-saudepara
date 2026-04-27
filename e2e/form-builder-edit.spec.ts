import { test, expect, type Page } from '@playwright/test';

async function offlineAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-form-edit',
        sub: 'e2e-form-edit',
        roles: ['admin'],
        groups: [],
      }),
    );
  });
}

const formEditBody = {
  id: 77,
  form_key: 'EDIT_IT',
  nome: 'Formulário Edição E2E',
  descricao: 'Mock admin editar',
  status: 'published',
  is_active: true,
  active_version_id: 501,
  categoria: 'notificacao',
  created_by: 'admin',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
  versions: [
    {
      id: 501,
      form_id: 77,
      version: 1,
      schema_json: {
        agravo: 'EDIT_IT',
        sections: [
          {
            id: 'sec_e2e_edit',
            title: 'Seção E2E',
            order: 1,
            fields: [
              {
                key: 'obs.teste',
                type: 'text',
                label: 'Campo Teste',
                order: 1,
                required: false,
              },
            ],
          },
        ],
      },
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
};

test.describe('Form builder — editar formulário (admin)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('carrega GET /forms/:id e exibe schema no construtor', async ({ page }) => {
    await offlineAdmin(page);

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms/77') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formEditBody),
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

    await page.goto('/private/formularios-admin/editar/77');

    await expect(page).not.toHaveURL(/\/access-denied/);
    await expect(page).not.toHaveURL(/\/login$/);

    await expect(page.getByRole('heading', { name: 'Editar Formulário' })).toBeVisible({
      timeout: 30_000,
    });

    await expect(page.getByLabel('Nome do Formulário *')).toHaveValue('Formulário Edição E2E');

    await expect(page.getByRole('heading', { name: 'Seção E2E' })).toBeVisible();

    // Nome técnico fica oculto por padrão; admin pode abrir "Avançado" para ver.
    await page.getByRole('button', { name: 'Avançado' }).first().click();
    const fieldCard = page.locator('input[value="Campo Teste"]').first();
    await expect(fieldCard).toBeVisible();
    await expect(page.locator('input[value="obs.teste"]').first()).toBeVisible();
  });
});
