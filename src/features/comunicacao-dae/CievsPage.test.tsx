import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

vi.mock('@/features/apps/components/SideBarMenuAppsAuxiliaresDae', () => ({
  default: () => null,
}));

vi.mock('@/services/CievsService', () => ({
  default: {
    getAll: vi.fn(),
    getById: vi.fn(),
    getMunicipiosPara: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

import CievsPage from './CievsPage';
import CievsService from '@/services/CievsService';

const mockedService = vi.mocked(CievsService);

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/private/apps/comunicacao-dae/cievs']}>
        <Routes>
          <Route path="/private/apps/comunicacao-dae/cievs" element={<CievsPage />} />
          <Route path="/private/apps/comunicacao-dae/cievs/:id" element={<CievsPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe('CievsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedService.getAll.mockResolvedValue({
      data: [
        {
          id_cievs: 1,
          nome: 'CIEVS Regional de teste',
          codigo: '1234567',
          created_at: '2026-07-09T12:00:00.000Z',
          updated_at: '2026-07-09T12:00:00.000Z',
          abrangencia: [],
          _count: { abrangencia: 0 },
        },
      ],
      pagination: {
        currentPage: 1,
        itemsPerPage: 10,
        total: 1,
        pages: 1,
      },
    });
    mockedService.getMunicipiosPara.mockResolvedValue([
      {
        idtipo_municipio: 10,
        codigo: '1501402',
        descricao: 'Belém',
      },
    ]);
  });

  it('distingue CNES da sede de abrangência territorial e sinaliza cadastro vazio', async () => {
    renderPage();

    expect(await screen.findByText('CIEVS Regional de teste')).toBeInTheDocument();
    expect(screen.getByText('Sem abrangência definida')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Novo CIEVS' }));

    expect(
      screen.getByText('O CNES identifica somente a sede e não define a abrangência do CIEVS.'),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/Belém/)).toBeInTheDocument();
    expect(
      screen.getByText(
        'Atenção: sem municípios selecionados, este CIEVS ficará sem abrangência definida.',
      ),
    ).toBeInTheDocument();
  });
});
