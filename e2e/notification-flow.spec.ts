import { test, expect } from '@playwright/test';

/**
 * Fluxo real pós-login (Keycloak + PIN opcional).
 * Configure E2E_USERNAME e E2E_PASSWORD (GitHub: Secrets do repositório).
 * O usuário precisa de permissão para /private/comunicacao-de-caso/nova.
 */
const e2eUser = process.env.E2E_USERNAME?.trim();
const e2ePass = process.env.E2E_PASSWORD?.trim();
const hasE2ECreds = Boolean(e2eUser && e2ePass);

test.describe('Comunicação de caso — CPF após login', () => {
  test.skip(!hasE2ECreds, 'Defina E2E_USERNAME e E2E_PASSWORD para rodar este fluxo.');

  test('login, PIN opcional, formulário e mensagem de CPF incompleto ao salvar', async ({
    page,
  }) => {
    await page.goto('/login');
    await page.getByTestId('login-username').fill(e2eUser!);
    await page.getByTestId('login-password').fill(e2ePass!);
    await page.getByTestId('login-submit').click();

    await page.waitForURL((url) => !url.pathname.endsWith('/login'), { timeout: 90_000 });

    const pinLater = page.getByTestId('setup-pin-later');
    if (await pinLater.isVisible().catch(() => false)) {
      page.once('dialog', (d) => void d.accept());
      await pinLater.click();
    }

    await page.goto('/private/comunicacao-de-caso/nova');
    await page.getByTestId('notif-field-cpf').waitFor({ state: 'visible', timeout: 60_000 });

    await page.getByTestId('notif-field-cpf').fill('12345');
    await page.getByTestId('notification-save-submit').click();

    await expect(page.getByTestId('notif-cpf-error')).toContainText(/11 dígitos/i);
  });
});
