import { test, expect, type Page } from '@playwright/test';

/**
 * E2E REAL (sem mocks) — admin faz seed do form e notificador envia.
 *
 * Só roda quando:
 * - E2E_REAL_FORMS=1
 * - E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD estão definidos
 * - E2E_NOTIFICADOR_USERNAME/E2E_NOTIFICADOR_PASSWORD estão definidos
 */

const runReal = process.env.E2E_REAL_FORMS === '1';

const adminUser = process.env.E2E_ADMIN_USERNAME?.trim();
const adminPass = process.env.E2E_ADMIN_PASSWORD?.trim();
const hasAdminCreds = Boolean(adminUser && adminPass);

const notifUser = process.env.E2E_NOTIFICADOR_USERNAME?.trim();
const notifPass = process.env.E2E_NOTIFICADOR_PASSWORD?.trim();
const hasNotifCreds = Boolean(notifUser && notifPass);

async function login(page: Page, username: string, password: string) {
  await page.goto('/login');
  await page.getByTestId('login-username').fill(username);
  await page.getByTestId('login-password').fill(password);
  await page.getByTestId('login-submit').click();

  const errorBox = page.locator('.bg-red-100.border-red-400');
  const offlineWarning = page.getByText('Sem Conexão', { exact: true });

  // Em alguns ambientes a navegação SPA não chega a disparar "load".
  // Esperar sair de /login (domcontentloaded) OU aparecer erro.
  const result = await Promise.race([
    page
      .waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 90_000, waitUntil: 'domcontentloaded' })
      .then(() => 'ok' as const)
      .catch(() => 'timeout' as const),
    errorBox
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => 'error' as const)
      .catch(() => 'timeout' as const),
    offlineWarning
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => 'offline' as const)
      .catch(() => 'timeout' as const),
  ]);

  if (result === 'error') {
    const msg = (await errorBox.textContent().catch(() => ''))?.trim() || 'erro no login';
    throw new Error(`Falha no login (mensagem): ${msg}`);
  }
  if (result === 'offline') {
    throw new Error('Login detectou estado offline na tela (/login).');
  }
  if (result === 'timeout') {
    throw new Error('Timeout no login: não saiu de /login e não apareceu erro visível.');
  }

  const pinLater = page.getByTestId('setup-pin-later');
  if (await pinLater.isVisible().catch(() => false)) {
    page.once('dialog', (d) => void d.accept());
    await pinLater.click();
  }
}

async function logout(page: Page) {
  // Tela protegida: LogoutConfirmation (pt-BR: botão "Sim, sair", não "Confirmar")
  await page.goto('/logout', { waitUntil: 'domcontentloaded' });
  const confirm = page.getByRole('button', {
    name: /^(Sim, sair|Yes, log out|Sí, salir|Oui, se déconnecter|Confirmar|Confirm)$/i,
  });
  await expect(confirm).toBeVisible({ timeout: 60_000 });
  await confirm.click();

  // Alguns ambientes redirecionam para /login/ (barra final) ou apenas trocam rota SPA.
  // Esperar por URL de login OU pelos campos da tela de login aparecerem.
  const usernameInput = page.getByTestId('login-username');
  const result = await Promise.race([
    page
      .waitForURL((url) => /^\/login\/?$/.test(url.pathname), { timeout: 90_000, waitUntil: 'domcontentloaded' })
      .then(() => 'url' as const)
      .catch(() => 'timeout' as const),
    usernameInput
      .waitFor({ state: 'visible', timeout: 90_000 })
      .then(() => 'ui' as const)
      .catch(() => 'timeout' as const),
  ]);

  if (result === 'timeout') {
    throw new Error(`Timeout no logout: não chegou em /login (url atual: ${page.url()})`);
  }
}

async function getProfile(page: Page): Promise<any> {
  const res = await page.request.get('/api-auth/protected/profile');
  if (!res.ok()) throw new Error(`profile failed: ${res.status()}`);
  return await res.json();
}

test.describe('Formulários dinâmicos — fluxo REAL (admin seed → notificador envia)', () => {
  test.skip(!runReal, 'Defina E2E_REAL_FORMS=1 para rodar este spec.');
  test.skip(!hasAdminCreds, 'Defina E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD (admin).');
  test.skip(!hasNotifCreds, 'Defina E2E_NOTIFICADOR_USERNAME/E2E_NOTIFICADOR_PASSWORD (notificador).');

  test('admin cria form → notificador cria e envia submissão', async ({ page }) => {
    test.setTimeout(240_000);
    page.on('dialog', (d) => d.accept());

    // 1) login admin e seed do formulário
    await login(page, adminUser!, adminPass!);
    const adminProfile = await getProfile(page);
    const adminId = adminProfile?.sub || adminProfile?.id;
    if (!adminId) throw new Error('profile admin sem sub/id');

    const now = Date.now();
    const agravo = `E2E_REAL_NOTIF_${now}`;
    const formName = `E2E Real Notificador ${now}`;

    const schema_json = {
      agravo,
      sections: [
        {
          id: `sec_${now}`,
          title: 'E2E',
          order: 1,
          fields: [
            {
              key: 'obs.e2e',
              type: 'text',
              label: 'Campo E2E',
              placeholder: 'e2e-real-notif-ph',
              order: 1,
              required: true,
            },
          ],
        },
      ],
    };

    let formId: number | null = null;
    let versionId: number | null = null;

    try {
      const createForm = await page.request.post('/api/forms', {
        data: { agravo_key: agravo, nome: formName, descricao: 'Criado pelo Playwright', created_by: adminId },
      });
      expect(createForm.ok()).toBeTruthy();
      formId = (await createForm.json()).id;

      const createVersion = await page.request.post(`/api/forms/${formId}/versions`, {
        data: { schema_json, ui_json: {}, rules_json: {}, published_by: adminId },
      });
      expect(createVersion.ok()).toBeTruthy();
      versionId = (await createVersion.json()).id;

      const publish = await page.request.post(`/api/forms/${formId}/versions/${versionId}/publish`, {
        data: { published_by: adminId },
      });
      expect(publish.ok()).toBeTruthy();

      const toggleActive = await page.request.patch(`/api/forms/${formId}/toggle-active`, {
        data: { is_active: true },
      });
      expect(toggleActive.ok()).toBeTruthy();

      // 2) logout admin e login notificador
      await logout(page);
      await login(page, notifUser!, notifPass!);

      // 3) UI: lista → abrir form → nova → enviar → aparece na lista
      await page.goto('/private/formularios');
      await expect(page.getByRole('heading', { name: 'Formulários de Notificação' })).toBeVisible({ timeout: 90_000 });

      await expect(page.getByRole('heading', { name: formName })).toBeVisible({ timeout: 120_000 });
      await page.getByRole('heading', { name: formName }).click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 90_000 });
      await page.getByRole('button', { name: /Nova Notificação/i }).click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/nova/?$`), { timeout: 90_000 });
      await page.getByRole('textbox', { name: 'e2e-real-notif-ph', exact: true }).fill('enviado pelo notificador (e2e real)');
      await page.getByRole('button', { name: 'Enviar' }).click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 90_000 });
      await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 90_000 });
    } finally {
      // cleanup best-effort (admin)
      if (formId) {
        try {
          // garantir que temos sessão admin para apagar
          await logout(page).catch(() => {});
          await login(page, adminUser!, adminPass!);
        } catch {
          // ignore
        }
        await page.request.delete(`/api/forms/${formId}?force=true`).catch(() => {});
      }
    }
  });
});

