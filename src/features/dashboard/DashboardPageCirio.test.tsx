import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock do dashboard pesado (só valida props recebidas)
vi.mock('@/features/dashboard/NotificationDashboardCirio', () => {
  return {
    default: (props: any) => (
      <div data-testid="mock-dashboard">
        <div data-testid="notif-count">{String(props?.notificacoes?.length ?? 0)}</div>
        <div data-testid="evento-count">{String(props?.exportOptions?.eventoOptions?.length ?? 0)}</div>
      </div>
    ),
  };
});

// Mock de serviços chamados no loadDashboardData
vi.mock('@/services/NotificacaoService', () => {
  const NotificacaoService = {
    getAll: vi.fn(),
    getPublicoOptions: vi.fn(),
    getPaisOptions: vi.fn(),
    getEstadoOptions: vi.fn(),
    getMunicipioOptions: vi.fn(),
    getRacaOptions: vi.fn(),
    getEscolaridadeOptions: vi.fn(),
    getGeneroOptions: vi.fn(),
    getAtendimentoOptions: vi.fn(),
    getSintomaOptions: vi.fn(),
    getHipoteseDiagOptions: vi.fn(),
    getTraumaOptions: vi.fn(),
    getEstabelecimentoOptions: vi.fn(),
    getEncerramentoOptions: vi.fn(),
    getCboOptions: vi.fn(),
    getBairroOptions: vi.fn(),
  };
  return { default: NotificacaoService, NotificacaoService };
});

vi.mock('@/services/EventoService', () => {
  return {
    TiposEventoService: {
      getAll: vi.fn(),
    },
  };
});

vi.mock('@/services/indexedDB', () => {
  return {
    default: {
      saveOpcoes: vi.fn(),
      getOpcoes: vi.fn(),
    },
  };
});

import DashboardPageCirio from './DashboardPageCirio';
import NotificacaoServiceModule from '@/services/NotificacaoService';
import { TiposEventoService } from '@/services/EventoService';

describe('DashboardPageCirio', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('filters notifications to only active events', async () => {
    (TiposEventoService.getAll as any).mockResolvedValue([
      { idtipo_evento: 1, descricao: 'ATIVO', ativo: 'S' },
      { idtipo_evento: 2, descricao: 'INATIVO', ativo: 'N' },
    ]);

    // Paginação: 1 página só
    (NotificacaoServiceModule.getAll as any).mockResolvedValue({
      data: [
        { original: { tipo_evento: { idtipo_evento: 1 } } }, // deve entrar
        { original: { tipo_evento: { idtipo_evento: 2 } } }, // deve sair
      ],
      meta: { total: 2, totalPages: 1, page: 1, limit: 200 },
    });

    // Options paralelas: devolver arrays vazios
    const svc: any = NotificacaoServiceModule;
    [
      'getPublicoOptions',
      'getPaisOptions',
      'getEstadoOptions',
      'getMunicipioOptions',
      'getRacaOptions',
      'getEscolaridadeOptions',
      'getGeneroOptions',
      'getAtendimentoOptions',
      'getSintomaOptions',
      'getHipoteseDiagOptions',
      'getTraumaOptions',
      'getEstabelecimentoOptions',
      'getEncerramentoOptions',
      'getCboOptions',
      'getBairroOptions',
    ].forEach((m) => svc[m].mockResolvedValue([]));

    render(<DashboardPageCirio />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('notif-count').textContent).toBe('1');
    expect(screen.getByTestId('evento-count').textContent).toBe('1');
  });

  it('renders with empty data when no active events', async () => {
    (TiposEventoService.getAll as any).mockResolvedValue([
      { idtipo_evento: 1, descricao: 'INATIVO', ativo: 'N' },
    ]);

    // Mesmo se notificações existirem, não busca quando não há eventos ativos
    (NotificacaoServiceModule.getAll as any).mockResolvedValue({
      data: [{ original: { tipo_evento: { idtipo_evento: 1 } } }],
      meta: { total: 1, totalPages: 1, page: 1, limit: 200 },
    });

    const svc: any = NotificacaoServiceModule;
    [
      'getPublicoOptions',
      'getPaisOptions',
      'getEstadoOptions',
      'getMunicipioOptions',
      'getRacaOptions',
      'getEscolaridadeOptions',
      'getGeneroOptions',
      'getAtendimentoOptions',
      'getSintomaOptions',
      'getHipoteseDiagOptions',
      'getTraumaOptions',
      'getEstabelecimentoOptions',
      'getEncerramentoOptions',
      'getCboOptions',
      'getBairroOptions',
    ].forEach((m) => svc[m].mockResolvedValue([]));

    render(<DashboardPageCirio />);

    await waitFor(() => {
      expect(screen.getByTestId('mock-dashboard')).toBeInTheDocument();
    });

    expect(screen.getByTestId('notif-count').textContent).toBe('0');
    expect(screen.getByTestId('evento-count').textContent).toBe('0');
  });
});

