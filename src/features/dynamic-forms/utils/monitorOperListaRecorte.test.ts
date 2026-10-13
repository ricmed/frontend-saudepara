import { describe, expect, it } from 'vitest';
import {
  classifyMonitorOperLista,
  monitorOperListaSituacaoLabel,
  monitorOperMatchesListaRecorte,
} from './monitorOperListaRecorte';

describe('classifyMonitorOperLista', () => {
  it('programação fica só no QDQQ', () => {
    const data = { cabecalho: { momento: 'programacao' }, acao: { qtd_programadas_qdqq: '1' } };
    expect(classifyMonitorOperLista(data).situacao).toBe('programacao');
    expect(monitorOperMatchesListaRecorte(data, 'qdqq')).toBe(true);
    expect(monitorOperMatchesListaRecorte(data, 'sigplan')).toBe(false);
    expect(monitorOperMatchesListaRecorte(data, 'todas')).toBe(true);
  });

  it('relato de ação programada entra nos dois recortes', () => {
    const data = {
      cabecalho: { momento: 'relato' },
      acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '0', qdqq_escolhida: '1' },
    };
    expect(classifyMonitorOperLista(data).situacao).toBe('relato_programacao');
    expect(monitorOperMatchesListaRecorte(data, 'qdqq')).toBe(true);
    expect(monitorOperMatchesListaRecorte(data, 'sigplan')).toBe(true);
  });

  it('relato não programado entra só no SIGPLAN', () => {
    const data = {
      cabecalho: { momento: 'relato' },
      acao: { qtd_programadas_qdqq: '0', qtd_nao_programadas_qdqq: '1' },
    };
    expect(classifyMonitorOperLista(data).situacao).toBe('relato_nao_programado');
    expect(monitorOperMatchesListaRecorte(data, 'qdqq')).toBe(false);
    expect(monitorOperMatchesListaRecorte(data, 'sigplan')).toBe(true);
  });

  it('envio antigo programado e executado conta como relato da programação', () => {
    const data = {
      cabecalho: {},
      acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '1' },
    };
    expect(classifyMonitorOperLista(data).situacao).toBe('relato_programacao');
    expect(monitorOperListaSituacaoLabel('relato_programacao')).toBe('Relato da programação');
  });

  it('envio antigo só programado continua como programação', () => {
    const data = { cabecalho: {}, acao: { qtd_programadas_qdqq: '1', qtd_realizadas_conforme_programacao: '0' } };
    expect(classifyMonitorOperLista(data).situacao).toBe('programacao');
    expect(monitorOperMatchesListaRecorte(data, 'sigplan')).toBe(false);
  });
});
