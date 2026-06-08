import { describe, expect, it } from 'vitest';
import {
  canShowHepatiteResidenciaMap,
  shouldHideNotificacaoEstabelecimentoInView,
} from './hepatiteCriancaGestaoAccess';

describe('canShowHepatiteResidenciaMap', () => {
  it('libera mapa para gestão estadual', () => {
    expect(canShowHepatiteResidenciaMap({ isEstado: true, isAdmin: false })).toBe(true);
  });

  it('libera mapa para admin master', () => {
    expect(canShowHepatiteResidenciaMap({ isEstado: false, isAdmin: true })).toBe(true);
  });

  it('bloqueia mapa para demais níveis', () => {
    expect(canShowHepatiteResidenciaMap({ isEstado: false, isAdmin: false })).toBe(false);
  });
});

describe('shouldHideNotificacaoEstabelecimentoInView', () => {
  it('oculta unidade notificadora em consulta para escopo unidade', () => {
    expect(
      shouldHideNotificacaoEstabelecimentoInView({
        readOnly: true,
        notificacaoEscopo: 'unidade',
        isEstabelecimento: false,
        isEstado: false,
        isAdmin: false,
      }),
    ).toBe(true);
  });

  it('mantém visível para gestão estadual', () => {
    expect(
      shouldHideNotificacaoEstabelecimentoInView({
        readOnly: true,
        notificacaoEscopo: 'municipio',
        isEstabelecimento: false,
        isEstado: true,
        isAdmin: false,
      }),
    ).toBe(false);
  });

  it('mantém visível em edição para unidade notificadora', () => {
    expect(
      shouldHideNotificacaoEstabelecimentoInView({
        readOnly: false,
        notificacaoEscopo: 'unidade',
        isEstabelecimento: true,
        isEstado: false,
        isAdmin: false,
      }),
    ).toBe(false);
  });
});
