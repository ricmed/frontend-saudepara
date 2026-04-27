import { test, expect, type Page } from '@playwright/test';
import fs from 'fs';
import path from 'path';

/**
 * Fluxo UI: preencher o máximo de campos **obrigatórios** do monitor operacional + blocos principais
 * (detalhamento, custo, resumo, impacto epi), com APIs mockadas.
 *
 * Para ver o relatório com muitos cenários de uma vez, use `monitor-oper-regional-demo-variations.spec.ts`
 * (dados em `monitorOperRegionalDemoSubmissions.ts`).
 */

function loadRegionalSchema(): Record<string, unknown> {
  const p = path.join(process.cwd(), 'e2e', 'fixtures', 'monitor-oper-regional-schema.json');
  return JSON.parse(fs.readFileSync(p, 'utf8')) as Record<string, unknown>;
}

async function offlineNotificador(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('offline_mode', 'true');
    localStorage.setItem(
      'user_data',
      JSON.stringify({
        preferred_username: 'it-monitor-fill',
        sub: 'e2e-monitor-fill',
        roles: ['notificador'],
        groups: [],
      }),
    );
  });
}

/** Selects renderizados por `SelectField` não ligam label↔select (`htmlFor`); use o bloco `div.mb-4`. */
function plainSelectForLabel(page: Page, labelHasText: string) {
  return page
    .locator('div.mb-4')
    .filter({ has: page.locator('label').filter({ hasText: labelHasText }) })
    .locator('select')
    .first();
}

async function registerFormFillMocks(page: Page) {
  const schema_json = loadRegionalSchema();
  const versionId = 6011;
  const formBody = {
    id: 601,
    form_key: 'MONITOR_OPER_REGIONAL',
    nome: 'Monitor operacional — E2E preenchimento',
    status: 'published',
    is_active: true,
    active_version_id: versionId,
    created_by: 'e2e',
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
  };
  const activeVersion = {
    id: versionId,
    form_id: 601,
    version: 1,
    schema_json,
    published_at: '2026-01-01T00:00:00.000Z',
    form: { nome: formBody.nome, form_key: formBody.form_key },
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
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(activeVersion) });
    }
    if (method === 'GET' && pathname === '/api/forms/key/MONITOR_OPER_REGIONAL') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(formBody) });
    }

    if (method === 'GET' && pathname === '/api/crs/select') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ id: 42, descricao: 'CRS Regional Demo (E2E)' }]),
      });
    }

    if (method === 'GET' && pathname === '/api/monitor-atividade/select') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { value: 'capacitacao', label: 'Capacitação' },
          { value: 'avaliacao', label: 'Avaliação' },
        ]),
      });
    }

    if (method === 'GET' && pathname === '/api/monitor-programa/select') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{ value: 'imunizacao', label: 'Imunização' }]),
      });
    }

    if (method === 'GET' && pathname === '/api/tipo-municipio/select') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { idtipo_municipio: 1500800, descricao: 'Belém' },
          { idtipo_municipio: 1500602, descricao: 'Ananindeua' },
        ]),
      });
    }

    if (method === 'POST' && pathname === '/api/submissions') {
      return route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 999001,
          form_version_id: versionId,
          status: 'draft',
          data_json: {},
          created_by: 'e2e-monitor-fill',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_offline: false,
        }),
      });
    }

    const submissionGet = pathname.match(/^\/api\/submissions\/(\d+)$/);
    if (method === 'GET' && submissionGet) {
      const sid = Number(submissionGet[1]);
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: sid,
          form_version_id: versionId,
          status: 'draft',
          data_json: {},
          created_by: 'e2e-monitor-fill',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_offline: false,
        }),
      });
    }

    if (url.includes('/api/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ data: [] }) });
    }

    return route.continue();
  });
}

test.describe('Monitor operacional — preenchimento ampliado (UI)', () => {
  test.use({ storageState: { cookies: [], origins: [] } });
  test.setTimeout(120_000);

  test('preenche cabeçalho, ação, QDQQ, parte do detalhamento, custo, resumo e impacto e salva rascunho', async ({
    page,
  }) => {
    page.on('dialog', (d) => d.accept());
    await offlineNotificador(page);
    await registerFormFillMocks(page);

    await page.goto('/private/formularios/MONITOR_OPER_REGIONAL/nova');
    await expect(page).not.toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: /Nova Notificação/i, level: 1 })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Monitoramento operacional/i)).toBeVisible();

    const compBlock = page.locator('div.mb-4').filter({ hasText: 'Competência (mês/ano)' }).first();
    await compBlock.getByRole('combobox').selectOption('02');
    await compBlock.getByPlaceholder('Ano').fill('2026');

    const crsInput = page.getByLabel(/CRS \(Regional de saúde\)/i);
    await crsInput.click();
    await crsInput.fill('Demo');
    await page.getByText('CRS Regional Demo (E2E)', { exact: false }).first().click();

    await plainSelectForLabel(page, 'Área da vigilância').selectOption('imunopreveniveis');

    await page.getByLabel(/^Data da realização/i).fill('2026-02-10');

    const atividade = page.getByLabel(/Atividade/i);
    await expect(atividade).toBeEnabled({ timeout: 20_000 });
    await expect(atividade.locator('option[value="capacitacao"]')).toHaveCount(1);
    await atividade.selectOption('capacitacao');

    await plainSelectForLabel(page, 'Programada no QDQQ').selectOption('1');
    await plainSelectForLabel(page, 'Foi realizada').selectOption('1');

    const programa = page.getByLabel(/Programa alcançado/i);
    await expect(programa).toBeEnabled({ timeout: 20_000 });
    await expect(programa.locator('option[value="imunizacao"]')).toHaveCount(1);
    await programa.selectOption('imunizacao');

    const munBlock = page.locator('div.mb-4').filter({ has: page.locator('label', { hasText: /Municípios alcançados/ }) });
    await munBlock.scrollIntoViewIfNeeded();
    await munBlock.getByPlaceholder('Buscar opções...').fill('Bel');
    await munBlock.getByRole('checkbox', { name: /Belém/i }).check();
    await munBlock.getByPlaceholder('Buscar opções...').fill('Anani');
    await munBlock.getByRole('checkbox', { name: /Ananindeua/i }).check();

    await plainSelectForLabel(page, 'Capacitação - como foi efetivada').selectOption('treinamento');
    await page.getByRole('spinbutton', { name: /Nº de pessoas treinadas/i }).fill('30');

    await page.getByLabel(/3390-14 — Diárias/i).fill('100,50');
    await page.getByLabel(/3390-30 — Material de consumo/i).fill('200');

    await page.getByRole('checkbox', { name: /Objetivo da ação foi alcançado/i }).check();

    await page
      .getByRole('checkbox', { name: /Para melhorar a coleta, processamento e envio de dados/i })
      .check();

    await page.getByRole('button', { name: /Salvar Rascunho/i }).click();

    await expect(page).toHaveURL(/\/editar\/999001/i, { timeout: 30_000 });
  });
});
