import { test, expect, type Page } from '@playwright/test';

/**
 * E2E REAL (sem mocks) — requer backend + auth reais.
 *
 * Para evitar quebrar o CI padrão (que roda só com mocks), este spec só roda quando:
 * - E2E_REAL_FORMS=1
 * - E2E_ADMIN_USERNAME e E2E_ADMIN_PASSWORD estão definidos (usuário com role admin)
 *
 * Ele cria um formulário/versão/publica via API real, preenche e envia via UI,
 * confere que apareceu na lista e tenta limpar o formulário no final.
 */

const adminUser = process.env.E2E_ADMIN_USERNAME?.trim();
const adminPass = process.env.E2E_ADMIN_PASSWORD?.trim();
const runReal = process.env.E2E_REAL_FORMS === '1';
const hasAdminCreds = Boolean(adminUser && adminPass);

async function login(page: Page, username: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const usernameInput = page.getByTestId('login-username');
  const passwordInput = page.getByTestId('login-password');
  const submitButton = page.getByTestId('login-submit');

  // Em ambientes implantados, /login pode redirecionar de imediato se a sessão ainda for válida.
  const landing = await Promise.race([
    usernameInput
      .waitFor({ state: 'visible', timeout: 30_000 })
      .then(() => 'form' as const)
      .catch(() => 'timeout' as const),
    page
      .waitForURL((url) => !/^\/login\/?$/.test(url.pathname), { timeout: 30_000, waitUntil: 'domcontentloaded' })
      .then(() => 'redirect' as const)
      .catch(() => 'timeout' as const),
  ]);

  if (landing === 'redirect') return;

  await usernameInput.fill(username);
  await passwordInput.fill(password);
  await submitButton.click();
  await page.waitForURL((url) => !/^\/login\/?$/.test(url.pathname), { timeout: 90_000, waitUntil: 'domcontentloaded' });

  // PIN opcional
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

test.describe('Formulários dinâmicos — fluxo REAL (seed + submit)', () => {
  test.skip(!runReal, 'Defina E2E_REAL_FORMS=1 para rodar este spec.');
  test.skip(!hasAdminCreds, 'Defina E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD (admin).');

  test('cria form (admin) → envia notificação → aparece na lista', async ({ page }) => {
    test.setTimeout(180_000);
    page.on('dialog', (d) => d.accept());

    await login(page, adminUser!, adminPass!);
    const profile = await getProfile(page);
    const userId = profile?.sub || profile?.id;
    if (!userId) throw new Error('profile sem sub/id');

    const now = Date.now();
    const agravo = `E2E_REAL_${now}`;
    const formName = `E2E Real Form ${now}`;

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
              placeholder: 'e2e-real-ph',
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
      // 1) create form
      const createForm = await page.request.post('/api/forms', {
        data: { form_key: agravo, nome: formName, descricao: 'Criado pelo Playwright', created_by: userId },
      });
      expect(createForm.ok()).toBeTruthy();
      const created = await createForm.json();
      formId = created.id;

      // 2) create version
      const createVersion = await page.request.post(`/api/forms/${formId}/versions`, {
        data: { schema_json, ui_json: {}, rules_json: {}, published_by: userId },
      });
      expect(createVersion.ok()).toBeTruthy();
      const ver = await createVersion.json();
      versionId = ver.id;

      // 3) publish
      const publish = await page.request.post(`/api/forms/${formId}/versions/${versionId}/publish`, {
        data: { published_by: userId },
      });
      expect(publish.ok()).toBeTruthy();

      // 4) garantir que o form aparece em /private/formularios (filtra is_active=true)
      const toggleActive = await page.request.patch(`/api/forms/${formId}/toggle-active`, {
        data: { is_active: true },
      });
      expect(toggleActive.ok()).toBeTruthy();

      // 4) UI: lista → abre → nova → envia
      // Em ambientes deploy, pode haver atraso até o seed aparecer na listagem (cache/indexação).
      // Preferimos abrir diretamente pelo `agravo` e, se necessário, recarregar a lista algumas vezes.
      const openByAgravo = async () => {
        await page.goto(`/private/formularios/${agravo}`, { waitUntil: 'domcontentloaded' });
        await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 60_000 });
        await expect(page.getByRole('button', { name: /Nova Notificação/i })).toBeVisible({ timeout: 90_000 });
      };

      try {
        await openByAgravo();
      } catch {
        await page.goto('/private/formularios', { waitUntil: 'domcontentloaded' });
        await expect(page.getByRole('heading', { name: 'Formulários de Notificação' })).toBeVisible({ timeout: 90_000 });

        const item = page.getByRole('heading', { name: formName });
        const maxAttempts = 6;
        for (let i = 0; i < maxAttempts; i++) {
          if (await item.isVisible().catch(() => false)) break;
          await page.reload({ waitUntil: 'domcontentloaded' });
          await page.waitForTimeout(2_000);
        }
        await expect(item).toBeVisible({ timeout: 90_000 });
        await item.click();
        await expect(page.getByRole('button', { name: /Nova Notificação/i })).toBeVisible({ timeout: 90_000 });
      }

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 60_000 });
      await page.getByRole('button', { name: /Nova Notificação/i }).click();

      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/nova/?$`), { timeout: 60_000 });
      const field = page.getByPlaceholder('e2e-real-ph', { exact: true });
      await expect(field).toBeVisible({ timeout: 60_000 });
      await field.fill('enviado pelo e2e real');

      await page.getByRole('button', { name: 'Enviar' }).click();

      // 5) volta pra lista e deve ter ao menos 1 submissão
      await expect(page).toHaveURL(new RegExp(`/private/formularios/${agravo}/?$`), { timeout: 60_000 });
      await expect(page.getByText(/notificação\(ões\) cadastrada\(s\)/i)).toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1, { timeout: 60_000 });
    } finally {
      // cleanup best-effort
      if (formId) {
        await page.request.delete(`/api/forms/${formId}?force=true`).catch(() => {});
      }
    }
  });
});

