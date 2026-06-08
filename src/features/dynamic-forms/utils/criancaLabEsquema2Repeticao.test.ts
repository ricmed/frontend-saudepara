import { describe, expect, it } from 'vitest';
import { shouldShowCriancaLabEsquema2Repeticao } from './criancaLabEsquema2Repeticao';

describe('shouldShowCriancaLabEsquema2Repeticao', () => {
  it('libera repetição quando Anti-HBs do 1º esquema é não reagente', () => {
    expect(shouldShowCriancaLabEsquema2Repeticao('2')).toBe(true);
  });

  it('oculta repetição quando Anti-HBs é reagente ou vazio', () => {
    expect(shouldShowCriancaLabEsquema2Repeticao('1')).toBe(false);
    expect(shouldShowCriancaLabEsquema2Repeticao('')).toBe(false);
  });
});
