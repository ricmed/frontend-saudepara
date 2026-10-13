import { describe, expect, it } from 'vitest';
import {
  listQdqqProgramacoesAbertas,
  monitorOperPickerHiddenKeys,
} from './monitorOperQdqqEscolha';

describe('listQdqqProgramacoesAbertas', () => {
  const programacao = {
    id: 10,
    data_json: {
      cabecalho: { momento: 'programacao', competencia_mes_ano: '2026-03', crs_id: '2' },
      acao: { area: 'vigilancia_sanitaria', atividade: 'fiscalizacao_inspecao', qtd_programadas_qdqq: '1' },
    },
  };

  it('inclui programação QDQQ e deixa de fora o relato', () => {
    const rows = listQdqqProgramacoesAbertas([
      programacao,
      {
        id: 11,
        data_json: {
          cabecalho: { momento: 'relato', competencia_mes_ano: '2026-04' },
          acao: { qtd_programadas_qdqq: '1', atividade: 'avaliacao' },
        },
      },
    ]);
    expect(rows.map((r) => r.id)).toEqual([10]);
    expect(rows[0]?.label).toContain('2026-03');
    expect(rows[0]?.label).toContain('Fiscalização / Inspeção');
  });

  it('inclui envio antigo programado mesmo quando já estava marcado como executado', () => {
    const rows = listQdqqProgramacoesAbertas([
      {
        id: 1,
        data_json: {
          cabecalho: { competencia_mes_ano: '2026-01' },
          acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '0', atividade: 'capacitacao' },
        },
      },
      {
        id: 2,
        data_json: {
          cabecalho: { competencia_mes_ano: '2026-02' },
          acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '1', atividade: 'avaliacao' },
        },
      },
      {
        id: 3,
        data_json: {
          cabecalho: { momento: 'programacao' },
          acao: { qdqq_escolhida: '1', atividade: 'regulacao' },
        },
      },
      {
        id: 4,
        data_json: {
          cabecalho: { competencia_mes_ano: '2026-08' },
          acao: { qtd_programadas_qdqq: '0', qtd_realizadas_conforme_programacao: '1', atividade: 'capacitacao' },
        },
      },
    ]);
    expect(rows.map((r) => r.id)).toEqual([2, 1]);
  });

  it('filtra pela competência do cabeçalho', () => {
    const rows = listQdqqProgramacoesAbertas(
      [
        {
          id: 71,
          data_json: {
            cabecalho: { competencia_mes_ano: '2026-05', crs_id: '69' },
            acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '1', atividade: 'avaliacao' },
          },
        },
        {
          id: 72,
          data_json: {
            cabecalho: { competencia_mes_ano: '2026-05', crs_id: '73' },
            acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '1', atividade: 'capacitacao' },
          },
        },
        {
          id: 489,
          data_json: {
            cabecalho: { competencia_mes_ano: '2026-10', crs_id: '71' },
            acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '0', atividade: 'avaliacao' },
          },
        },
      ],
      { todos: true, ids: [] },
      '2026-05',
    );
    expect(rows.map((r) => r.id).sort()).toEqual([71, 72]);
  });

  it('filtra pela CRS escolhida e mantém a ação do Pará inteiro', () => {
    const rows = listQdqqProgramacoesAbertas(
      [
        programacao,
        {
          id: 20,
          data_json: {
            cabecalho: { momento: 'programacao', crs_id: '9', competencia_mes_ano: '2026-05' },
            acao: { atividade: 'aquisicao' },
          },
        },
        {
          id: 21,
          data_json: {
            cabecalho: { momento: 'programacao', crs_abrangencia: 'todos', crs_id: '*', competencia_mes_ano: '2026-06' },
            acao: { atividade: 'distribuicao' },
          },
        },
      ],
      { todos: false, ids: ['2'] },
    );
    expect(rows.map((r) => r.id).sort()).toEqual([10, 21]);
  });
});

describe('monitorOperPickerHiddenKeys', () => {
  it('esconde a ação e o executou, e deixa a pergunta de programação', () => {
    const keys = monitorOperPickerHiddenKeys({
      sections: [
        { id: 'acao', fields: [{ key: 'acao.area' }] },
        { id: 'sigplan', fields: [{ key: 'acao.qtd_programadas_qdqq' }] },
        { id: 'detalhamento', fields: [{ key: 'detalhamento.capacitacao_como' }] },
      ],
    });
    expect(keys.has('acao.area')).toBe(true);
    expect(keys.has('acao.qtd_realizadas_conforme_programacao')).toBe(true);
    expect(keys.has('detalhamento.capacitacao_como')).toBe(true);
    expect(keys.has('acao.qtd_programadas_qdqq')).toBe(false);
  });
});
