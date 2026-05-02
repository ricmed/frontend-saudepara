import { test, expect, type Page } from '@playwright/test';

const formMonitor = {
  id: 501,
  form_key: 'MONITOR_OPER_REGIONAL',
  nome: 'Monitoramento operacional — E2E',
  descricao: 'Mock',
  status: 'published',
  is_active: true,
  active_version_id: 5011,
  created_by: 'e2e',
  created_at: '2026-01-01T00:00:00.000Z',
  updated_at: '2026-01-01T00:00:00.000Z',
};

const activeVersionMonitor = {
  id: 5011,
  form_id: 501,
  version: 1,
  schema_json: {
    agravo: 'Monitoramento operacional — e2e',
    sections: [
      {
        id: 'impacto_acao',
        title: 'Impacto',
        order: 1,
        fields: [
          {
            key: 'imp_epi.coleta_processamento_envio',
            type: 'checkbox',
            label: 'Coleta (epi)',
            order: 1,
          },
        ],
      },
    ],
  },
  published_at: '2026-01-01T00:00:00.000Z',
  form: { nome: formMonitor.nome, form_key: formMonitor.form_key },
};

const baseData = {
  cabecalho: { crs_id: 7, ano: 2026, mes: 'JAN' },
  acao: {
    area: 'imunopreveniveis',
    qtd_programadas_qdqq: '1',
    qtd_realizadas_conforme_programacao: '1',
    qtd_nao_programadas_qdqq: '0',
  },
  imp_epi: { coleta_processamento_envio: true },
};

const submissionsMonitor = {
  data: [
    {
      id: 9001,
      form_version_id: 5011,
      status: 'submitted' as const,
      data_json: baseData,
      created_by: 'e2e',
      created_at: '2026-01-10T10:00:00.000Z',
      updated_at: '2026-01-10T10:00:00.000Z',
      created_offline: false,
    },
    {
      id: 9002,
      form_version_id: 5011,
      status: 'submitted' as const,
      data_json: {
        ...baseData,
        acao: { ...baseData.acao, qtd_realizadas_conforme_programacao: '0' },
        imp_epi: { coleta_processamento_envio: false },
      },
      created_by: 'e2e',
      created_at: '2026-01-11T10:00:00.000Z',
      updated_at: '2026-01-11T10:00:00.000Z',
      created_offline: false,
    },
  ],
  total: 2,
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
        preferred_username: 'it-monitor-report',
        sub: 'e2e-monitor-report',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

async function registerMonitorMocks(page: Page) {
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

    if (method === 'GET' && pathname === '/api/submissions' && url.includes('form_version_id=5011')) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(submissionsMonitor),
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

test.describe('Monitor operacional regional — relatório consolidado', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('lista exibe botão e relatório mostra totais e impacto', async ({ page }) => {
    await offlineNotificador(page);
    await registerMonitorMocks(page);

    await page.goto('/private/formularios/MONITOR_OPER_REGIONAL');
    await expect(page).not.toHaveURL(/\/login$/);

    await expect(page.getByTestId('monitor-oper-relatorios')).toBeVisible({ timeout: 30_000 });
    await page.getByTestId('monitor-oper-relatorios').click();

    await expect(page).toHaveURL(/\/private\/formularios\/MONITOR_OPER_REGIONAL\/relatorio\/?$/);
    await expect(page.getByTestId('monitor-oper-report-root')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Programadas', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Coleta (epi)')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Exportar CSV' })).toBeEnabled();

    await page.getByTestId('monitor-oper-report-back').click();
    await expect(page).toHaveURL(/\/private\/formularios\/MONITOR_OPER_REGIONAL\/?$/);
  });
});
