import { describe, expect, it } from 'vitest';
import { listFiltersForActiveEvents } from './listFiltersForActiveEvents';

describe('listFiltersForActiveEvents', () => {
  it('não pede a lista geral quando não há evento ativo', () => {
    expect(listFiltersForActiveEvents([])).toBeNull();
  });

  it('usa eventoId quando só um evento está ativo', () => {
    expect(listFiltersForActiveEvents([6])).toEqual({ eventoId: 6 });
  });

  it('usa somenteEventosAtivos quando há mais de um evento ativo', () => {
    expect(listFiltersForActiveEvents([1, 2])).toEqual({
      somenteEventosAtivos: true,
    });
  });
});
