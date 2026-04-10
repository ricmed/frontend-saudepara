import { test, expect } from '@playwright/test';

test.describe('Dashboard (Cirio) — cross-filter', () => {
  test('click no card Clínico aplica filtro e altera total', async ({ page }) => {
    test.setTimeout(120_000);
    await page.addInitScript(() => {
      localStorage.setItem('offline_mode', 'true');
      localStorage.setItem(
        'user_data',
        JSON.stringify({
          preferred_username: 'it-dashboard-cross',
          roles: ['dashboard'],
          groups: [],
        }),
      );
      // garantir aba padrão (gráficos)
      localStorage.setItem('dashboard-active-tab', 'graficos');
    });

    await page.route('**/*', async (route) => {
      const url = route.request().url();

      // Eventos (ativos)
      if (url.includes('/api/tipo-evento')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: [{ idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO', ativo: 'S' }],
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
                idnotificacao: 101,
                created_at: '2026-03-10T12:00:00.000Z',
                updated_at: '2026-03-10T12:00:00.000Z',
                residente_belem: 'E',
                original: {
                  created_at: '2026-03-10T12:00:00.000Z',
                  tipo_publico_idtipo_publico: 1,
                  tipo_genero_idtipo_genero: 1,
                  tipo_atendimento_idtipo_atendimento: 1,
                  tipo_atendimento: { descricao: 'Clínico' },
                  tipo_evento_idtipo_evento: 1,
                },
                tipo_evento: { idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO' },
                tipo_publico: { idtipo_publico: 1, descricao: 'PUB_A' },
                tipo_atendimento: { idtipo_atendimento: 1, descricao: 'Clínico' },
                tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
                paciente: {
                  idpaciente: 1,
                  nome: 'Paciente A',
                  idade: 24,
                  tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
                  tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
                },
                estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
                  idestabelecimento: 1,
                  nome: 'Estabelecimento A',
                },
              },
              {
                idnotificacao: 102,
                created_at: '2026-03-11T12:00:00.000Z',
                updated_at: '2026-03-11T12:00:00.000Z',
                residente_belem: 'E',
                original: {
                  created_at: '2026-03-11T12:00:00.000Z',
                  tipo_publico_idtipo_publico: 2,
                  tipo_genero_idtipo_genero: 1,
                  tipo_atendimento_idtipo_atendimento: 2,
                  tipo_atendimento: { descricao: 'Trauma' },
                  tipo_evento_idtipo_evento: 1,
                },
                tipo_evento: { idtipo_evento: 1, descricao: 'IT_EVENTO_ATIVO' },
                tipo_publico: { idtipo_publico: 2, descricao: 'PUB_B' },
                tipo_atendimento: { idtipo_atendimento: 2, descricao: 'Trauma' },
                tipo_encerramento: { idtipo_encerramento: 1, descricao: 'ENC' },
                paciente: {
                  idpaciente: 2,
                  nome: 'Paciente B',
                  idade: 30,
                  tipo_genero: { idtipo_genero: 1, descricao: 'Homem Cisgênero' },
                  tipo_raca: { idtipo_raca: 1, descricao: 'Branca' },
                },
                estabelecimento_notificacao_estabelecimento_idestabelecimentoToestabelecimento: {
                  idestabelecimento: 2,
                  nome: 'Estabelecimento B',
                },
              },
            ],
            meta: { total: 2, totalPages: 1, page: 1, limit: 200 },
          }),
        });
      }

      // Opções necessárias para montar gráficos e cards (processarCategoria usa exportOptions.*Options)
      if (url.includes('/api/tipo-publico')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { idtipo_publico: 1, descricao: 'PUB_A' },
            { idtipo_publico: 2, descricao: 'PUB_B' },
          ]),
        });
      }

      if (url.includes('/api/tipo-atendimento')) {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { idtipo_atendimento: 1, descricao: 'Clínico' },
            { idtipo_atendimento: 2, descricao: 'Trauma' },
          ]),
        });
      }

      // Demais endpoints usados no dashboard
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
    await expect(page).not.toHaveURL(/\/login$/);

    // Total inicial = 2
    const totalCard = page
      .getByRole('heading', { name: 'Total de Notificações' })
      .locator('..')
      .locator('p.text-4xl');
    await expect(totalCard).toHaveText('2', { timeout: 60_000 });

    // Antes do clique, não deve aparecer "Filtros Ativos"
    await expect(page.getByText('Filtros Ativos:', { exact: true })).toHaveCount(0);

    // Clicar no card "Clínico" (filtro cruzado por tipo de atendimento).
    // O card é um div clicável que contém o texto "Clínico".
    const clinicoLabel = page.getByText('Clínico', { exact: true });
    const clinicoCard = clinicoLabel.locator('..');
    await expect(clinicoCard.locator('p.text-2xl')).toHaveText('1', { timeout: 60_000 });
    await clinicoCard.click();

    await expect(page.getByRole('heading', { name: /Dashboard com Filtros Ativos/i })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText('Tipo de Atendimento:', { exact: true })).toBeVisible({ timeout: 60_000 });
    const tipoAtendimentoPill = page.locator('div').filter({ hasText: 'Tipo de Atendimento:' }).first();
    await expect(tipoAtendimentoPill).toContainText('Clínico');

    // Total deve ser recalculado após aplicar filtro.
    // Com o mock mínimo deste teste, o dataset filtrado resulta em 0.
    await expect(totalCard).toHaveText('0', { timeout: 60_000 });
  });
});

