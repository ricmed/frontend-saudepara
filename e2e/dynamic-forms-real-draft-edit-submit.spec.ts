import { test, expect, type Page } from '@playwright/test';

/**
 * E2E REAL (sem mocks) — rascunho → editar → enviar.
 *
 * Só roda quando:
 * - E2E_REAL_FORMS=1
 * - E2E_ADMIN_USERNAME e E2E_ADMIN_PASSWORD estão definidos
 */

const adminUser = process.env.E2E_ADMIN_USERNAME?.trim();
const adminPass = process.env.E2E_ADMIN_PASSWORD?.trim();
const runReal = process.env.E2E_REAL_FORMS === '1';
const hasAdminCreds = Boolean(adminUser && adminPass);

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

async function getProfile(page: Page): Promise<any> {
  const res = await page.request.get('/api-auth/protected/profile');
  if (!res.ok()) throw new Error(`profile failed: ${res.status()}`);
  return await res.json();
}

test.describe('Formulários dinâmicos — fluxo REAL (draft → edit → submit)', () => {
  test.skip(!runReal, 'Defina E2E_REAL_FORMS=1 para rodar este spec.');
  test.skip(!hasAdminCreds, 'Defina E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD (admin).');

  test('cria form → cria rascunho via API → edita e envia via UI', async ({ page }) => {
    test.setTimeout(180_000);
    page.on('dialog', (d) => d.accept());

    await login(page, adminUser!, adminPass!);
    const profile = await getProfile(page);
    const userId = profile?.sub || profile?.id;
    if (!userId) throw new Error('profile sem sub/id');

    const now = Date.now();
    const agravo = `E2E_REAL_DRAFT_${now}`;
    const formName = `E2E Real Draft ${now}`;

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
              placeholder: 'e2e-real-draft-ph',
              order: 1,
              required: true,
            },
          ],
        },
      ],
    };

    let formId: number | null = null;
    let versionId: number | null = null;
    let submissionId: number | null = null;

    try {
      const createForm = await page.request.post('/api/forms', {
        data: { form_key: agravo, nome: formName, descricao: 'Criado pelo Playwright', created_by: userId },
      });
      expect(createForm.ok()).toBeTruthy();
      formId = (await createForm.json()).id;

      const createVersion = await page.request.post(`/api/forms/${formId}/versions`, {
        data: { schema_json, ui_json: {}, rules_json: {}, published_by: userId },
      });
      expect(createVersion.ok()).toBeTruthy();
      versionId = (await createVersion.json()).id;

      const publish = await page.request.post(`/api/forms/${formId}/versions/${versionId}/publish`, {
        data: { published_by: userId },
      });
      expect(publish.ok()).toBeTruthy();

      const toggleActive = await page.request.patch(`/api/forms/${formId}/toggle-active`, {
        data: { is_active: true },
      });
      expect(toggleActive.ok()).toBeTruthy();

      // criar submissão em draft via API (sem enviar)
      const createDraft = await page.request.post('/api/submissions', {
        data: { form_version_id: versionId, data_json: { obs: { e2e: 'rascunho inicial' } }, created_by: userId },
      });
      expect(createDraft.ok()).toBeTruthy();
      submissionId = (await createDraft.json()).id;

      // UI: abrir lista do formulário → editar draft → enviar
      await page.goto(`/private/formularios/${agravo}`);
      await expect(page.getByRole('heading', { name: /notificaç/i })).toBeVisible({ timeout: 60_000 });

      await expect(page.getByText(`#${submissionId}`)).toBeVisible({ timeout: 60_000 });
      await page.getByRole('button', { name: 'Editar' }).first().click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/editar/${submissionId}/?$`), {
        timeout: 60_000,
      });

      const field = page.getByRole('textbox', { name: 'e2e-real-draft-ph', exact: true });
      await expect(field).toBeVisible({ timeout: 60_000 });
      await field.fill('agora vai');

      await page.getByRole('button', { name: 'Atualizar e Enviar' }).click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 60_000 });
      await expect(page.getByText(`#${submissionId}`)).toBeVisible({ timeout: 60_000 });
      await expect(page.getByText(/Enviado/i)).toBeVisible({ timeout: 60_000 });
    } finally {
      if (formId) {
        await page.request.delete(`/api/forms/${formId}?force=true`).catch(() => {});
      }
    }
  });
});

