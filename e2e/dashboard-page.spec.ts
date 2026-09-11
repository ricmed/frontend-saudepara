import { test, expect } from '@playwright/test';

test.describe('Dashboard (Cirio) page', () => {
  test('loads /dashboard-page with offline login and mocked API', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dashboard',
          roles: ['dashboard'],
          groups: [],
        }),
      );
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      // Eventos (ativos)
      if (url.includes('/api/tipo-evento')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              idtipo_evento: 1,
              descricao: 'IT_EVENTO_ATIVO',
              ativo: 'S',
              modo_localidade_evento: 'NAO_USA',
            }],
          }),
        });
      }

      // Listagem paginada de notificações (NotificacaoService.getAll -> /api/notificacao)
      if (url.includes('/api/notificacao') && url.includes('page=')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                idnotificacao: 123,
                created_at: '2026-03-10T12:00:00.000Z',
                updated_at: '2026-03-10T12:00:00.000Z',
                residente_belem: 'E',
                tipo_evento_idtipo_evento: 1,
                tipo_evento: { idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO' },
                tipo_publico: { idtipo_publico: 1, descricao: 'PUB' },
                tipo_atendimento: { idtipo_atendimento: 1, descricao: 'ATEND' },
                tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
                paciente: {
                  idpaciente: 1,
                  nome: 'Paciente IT',
                  idade: 24,
                  tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
                  tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
                },
                estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
                  idestabelecimento: 1,
                  nome: 'Estabelecimento IT',
                },
              },
            ],
            meta: { total: 1, totalPages: 1, page: 1, limit: 200 },
          }),
        });
      }

      // Demais codelists/options usados no dashboard (retornar vazio é suficiente para render)
      if (url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [] }),
        });
      }

      return route.continue();
    });

    await page.goto('/dashboard-page');

    // A rota é protegida; offline login precisa evitar redirect.
    await expect(page).not.toHaveURL(/\/login$/);

    // O dashboard principal se identifica com data-dashboard="main"
    await expect(page.locator('[data-dashboard="main"]')).toBeVisible({ timeout: 60_000 });
  });

  test('applies global date range filter and updates total notifications', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dashboard',
          roles: ['dashboard'],
          groups: [],
        }),
      );
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/tipo-evento')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{
              idtipo_evento: 1,
              descricao: 'IT_EVENTO_ATIVO',
              ativo: 'S',
              modo_localidade_evento: 'NAO_USA',
            }],
          }),
        });
      }

      if (url.includes('/api/notificacao') && url.includes('page=')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                idnotificacao: 123,
                created_at: '2026-03-10T12:00:00.000Z',
                updated_at: '2026-03-10T12:00:00.000Z',
                residente_belem: 'E',
                tipo_evento_idtipo_evento: 1,
                tipo_evento: { idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO' },
                tipo_publico: { idtipo_publico: 1, descricao: 'PUB' },
                tipo_atendimento: { idtipo_atendimento: 1, descricao: 'ATEND' },
                tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
                paciente: {
                  idpaciente: 1,
                  nome: 'Paciente IT 1',
                  idade: 24,
                  tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
                  tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
                },
                estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
                  idestabelecimento: 1,
                  nome: 'Estabelecimento IT',
                },
              },
              {
                idnotificacao: 124,
                created_at: '2026-03-20T12:00:00.000Z',
                updated_at: '2026-03-20T12:00:00.000Z',
                residente_belem: 'E',
                tipo_evento_idtipo_evento: 1,
                tipo_evento: { idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO' },
                tipo_publico: { idtipo_publico: 1, descricao: 'PUB' },
                tipo_atendimento: { idtipo_atendimento: 1, descricao: 'ATEND' },
                tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
                paciente: {
                  idpaciente: 2,
                  nome: 'Paciente IT 2',
                  idade: 24,
                  tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
                  tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
                },
                estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
                  idestabelecimento: 1,
                  nome: 'Estabelecimento IT',
                },
              },
            ],
            meta: { total: 2, totalPages: 1, page: 1, limit: 200 },
          }),
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

    await page.goto('/dashboard-page');
    await expect(page.locator('[data-dashboard="main"]')).toBeVisible({ timeout: 60_000 });

    const totalValue = page
      .locator('h3', { hasText: 'Total de Notificações' })
      .locator('..')
      .locator('p.text-4xl');

    await expect(totalValue).toContainText('2', { timeout: 60_000 });

    // Abrir configuração do filtro (isso também ativa o filtro se estiver desabilitado)
    await page.getByRole('button', { name: 'Configurar' }).click();

    const dateInputs = page.locator('input[type="date"]');
    await expect(dateInputs).toHaveCount(2);

    // Filtrar para incluir só a notificação do dia 2026-03-10
    await dateInputs.nth(0).fill('2026-03-10'); // start
    await dateInputs.nth(1).fill('2026-03-10'); // end

    await page.getByRole('button', { name: 'Aplicar' }).click();

    await expect(totalValue).toContainText('1', { timeout: 60_000 });

    // Desativar pelo toggle e garantir que volta ao total completo
    await page.getByTitle('Desativar filtro de período').click();
    await expect(totalValue).toContainText('2', { timeout: 60_000 });

    // Resetar deve limpar config salva e manter filtro desabilitado
    await page.getByTitle('Resetar e limpar configuração salva').click();
    await expect(page.getByText('Mostrando todas as notificações')).toBeVisible();
  });

  test('hides Bairros de Residência only when the selected event uses locality mode', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dashboard',
          roles: ['dashboard'],
          groups: [],
        }),
      );
    });

    const notification = (id: number, eventId: number, eventLabel: string) => ({
      idnotificacao: id,
      created_at: '2026-03-10T12:00:00.000Z',
      updated_at: '2026-03-10T12:00:00.000Z',
      residente_belem: 'E',
      tipo_evento_idtipo_evento: eventId,
      tipo_evento: { idtipo_evento: eventId, descricao: eventLabel },
      tipo_publico: { idtipo_publico: 1, descricao: 'PUB' },
      tipo_atendimento: { idtipo_atendimento: 1, descricao: 'ATEND' },
      tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
      paciente: {
        idpaciente: id,
        nome: `Paciente IT ${id}`,
        idade: 24,
        tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
        tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
      },
      estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
        idestabelecimento: 1,
        nome: 'Estabelecimento IT',
      },
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      if (url.includes('/api/tipo-evento')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [
              {
                idtipo_evento: 1,
                descricao: 'IT_EVENTO_ATIVO',
                ativo: 'S',
                modo_localidade_evento: 'NAO_USA',
              },
              {
                idtipo_evento: 2,
                descricao: 'IT_EVENTO_LOCALIDADE',
                ativo: 'S',
                modo_localidade_evento: 'OBRIGATORIA',
              },
            ],
          }),
        });
      }

      if (url.includes('/api/notificacao') && url.includes('page=')) {
        const eventId = new URL(url).searchParams.get('eventoId');
        const data = eventId === '2'
          ? [notification(201, 2, 'IT_EVENTO_LOCALIDADE')]
          : [
              notification(101, 1, 'IT_EVENTO_ATIVO'),
              notification(201, 2, 'IT_EVENTO_LOCALIDADE'),
            ];

        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data,
            meta: { total: data.length, totalPages: 1, page: 1, limit: 200 },
          }),
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

    await page.goto('/dashboard-page');
    await expect(page.locator('[data-dashboard="main"]')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByText('Bairros de Residência')).toBeVisible();
    await expect(page.locator('[data-dashboard="event-localities"]')).toHaveCount(0);

    const eventSelect = page.locator('label', { hasText: 'Evento' }).locator('xpath=following-sibling::select');
    await eventSelect.selectOption({ label: 'IT_EVENTO_LOCALIDADE' });
    await expect(page.getByText('Bairros de Residência')).toHaveCount(0);
    await expect(page.locator('[data-dashboard="event-localities"]')).toBeVisible();
    await expect(page.getByText('Países de Residência')).toBeVisible();
    await expect(page.getByText('Municípios de Residência')).toBeVisible();

    await eventSelect.selectOption({ label: 'IT_EVENTO_ATIVO' });
    await expect(page.getByText('Bairros de Residência')).toBeVisible();
    await expect(page.locator('[data-dashboard="event-localities"]')).toHaveCount(0);
  });

  test('back button returns to the communication list', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dashboard',
          roles: ['dashboard', 'notificador'],
          groups: ['/grupo_notificador'],
        }),
      );
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();
      if (url.includes('/api/')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ data: [], meta: { total: 0, totalPages: 0, page: 1, limit: 20 } }),
        });
      }
      return route.continue();
    });

    await page.goto('/dashboard-page');
    await expect(page.locator('[data-dashboard="main"]')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('dashboard-back').click();
    await expect(page).toHaveURL(/\/private\/comunicacao-de-caso$/);
  });
});

