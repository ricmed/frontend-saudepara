/**
 * Unit smoke: obstáculo options filtered by atividade.
 */
import {
  MONITOR_OPER_OBSTACULOS_ACAO_COMPLEMENTAR,
  MONITOR_OPER_OBSTACULOS_AQUISICAO,
  MONITOR_OPER_OBSTACULOS_CAPACITACAO,
  MONITOR_OPER_OBSTACULOS_DISTRIBUICAO,
  MONITOR_OPER_OBSTACULOS_FISCALIZACAO,
  monitorOperObstaculoOptionsForAtividade,
} from './monitorOperObstaculoOptions';

describe('monitorOperObstaculoOptionsForAtividade', () => {
  it('retorna só capacitação quando atividade=capacitacao', () => {
    const opts = monitorOperObstaculoOptionsForAtividade('capacitacao');
    expect(opts).toEqual(MONITOR_OPER_OBSTACULOS_CAPACITACAO);
    expect(opts).toHaveLength(8);
    expect(opts.some((o) => o.value.startsWith('falta_insumos'))).toBe(false);
  });

  it('Avaliação e análise usa a mesma lista de Capacitação', () => {
    expect(monitorOperObstaculoOptionsForAtividade('avaliacao')).toEqual(
      MONITOR_OPER_OBSTACULOS_CAPACITACAO,
    );
  });

  it('Ação complementar: só falta de insumos (3)', () => {
    const opts = monitorOperObstaculoOptionsForAtividade('acao_complementar');
    expect(opts).toEqual(MONITOR_OPER_OBSTACULOS_ACAO_COMPLEMENTAR);
    expect(opts).toHaveLength(3);
    expect(opts.every((o) => o.value.startsWith('falta_insumos'))).toBe(true);
  });

  it('Aquisição: orçamentários e gestão', () => {
    expect(monitorOperObstaculoOptionsForAtividade('aquisicao')).toEqual(
      MONITOR_OPER_OBSTACULOS_AQUISICAO,
    );
  });

  it('Distribuição: contrato terceirizado', () => {
    expect(monitorOperObstaculoOptionsForAtividade('distribuicao')).toEqual(
      MONITOR_OPER_OBSTACULOS_DISTRIBUICAO,
    );
  });

  it('Fiscalização/inspeção: adesão, articulação e participação', () => {
    expect(monitorOperObstaculoOptionsForAtividade('fiscalizacao_inspecao')).toEqual(
      MONITOR_OPER_OBSTACULOS_FISCALIZACAO,
    );
    expect(MONITOR_OPER_OBSTACULOS_FISCALIZACAO).toHaveLength(3);
  });

  it('Regulação usa a mesma lista de Fiscalização/inspeção', () => {
    expect(monitorOperObstaculoOptionsForAtividade('regulacao')).toEqual(
      MONITOR_OPER_OBSTACULOS_FISCALIZACAO,
    );
  });

  it('sem atividade → lista vazia', () => {
    expect(monitorOperObstaculoOptionsForAtividade(undefined)).toEqual([]);
    expect(monitorOperObstaculoOptionsForAtividade('')).toEqual([]);
  });
});
