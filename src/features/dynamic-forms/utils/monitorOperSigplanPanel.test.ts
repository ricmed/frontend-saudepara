import { describe, expect, it } from 'vitest';
import {
  buildSigplanMunicipioPresenceMatrix,
  summarizeSigplanPresence,
} from './monitorOperSigplanPanel';

describe('monitorOperSigplanPanel', () => {
  it('marca Sim e soma pessoas de capacitação / complementar; avaliação só modalidade', () => {
    const rows = [
      {
        cabecalho: { crs_id: 1 },
        acao: {
          atividade: 'capacitacao',
          qtd_realizadas_conforme_programacao: '1',
          municipios_alcancados: ['1500800', '1500602'],
        },
        detalhamento: { capacitacao_n_pessoas: 48 },
      },
      {
        cabecalho: { crs_id: 1 },
        acao: {
          atividade: 'avaliacao',
          qtd_realizadas_conforme_programacao: '0',
          municipios_alcancados: ['1500800'],
        },
        detalhamento: { avaliacao_como: 'supervisao' },
      },
      {
        cabecalho: { crs_id: 1 },
        acao: {
          atividade: 'avaliacao',
          qtd_realizadas_conforme_programacao: '1',
          municipios_alcancados: ['1500602'],
        },
        detalhamento: { avaliacao_como: 'webnario' },
      },
      {
        cabecalho: { crs_id: 1 },
        acao: {
          atividade: 'acao_complementar',
          qtd_realizadas_conforme_programacao: '1',
          municipios_alcancados: ['1500800'],
        },
        detalhamento: { complementar_pop_coberta: 1200 },
      },
    ];

    const matrix = buildSigplanMunicipioPresenceMatrix(rows);

    expect(matrix).toEqual([
      {
        municipioId: '1500602',
        capacitacao: true,
        capacitacaoPessoas: 48,
        avaliacao: true,
        avaliacaoModalidades: ['webnario'],
        acao_complementar: false,
        acaoComplementarPessoas: 0,
      },
      {
        municipioId: '1500800',
        capacitacao: true,
        capacitacaoPessoas: 48,
        avaliacao: false,
        avaliacaoModalidades: [],
        acao_complementar: true,
        acaoComplementarPessoas: 1200,
      },
    ]);

    expect(summarizeSigplanPresence(matrix, rows)).toEqual({
      municipios: { capacitacao: 2, avaliacao: 1, acao_complementar: 1 },
      capacitacaoPessoas: 48,
      acaoComplementarPessoas: 1200,
    });
  });

  it('ignora atividades fora do escopo SIGPLAN e linhas sem município', () => {
    const matrix = buildSigplanMunicipioPresenceMatrix([
      {
        acao: {
          atividade: 'aquisicao',
          qtd_realizadas_conforme_programacao: '1',
          municipios_alcancados: ['1500800'],
        },
      },
      {
        acao: {
          atividade: 'capacitacao',
          qtd_realizadas_conforme_programacao: '1',
          municipios_alcancados: [],
        },
        detalhamento: { capacitacao_n_pessoas: 10 },
      },
    ]);
    expect(matrix).toEqual([]);
  });
});
