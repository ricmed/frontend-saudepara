import { test, expect, type Page } from '@playwright/test';

async function offlineAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-form-save',
        sub: 'e2e-form-save',
        id: 'e2e-form-save',
        roles: ['admin'],
        groups: [],
      }),
    );
  });
}

test.describe('Form builder — salvar novo formulário (admin)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('cria form, cria versão e publica (mocks)', async ({ page }) => {
    await offlineAdmin(page);
    page.on('dialog', (d) => d.accept());

    let createdFormBody: any = null;
    let createdVersionBody: any = null;
    let publishedBody: any = null;
    let created = false;

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      try {
        pathname = new URL(url).pathname;
      } catch {
        pathname = '';
      }

      if (method === 'GET' && pathname === '/api/database/tables') {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
      }

      if (method === 'POST' && pathname === '/api/forms') {
        created = true;
        try {
          createdFormBody = route.request().postDataJSON();
        } catch {
          createdFormBody = route.request().postData();
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 1001,
            nome: createdFormBody?.nome ?? 'N/A',
            agravo_key: createdFormBody?.agravo_key ?? 'N/A',
            descricao: createdFormBody?.descricao ?? '',
            status: 'draft',
            is_active: false,
            active_version_id: null,
            created_by: createdFormBody?.created_by ?? 'e2e-form-save',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            versions: [],
          }),
        });
      }

      if (method === 'POST' && pathname === '/api/forms/1001/versions') {
        try {
          createdVersionBody = route.request().postDataJSON();
        } catch {
          createdVersionBody = route.request().postData();
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2001,
            form_id: 1001,
            version: 1,
            schema_json: createdVersionBody?.schema_json ?? {},
            ui_json: createdVersionBody?.ui_json ?? {},
            rules_json: createdVersionBody?.rules_json ?? {},
            published_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      }

      if (method === 'POST' && pathname === '/api/forms/1001/versions/2001/publish') {
        try {
          publishedBody = route.request().postDataJSON();
        } catch {
          publishedBody = route.request().postData();
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 2001,
            form_id: 1001,
            version: 1,
            published_at: new Date().toISOString(),
            published_by: publishedBody?.published_by ?? 'e2e-form-save',
          }),
        });
      }

      // após salvar, navega para /private/formularios-admin (lista)
      if (method === 'GET' && pathname === '/api/forms') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            created
              ? [
                  {
                    id: 1001,
                    nome: 'Formulário Salvo E2E',
                    agravo_key: 'SAVE_IT',
                    descricao: 'Criado por E2E',
                    status: 'published',
                    is_active: true,
                    active_version_id: 2001,
                    created_by: 'e2e-form-save',
                    created_at: '2026-01-01T00:00:00.000Z',
                    updated_at: '2026-01-01T00:00:00.000Z',
                    versions: [],
                  },
                ]
              : [],
          ),
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

    await page.goto('/private/formularios-admin/novo');

    await expect(page).not.toHaveURL(/\/access-denied/);
    await expect(page.getByRole('heading', { name: 'Novo Formulário' })).toBeVisible({ timeout: 30_000 });

    const nomeInput = page.getByPlaceholder('Ex: Dengue', { exact: true });
    const agravoInput = page.getByPlaceholder('Ex: DENGUE', { exact: true });
    await expect(nomeInput).toBeVisible({ timeout: 30_000 });
    await nomeInput.fill('Formulário Salvo E2E');
    await expect(agravoInput).toBeVisible({ timeout: 30_000 });
    await agravoInput.fill('save_it');

    await page.locator('textarea').first().fill('Criado por E2E');

    await page.getByRole('button', { name: 'Adicionar Seção' }).click();
    // Ao adicionar seção, ela fica ativa e o título vira um input (não um <h3>).
    await expect(page.locator('input[value=\"Nova Seção\"]').first()).toBeVisible();

    await page.getByRole('button', { name: 'Campo', exact: true }).click();

    await page.getByRole('button', { name: 'Salvar' }).click();

    await expect(page).toHaveURL(/\/private\/formularios-admin\/?$/);
    await expect(page.getByRole('heading', { name: 'Gerenciar Formulários' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Formulário Salvo E2E' })).toBeVisible();

    expect(createdFormBody).toMatchObject({
      nome: 'Formulário Salvo E2E',
      agravo_key: 'SAVE_IT',
      descricao: 'Criado por E2E',
      created_by: 'e2e-form-save',
    });
    expect(createdVersionBody?.published_by).toBe('e2e-form-save');
    expect(createdVersionBody?.schema_json?.agravo).toBe('SAVE_IT');
    expect(publishedBody).toMatchObject({ published_by: 'e2e-form-save' });
  });
});

