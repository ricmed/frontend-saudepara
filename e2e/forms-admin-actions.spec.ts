import { test, expect, type Page } from '@playwright/test';

async function offlineAdmin(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-admin-actions',
        sub: 'e2e-admin-actions',
        id: 'e2e-admin-actions',
        roles: ['admin'],
        groups: [],
      }),
    );
  });
}

const baseForm = {
  id: 10,
  agravo_key: 'ADMIN_IT',
  nome: 'Form Admin IT',
  descricao: 'E2E admin actions',
  status: 'published',
  is_active: true,
  active_version_id: 501,
  created_by: 'seed',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const formByIdBody = {
  ...baseForm,
  versions: [
    {
      id: 501,
      form_id: 10,
      version: 1,
      schema_json: { agravo: 'ADMIN_IT', sections: [] },
      ui_json: {},
      rules_json: {},
      published_at: '2026-01-01T00:00:00.000Z',
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
    },
  ],
};

test.describe('Admin formulários — duplicar / toggle / delete', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('toggle ativo→inativo (PATCH toggle-active)', async ({ page }) => {
    await offlineAdmin(page);
    page.on('dialog', (d) => d.accept());

    let currentActive = true;
    let toggleBody: any = null;

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
          body: JSON.stringify([{ ...baseForm, is_active: currentActive }]),
        });
      }

      if (method === 'PATCH' && pathname === '/api/forms/10/toggle-active') {
        try {
          toggleBody = route.request().postDataJSON();
        } catch {
          toggleBody = route.request().postData();
        }
        currentActive = Boolean(toggleBody?.is_active);
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...baseForm, is_active: currentActive }),
        });
      }

      if (url.includes('/api/')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      }

      return route.continue();
    });

    await page.goto('/private/formularios-admin');

    await expect(page).not.toHaveURL(/\/access-denied/);
    await expect(page.getByRole('heading', { name: 'Gerenciar Formulários' })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Ativo', { exact: true })).toBeVisible();

    await page.getByTitle('Desativar formulário').click();

    await expect(page.getByText('Inativo', { exact: true })).toBeVisible({ timeout: 30_000 });
    expect(toggleBody).toMatchObject({ is_active: false });
  });

  test('duplicar cria form + versão + publish e navega para editar novo', async ({ page }) => {
    await offlineAdmin(page);
    page.on('dialog', (d) => d.accept());

    let createdFormBody: any = null;
    let createdVersionBody: any = null;
    let publishedBody: any = null;

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
          body: JSON.stringify([baseForm]),
        });
      }

      if (method === 'GET' && pathname === '/api/forms/10') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(formByIdBody),
        });
      }

      if (method === 'POST' && pathname === '/api/forms') {
        try {
          createdFormBody = route.request().postDataJSON();
        } catch {
          createdFormBody = route.request().postData();
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 99,
            nome: createdFormBody?.nome ?? 'N/A',
            agravo_key: createdFormBody?.agravo_key ?? 'N/A',
            descricao: createdFormBody?.descricao ?? '',
            status: 'draft',
            is_active: false,
            active_version_id: null,
            created_by: createdFormBody?.created_by ?? 'e2e-admin-actions',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }),
        });
      }

      if (method === 'POST' && pathname === '/api/forms/99/versions') {
        try {
          createdVersionBody = route.request().postDataJSON();
        } catch {
          createdVersionBody = route.request().postData();
        }
        return route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            id: 199,
            form_id: 99,
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

      if (method === 'POST' && pathname === '/api/forms/99/versions/199/publish') {
        try {
          publishedBody = route.request().postDataJSON();
        } catch {
          publishedBody = route.request().postData();
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 199, form_id: 99, version: 1, published_at: new Date().toISOString() }),
        });
      }

      if (url.includes('/api/')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      }

      return route.continue();
    });

    await page.goto('/private/formularios-admin');

    await expect(page.getByRole('heading', { name: 'Gerenciar Formulários' })).toBeVisible({ timeout: 30_000 });
    await page.getByTitle('Duplicar formulário').click();

    await expect(page).toHaveURL(/\/private\/formularios-admin\/editar\/99\/?$/, { timeout: 30_000 });

    expect(createdFormBody?.created_by).toBe('e2e-admin-actions');
    expect(createdVersionBody?.published_by).toBe('e2e-admin-actions');
    expect(publishedBody).toMatchObject({ published_by: 'e2e-admin-actions' });
  });

  test('excluir falha → oferece force delete → chama DELETE ?force=true', async ({ page }) => {
    await offlineAdmin(page);

    let deleteCalls = 0;
    let forceCalled = false;

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      const method = route.request().method();
      let pathname = '';
      let search = '';
      try {
        const u = new URL(url);
        pathname = u.pathname;
        search = u.search;
      } catch {
        pathname = '';
        search = '';
      }

      if (method === 'GET' && pathname === '/api/forms') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([baseForm]),
        });
      }

      if (method === 'DELETE' && pathname === '/api/forms/10') {
        deleteCalls += 1;
        if (search.includes('force=true')) {
          forceCalled = true;
          return route.fulfill({ status: 204, body: '' });
        }
        // simular backend recusando delete normal por ter notificações
        return route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Formulário possui notificações vinculadas' }),
        });
      }

      if (url.includes('/api/')) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
      }

      return route.continue();
    });

    // confirm 1: excluir?  confirm 2: deseja excluir mesmo assim? (force)
    const confirms = ['accept', 'accept'] as const;
    let idx = 0;
    page.on('dialog', (d) => {
      if (d.type() === 'confirm') {
        const action = confirms[Math.min(idx, confirms.length - 1)];
        idx += 1;
        action === 'accept' ? d.accept() : d.dismiss();
      } else {
        d.accept();
      }
    });

    await page.goto('/private/formularios-admin');

    await expect(page.getByRole('heading', { name: 'Gerenciar Formulários' })).toBeVisible({ timeout: 30_000 });
    await page.getByTitle('Excluir formulário').click();

    await expect.poll(() => forceCalled).toBe(true);
    expect(deleteCalls).toBeGreaterThanOrEqual(2);
  });
});

