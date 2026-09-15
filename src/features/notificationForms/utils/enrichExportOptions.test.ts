import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FormData } from '@/features/notificationForms/components/types';
import type { ExportOptions } from '@/features/notificationForms/components/exportUtilities';

vi.mock('@/services/indexedDB', () => ({
  default: {
    getOpcoes: vi.fn(),
  },
}));

vi.mock('@/services/CBOService', () => ({
  CBOService: {
    getById: vi.fn(),
  },
}));

import indexedDBService from '@/services/indexedDB';
import { CBOService } from '@/services/CBOService';
import { enrichExportOptions } from './enrichExportOptions';

const getOpcoes = vi.mocked(indexedDBService.getOpcoes);
const getById = vi.mocked(CBOService.getById);

const baseOptions: ExportOptions = {
  eventoOptions: [],
  publicoOptions: [],
  paisOptions: [],
  estadoOptions: [],
  municipioOptions: [],
  bairroOptions: [],
  generoOptions: [],
  racaOptions: [],
  escolaridadeOptions: [],
  atendimentoOptions: [],
  sintomaOptions: [],
  hipoteseDiagOptions: [],
  traumaOptions: [],
  estabelecimentoOptions: [],
  encerramentoOptions: [],
};

describe('enrichExportOptions', () => {
  beforeEach(() => {
    getOpcoes.mockReset();
    getById.mockReset();
  });

  it('carrega CBOs do cache quando o hook não tem cboOptions', async () => {
    getOpcoes.mockResolvedValue([
      { idtipo_cbo: 42, codigo: '2231-05', descricao: 'Médico' },
    ]);

    const next = await enrichExportOptions(baseOptions, {
      profissao: '42',
    } as FormData);

    expect(getOpcoes).toHaveBeenCalledWith('cbos');
    expect(next.cboOptions).toEqual([
      { idtipo_cbo: 42, codigo: '2231-05', descricao: 'Médico' },
    ]);
    expect(getById).not.toHaveBeenCalled();
  });

  it('busca CBO por id se o selecionado não estiver no cache', async () => {
    getOpcoes.mockResolvedValue([]);
    getById.mockResolvedValue({
      idtipo_cbo: 42,
      codigo: '2231-05',
      descricao: 'Médico',
    });

    const next = await enrichExportOptions(baseOptions, {
      profissao: '42',
    } as FormData);

    expect(getById).toHaveBeenCalledWith(42);
    expect(next.cboOptions).toContainEqual({
      idtipo_cbo: 42,
      codigo: '2231-05',
      descricao: 'Médico',
    });
  });
});
