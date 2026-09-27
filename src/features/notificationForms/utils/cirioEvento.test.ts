import { describe, expect, it } from 'vitest';
import { isCirioEventDescription, podeVerBotaoCirio } from './cirioEvento';

describe('isCirioEventDescription', () => {
  it('reconhece Círio de Nazaré 2026', () => {
    expect(isCirioEventDescription('Círio de Nazaré 2026')).toBe(true);
    expect(isCirioEventDescription('cirio de nazare 2026')).toBe(true);
  });

  it('não pega outro círio nem o Sairé', () => {
    expect(isCirioEventDescription('Círio de Nazaré')).toBe(false);
    expect(isCirioEventDescription('Círio de Nazaré 2025')).toBe(false);
    expect(isCirioEventDescription('Festival do Sairé 2026')).toBe(false);
  });
});

describe('podeVerBotaoCirio', () => {
  const base = {
    interruptorLigado: true,
    eventoEncontrado: true,
    isNotificador: false,
    isUnidade: false,
    isMunicipio: false,
    isCrs: false,
    cidadeNaLista: false,
    isEstado: false,
    isAdmin: false,
  };

  it('mostra para o estado mesmo sem cidade', () => {
    expect(podeVerBotaoCirio({ ...base, isEstado: true })).toBe(true);
  });

  it('mostra para o notificador de uma cidade da lista', () => {
    expect(
      podeVerBotaoCirio({ ...base, isNotificador: true, cidadeNaLista: true }),
    ).toBe(true);
  });

  it('mostra para a unidade e para a CRS quando a cidade está na lista', () => {
    expect(podeVerBotaoCirio({ ...base, isUnidade: true, cidadeNaLista: true })).toBe(true);
    expect(podeVerBotaoCirio({ ...base, isCrs: true, cidadeNaLista: true })).toBe(true);
  });

  it('esconde unidade e CRS de fora da lista', () => {
    expect(podeVerBotaoCirio({ ...base, isUnidade: true })).toBe(false);
    expect(podeVerBotaoCirio({ ...base, isCrs: true })).toBe(false);
  });

  it('esconde notificador de fora da lista', () => {
    expect(podeVerBotaoCirio({ ...base, isNotificador: true })).toBe(false);
  });
});
