import type { NotificacaoEscopo } from './notificacaoScopeDefaults';

/** Mapa em tempo real da residência — somente gestão estadual (ata DVS.001 + áudio 4). */
export function canShowHepatiteResidenciaMap(input: {
  isEstado: boolean;
  isAdmin: boolean;
}): boolean {
  return input.isEstado || input.isAdmin;
}

/**
 * Unidades notificadoras não devem ver qual estabelecimento notificou ao consultar fichas
 * (somente VE, gestão municipal/APS, regional e estado — áudio 4).
 */
export function shouldHideNotificacaoEstabelecimentoInView(input: {
  readOnly: boolean;
  notificacaoEscopo: NotificacaoEscopo;
  isEstabelecimento: boolean;
  isEstado: boolean;
  isAdmin: boolean;
}): boolean {
  if (!input.readOnly) return false;
  if (input.isEstado || input.isAdmin) return false;
  return input.notificacaoEscopo === 'unidade' || input.isEstabelecimento;
}
