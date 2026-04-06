import { test, expect, type Page } from '@playwright/test';

const activeVersionBody = {
  id: 42,
  form_id: 1,
  version: 1,
  schema_json: {
    agravo: 'LIST_IT',
    sections: [
      {
        id: 's_up',
        title: 'Dados E2E',
        order: 1,
        fields: [
          {
            key: 'obs.campo_e2e',
            type: 'text',
            label: 'Campo E2E',
            placeholder: 'update-submit-ph',
            order: 1,
            required: true,
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
  status: 'draft' as const,
  data_json: { obs: { campo_e2e: 'Valor inicial' } },
  created_by: 'it-update',
  created_at: '2026-01-15T15:30:00.000Z',
  updated_at: '2026-01-15T15:30:00.000Z',
  created_offline: false,
};

async function offlineNotificador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-update-submit',
        sub: 'e2e-update-submit',
        id: 'e2e-update-submit',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

test.describe('Formulários — editar e enviar (update + submit)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('edita campo, clica Atualizar e Enviar, chama PUT e POST submit', async ({ page }) => {
    await offlineNotificador(page);

    page.on('dialog', (d) => d.accept());

    let updateBody: any = null;
    let submitBody: any = null;
    let updated = false;
    let submitted = false;

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/forms/agravo/LIST_IT/active') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activeVersionBody),
        });
      }

      if (method === 'GET' && pathname === '/api/submissions/7') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(submission7),
        });
      }

      if (method === 'PUT' && pathname === '/api/submissions/7') {
        updated = true;
        try {
          updateBody = route.request().postDataJSON();
        } catch {
          updateBody = route.request().postData();
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...submission7,
            status: 'draft',
            data_json: updateBody?.data_json ?? submission7.data_json,
          }),
        });
      }

      if (method === 'POST' && pathname === '/api/submissions/7/submit') {
        submitted = true;
        try {
          submitBody = route.request().postDataJSON();
        } catch {
          submitBody = route.request().postData();
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...submission7,
            status: 'submitted',
            submitted_at: new Date().toISOString(),
          }),
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

    await page.goto('/private/formularios/LIST_IT/editar/7');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'Editar Notificação', level: 1 })).toBeVisible({
      timeout: 30_000,
    });

    const field = page.getByPlaceholder('update-submit-ph');
    await expect(field).toBeVisible({ timeout: 30_000 });
    await expect(field).toHaveValue('Valor inicial', { timeout: 30_000 });

    await field.fill('Valor atualizado');
    await page.getByRole('button', { name: 'Atualizar e Enviar' }).click();

    await expect.poll(() => updated).toBe(true);
    await expect.poll(() => submitted).toBe(true);

    expect(updateBody).toMatchObject({
      data_json: { obs: { campo_e2e: 'Valor atualizado' } },
      updated_by: 'e2e-update-submit',
    });
    expect(submitBody).toMatchObject({ submitted_by: 'e2e-update-submit' });
  });
});

