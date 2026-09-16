import { describe, expect, it } from 'vitest';
import {
  digitsOnly,
  isSameCpf,
  isSamePersonName,
} from './patientMatchingHelpers';

describe('digitsOnly / isSameCpf', () => {
  it('compara CPF só pelos dígitos', () => {
    expect(digitsOnly('529.982.247-25')).toBe('52998224725');
    expect(isSameCpf({ cpf: '529.982.247-25' }, '52998224725')).toBe(true);
    expect(isSameCpf({ cpf: '52998224725' }, '00000000000')).toBe(false);
  });

  it('não trata CPF incompleto como igual', () => {
    expect(isSameCpf({ cpf: '529982247' }, '529982247')).toBe(false);
  });
});

describe('isSamePersonName', () => {
  it('ignora caixa e espaços nas pontas', () => {
    expect(isSamePersonName({ nome: '  maria silva ' }, 'MARIA SILVA')).toBe(true);
    expect(isSamePersonName({ nome: 'MARIA SILVA' }, 'MARIA SOUZA')).toBe(false);
  });
});
