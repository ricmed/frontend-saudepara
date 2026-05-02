import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import {
  DEMO_FORM_VERSION_ID,
  getMonitorOperDemoSubmissionsForReport,
} from '../src/features/dynamic-forms/__fixtures__/monitorOperRegionalDemoSubmissions';

/**
 * Demonstração para área técnica: relatório consolidado alimentado por vários `data_json`
 * realistas (máximo de campos do monitor operacional regional), sem depender de backend real.
 *
 * Os payloads vivem em `src/features/dynamic-forms/__fixtures__/monitorOperRegionalDemoSubmissions.ts`.
 * O schema JSON é export do backend (`e2e/fixtures/monitor-oper-regional-schema.json`).
 */

const formMonitor = {
  id: 501,
  form_key: 'MONITOR_OPER_REGIONAL',
  nome: 'Monitoramento operacional — demonstração técnica',
  descricao: 'Dados gerados por fixtures de teste',
  status: 'published',
  is_active: true,
  active_version_id: DEMO_FORM_VERSION_ID,
  created_by: 'e2e-demo',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

function loadRegionalSchema(): Record<string, unknown> {
  const p = path.join(process.cwd(), 'e2e', 'fixtures', 'monitor-oper-regional-schema.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>;
}

const demoSubmissions = getMonitorOperDemoSubmissionsForReport();

const submissionsDemoBody = {
  data: demoSubmissions,
  total: demoSubmissions.length,
  page: 1,
  limit: 500,
  totalPages: 1,
};

async function offlineNotificador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-monitor-demo',
        sub: 'e2e-monitor-demo',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

async function registerDemoMocks(page: Page) {
  const schema_json = loadRegionalSchema();
  const activeVersionMonitor = {
    id: DEMO_FORM_VERSION_ID,
    form_id: 501,
    version: 1,
    schema_json,
    published_at: '2026-01-01T00:00:00.000Z',
    form: { nome: formMonitor.nome, form_key: formMonitor.form_key },
  };

  await page.route('**/*', async (route) => {
    const url = route.request().url();
    const method = route.request().method();
    let pathname = '';
    try {
      pathname = new URL(url).pathname;
    } catch {
      pathname = '';
    }

    if (method === 'GET' && pathname === '/api/forms/key/MONITOR_OPER_REGIONAL/active') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeVersionMonitor),
      });
    }

    if (method === 'GET' && pathname === '/api/forms/key/MONITOR_OPER_REGIONAL') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(formMonitor),
      });
    }

    if (method === 'GET' && pathname === '/api/submissions' && url.includes(`form_version_id=${DEMO_FORM_VERSION_ID}`)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(submissionsDemoBody),
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
}

test.describe('Monitor operacional — cenários demo (relatório para área técnica)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('painel consolidado exibe QDQQ quadrimestral e blocos preenchidos pelos fixtures', async ({ page }) => {
    await offlineNotificador(page);
    await registerDemoMocks(page);

    await page.goto('/private/formularios/MONITOR_OPER_REGIONAL/relatorio');
    await expect(page).not.toHaveURL(/\/login$/);

    await expect(page.getByTestId('monitor-oper-report-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('1º quadrimestre (jan–abr)')).toBeVisible();
    await expect(page.getByText('6 envio(s) carregado(s)')).toBeVisible();
    await expect(page.getByText('6 linha(s) com cabeçalho + ação')).toBeVisible();
    await expect(page.getByText('Total acumulado (QDQQ — quadrimestre)')).toBeVisible();
    await expect(page.getByText('Programadas', { exact: true }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();
  });

  test('lista de envios mostra total QDQQ com os mesmos dados demo', async ({ page }) => {
    await offlineNotificador(page);
    await registerDemoMocks(page);

    await page.goto('/private/formularios/MONITOR_OPER_REGIONAL');
    await expect(page.getByText('Total acumulado (QDQQ — quadrimestre)')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Programadas', { exact: true }).first()).toBeVisible();
  });
});
