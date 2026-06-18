import { describe, expect, it } from 'vitest';
import { TIPO_EXPOSICAO_HBV } from '@/features/dynamic-forms/utils/hepatiteCriancaExposicao';
import {
  buildHepatiteCriancaListSummary,
  getHepatiteDefaultVisibleListColIds,
  getHepatiteCriancaListColumnSpecs,
} from './hepatiteCriancaListColumns';

describe('hepatiteCriancaListColumns', () => {
  const municipioMaps = {
    byIbge: { '150140': 'Belém' },
    byId: {},
  };

  it('monta resumo com nome, exposição e município', () => {
    const summary = buildHepatiteCriancaListSummary(
      {
        id: 1,
        data_json: {
          paciente: { nome: 'Ana Silva', idade: 10 },
          notificacao: {
            tipo_exposicao_hepatite: TIPO_EXPOSICAO_HBV,
            dt_notificacao: '2026-01-15',
            municipio_notificacao_ibge: '150140',
          },
        },
      },
      municipioMaps,
    );
    expect(summary.pacienteNome).toBe('Ana Silva');
    expect(summary.tipoExposicaoLabel).toContain('HBV');
    expect(summary.municipioLabel).toBe('Belém');
    expect(summary.idadeMeses).toBe(10);
  });

  it('colunas padrão incluem campos epidemiológicos', () => {
    const ids = getHepatiteCriancaListColumnSpecs().map((c) => c.id);
    const defaults = getHepatiteDefaultVisibleListColIds(ids);
    expect(defaults).toContain('nome_crianca');
    expect(defaults).toContain('tipo_exposicao');
    expect(defaults).toContain('dt_notificacao');
    expect(defaults).not.toContain('cpf');
  });
});
