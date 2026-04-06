import { test, expect } from '@playwright/test';

const schemaJson = {
  agravo: 'E2E_IT',
  sections: [
    {
      id: 'sec-e2e',
      title: 'Dados E2E',
      order: 1,
      fields: [
        {
          key: 'obs.descricao_e2e',
          type: 'text',
          label: 'Descrição E2E',
          placeholder: 'e2e-placeholder',
          order: 1,
          required: true,
        },
      ],
    },
  ],
};

const activeVersionBody = {
  id: 101,
  form_id: 55,
  version: 1,
  schema_json: schemaJson,
  published_at: '2026-01-01T00:00:00.000Z',
  form: { id: 55, nome: 'Formulário E2E', agravo_key: 'E2E_IT' },
};

test.describe('Formulário dinâmico (nova notificação)', () => {
  test('carrega schema mockado, valida obrigatório e envia (create + submit)', async ({ page }) => {
    page.on('dialog', (d) => d.accept());

    let createBody: Record<string, unknown> | null = null;
    let submitted = false;

    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dynamic-form',
          sub: 'e2e-dynamic-form-user',
          id: 'e2e-dynamic-form-user',
          roles: ['notificador'],
          groups: [],
        }),
      );
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();

      if (url.includes('/api/forms/agravo/E2E_IT/active')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(activeVersionBody),
        });
      }

      if (method === 'POST' && /\/api\/submissions\/\d+\/submit\b/.test(url)) {
        submitted = true;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 999, status: 'submitted' }),
        });
      }

      if (method === 'POST' && url.includes('/api/submissions') && !url.includes('/submit')) {
        try {
          createBody = route.request().postDataJSON() as Record<string, unknown>;
        } catch {
          createBody = {};
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 999,
            form_version_id: 101,
            status: 'draft',
            data_json: (createBody as { data_json?: unknown })?.data_json ?? {},
            created_by: 'e2e-dynamic-form-user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            created_offline: false,
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

    await page.goto('/private/formularios/e2e_it/nova');

    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: 'E2E_IT' })).toBeVisible({ timeout: 30_000 });

    const submit = page.getByRole('button', { name: 'Enviar' });
    await expect(submit).toBeVisible({ timeout: 30_000 });

    await submit.click();
    await expect(page.getByText(/obrigatório/i).first()).toBeVisible();

    const field = page.getByPlaceholder('e2e-placeholder');
    await expect(field).toBeVisible({ timeout: 30_000 });
    await field.fill('Texto do teste E2E');
    await submit.click();

    await expect.poll(() => submitted, { timeout: 30_000 }).toBe(true);
    expect(createBody).toMatchObject({
      form_version_id: 101,
      created_by: 'e2e-dynamic-form-user',
    });
    expect((createBody as { data_json?: { obs?: { descricao_e2e?: string } } })?.data_json?.obs?.descricao_e2e).toBe(
      'Texto do teste E2E',
    );
  });
});
