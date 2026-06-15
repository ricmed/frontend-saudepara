import { describe, expect, it } from 'vitest';
import { getIdadeFieldDefaultUnidade, isIdadeMesesComoTotal } from './idadeFieldConfig';

describe('idadeFieldConfig', () => {
  it('usa meses como total quando idadeMaxMeses > 11', () => {
    expect(isIdadeMesesComoTotal({}, 24)).toBe(true);
    expect(isIdadeMesesComoTotal({ somenteMeses: true }, 11)).toBe(true);
    expect(isIdadeMesesComoTotal({}, 11)).toBe(false);
  });

  it('padrão meses na ficha criança exposta (até 24 meses)', () => {
    const field = { idadeMaxMeses: 24, somenteMeses: true };
    expect(getIdadeFieldDefaultUnidade(field, 24)).toBe('meses');
  });

  it('mantém padrão anos em formulários genéricos (máx. 11 meses na unidade)', () => {
    expect(getIdadeFieldDefaultUnidade({}, 11)).toBe('anos');
  });

  it('infere unidade a partir do valor já salvo', () => {
    expect(getIdadeFieldDefaultUnidade({}, 11, 18)).toBe('anos');
    expect(getIdadeFieldDefaultUnidade({}, 11, 6)).toBe('meses');
  });
});
