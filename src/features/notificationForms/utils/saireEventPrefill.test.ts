import { describe, expect, it } from 'vitest';
import {
  buildNovaComunicacaoSairePath,
  isSaireEventDescription,
  resolvePrefillEventoId,
} from './saireEventPrefill';

const options = [
  { idtipo_evento: 1, descricao: 'COP 30' },
  { idtipo_evento: 4, descricao: 'Festival do Sairé 2026' },
];

describe('saireEventPrefill', () => {
  it('pré-seleciona eventoId válido da query quando o campo está vazio', () => {
    expect(resolvePrefillEventoId('4', options, '')).toBe('4');
  });

  it('não sobrescreve evento já escolhido', () => {
    expect(resolvePrefillEventoId('4', options, '1')).toBeNull();
  });

  it('ignora id inválido ou ausente nas opções', () => {
    expect(resolvePrefillEventoId('99', options, '')).toBeNull();
    expect(resolvePrefillEventoId('abc', options, '')).toBeNull();
    expect(resolvePrefillEventoId(null, options, '')).toBeNull();
  });

  it('detecta descrição Sairé', () => {
    expect(isSaireEventDescription('Festival do Sairé 2026')).toBe(true);
    expect(isSaireEventDescription('COP 30')).toBe(false);
  });

  it('monta path da nova ficha com ou sem eventoId', () => {
    expect(buildNovaComunicacaoSairePath(4)).toBe(
      '/private/comunicacao-de-caso/nova?eventoId=4',
    );
    expect(buildNovaComunicacaoSairePath(null)).toBe(
      '/private/comunicacao-de-caso/nova',
    );
  });
});
