/** Sorologia criança — valor 2 = Não reagente/Negativo. */
export const CRIANCA_LAB_NAO_REAGENTE = '2';

export const CRIANCA_LAB_ESQUEMA1_ANTI_HBS_KEY = 'crianca.lab.esquema1.anti_hbs';

export const CRIANCA_LAB_REGISTRAR_ESQUEMA2_KEY = 'crianca.lab.registrar_esquema_2';

/** Repetição do esquema vacinal só quando Anti-HBs do 1º esquema é não reagente (áudio 11). */
export function shouldShowCriancaLabEsquema2Repeticao(antiHbsEsquema1: unknown): boolean {
  return String(antiHbsEsquema1 ?? '').trim() === CRIANCA_LAB_NAO_REAGENTE;
}
