import { describe, expect, it } from 'vitest';
import { mensagemPeriodoMeta } from './periodoMeta';

describe('mensagemPeriodoMeta', () => {
  it('aceita um intervalo de até 12 meses', () => {
    expect(mensagemPeriodoMeta('2027-01-15', '2027-03-10')).toBeNull();
    expect(mensagemPeriodoMeta('2027-01-15', '2028-01-15')).toBeNull();
  });

  it('recusa início posterior ao fim e intervalo acima de 12 meses', () => {
    expect(mensagemPeriodoMeta('2027-03-10', '2027-01-15')).toBe('A data início não pode ser posterior à data fim.');
    expect(mensagemPeriodoMeta('2027-01-15', '2028-01-16')).toBe('O período não pode passar de 12 meses.');
  });
});