import { test, expect, type Page } from '@playwright/test';

const runCleanup = process.env.E2E_CLEANUP_FORMS === '1';

const adminUser = process.env.E2E_ADMIN_USERNAME?.trim();
const adminPass = process.env.E2E_ADMIN_PASSWORD?.trim();
const hasAdminCreds = Boolean(adminUser && adminPass);

async function login(page: Page, username: string, password: string) {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  const usernameInput = page.getByTestId('login-username');
  const passwordInput = page.getByTestId('login-password');
  const submitButton = page.getByTestId('login-submit');

  // /login pode redirecionar de imediato se a sessão ainda for válida.
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

  const pinLater = page.getByTestId('setup-pin-later');
  if (await pinLater.isVisible().catch(() => false)) {
    page.once('dialog', (d) => void d.accept());
    await pinLater.click();
  }
}

type FormRow = {
  id: number;
  agravo_key?: string;
  nome?: string;
};

function isE2EForm(f: FormRow): boolean {
  const agravo = (f.agravo_key ?? '').toUpperCase();
  const nome = (f.nome ?? '').toUpperCase();

  // Prefixos usados nos specs reais e it/mocks
  if (agravo.startsWith('E2E_REAL_')) return true;
  if (agravo.startsWith('E2E_REAL_NOTIF_')) return true;
  if (agravo.startsWith('E2E_')) return true;

  // Fallback pelo nome (caso o agravo mude)
  if (nome.includes('E2E')) return true;

  return false;
}

test.describe('Cleanup — apagar formulários E2E (REAL envs)', () => {
  test.skip(!runCleanup, 'Defina E2E_CLEANUP_FORMS=1 para rodar este spec.');
  test.skip(!hasAdminCreds, 'Defina E2E_ADMIN_USERNAME/E2E_ADMIN_PASSWORD (admin).');

  test('remove forms E2E via /api/forms + force delete', async ({ page }) => {
    test.setTimeout(240_000);
    page.on('dialog', (d) => d.accept());

    await login(page, adminUser!, adminPass!);

    const listRes = await page.request.get('/api/forms');
    expect(listRes.ok()).toBeTruthy();
    const forms = (await listRes.json()) as FormRow[];

    const targets = forms.filter((f) => typeof f?.id === 'number' && isE2EForm(f));

    // guarda-corpo: evita deletar “muito” por acidente
    expect(targets.length).toBeLessThanOrEqual(200);

    for (const f of targets) {
      const del = await page.request.delete(`/api/forms/${f.id}?force=true`);
      expect(del.ok()).toBeTruthy();
    }
  });
});

