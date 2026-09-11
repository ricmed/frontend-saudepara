import { describe, expect, it } from 'vitest';
import {
  getNotificacaoHipoteseIds,
  getNotificacaoHipoteseNomes,
} from './hipotesesNotificacao';

describe('hipotesesNotificacao', () => {
  it('lê o join N:N mesmo com FK vazio', () => {
    expect(getNotificacaoHipoteseIds({
      tipo_hipotese_diag_idtipo_hipotese_diag: null,
      notificacao_has_tipo_hipotese_diag: [
        { tipo_hipotese_diag_idtipo_hipotese_diag: 12 },
        { tipo_hipotese_diag: { idtipo_hipotese_diag: 12 } },
      ],
    })).toEqual([12]);
  });

  it('cai no FK legado quando o join está vazio', () => {
    expect(getNotificacaoHipoteseIds({
      tipo_hipotese_diag_idtipo_hipotese_diag: 7,
      notificacao_has_tipo_hipotese_diag: [],
    })).toEqual([7]);
  });

  it('extrai nomes do join para alerta e gráfico', () => {
    expect(getNotificacaoHipoteseNomes({
      original: {
        tipo_hipotese_diag: null,
        notificacao_has_tipo_hipotese_diag: [
          { tipo_hipotese_diag: { descricao: 'SARAMPO' } },
        ],
      },
    })).toEqual(['SARAMPO']);
  });
});
