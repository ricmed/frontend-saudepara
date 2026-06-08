/** Sorologia criança: valor 1 = Reagente/Positivo. */
export const CRIANCA_LAB_REAGENTE = '1';

/** ALT visível somente com HBsAg reagente (áudio 9). */
export function shouldShowCriancaLabAlt(hbsag: unknown): boolean {
  return String(hbsag ?? '').trim() === CRIANCA_LAB_REAGENTE;
}

export const CRIANCA_LAB_ALT_KEYS_BY_ESQUEMA = {
  1: ['crianca.lab.esquema1.alt', 'crianca.lab.esquema1.alt_data'] as const,
  2: ['crianca.lab.esquema2.alt', 'crianca.lab.esquema2.alt_data'] as const,
};

export const CRIANCA_LAB_HBSAG_KEYS_BY_ESQUEMA = {
  1: 'crianca.lab.esquema1.hbsag',
  2: 'crianca.lab.esquema2.hbsag',
} as const;
