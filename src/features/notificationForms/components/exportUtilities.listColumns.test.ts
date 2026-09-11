import { describe, expect, it } from 'vitest';
import { formatNotificacaoForExport } from './exportUtilities';
import {
  EXPORT_BAIRRO_COLUMN,
  EXPORT_LOCALIDADE_COLUMN,
} from './exportColumns';

describe('formatNotificacaoForExport colunas por evento', () => {
  const item = {
    id: 1,
    original: {
      tipo_evento_idtipo_evento: 6,
      tipo_bairro: { descricao: 'Nazaré' },
      localidade_evento: { id: 11, nome: 'Centro', ativo: true },
      localidade_evento_id: 11,
      residente_belem: 'S',
      paciente: { nome: 'Paciente teste' },
    },
  };

  it('NAO_USA inclui Bairro e omite Localidade no evento', () => {
    const row = formatNotificacaoForExport(item, {
      modoLocalidadeEvento: 'NAO_USA',
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
    });

    expect(row).toHaveProperty(EXPORT_BAIRRO_COLUMN);
    expect(row).not.toHaveProperty(EXPORT_LOCALIDADE_COLUMN);
    expect(row).toHaveProperty('Residente em Belém');
  });

  it('OBRIGATORIA inclui Localidade e omite Bairro', () => {
    const row = formatNotificacaoForExport(item, {
      modoLocalidadeEvento: 'OBRIGATORIA',
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
    });

    expect(row).toHaveProperty(EXPORT_LOCALIDADE_COLUMN, 'Centro');
    expect(row).not.toHaveProperty(EXPORT_BAIRRO_COLUMN);
    expect(row).toHaveProperty('Residente em Alter do Chão');
  });
});
