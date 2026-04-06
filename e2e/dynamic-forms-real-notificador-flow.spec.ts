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
  await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 90_000 });

  const pinLater = page.getByTestId('setup-pin-later');
  if (await pinLater.isVisible().catch(() => false)) {
    page.once('dialog', (d) => void d.accept());
    await pinLater.click();
  }
}

async function logout(page: Page) {
  // usa a tela de confirmação interna para garantir que o AuthProvider faça o logout real
  await page.goto('/logout');
  const confirm = page.getByRole('button', { name: /confirmar|confirm/i });
  if (await confirm.isVisible().catch(() => false)) {
    await confirm.click();
  }
  await page.waitForURL((url) => url.pathname.endsWith('/login'), { timeout: 90_000 });
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

