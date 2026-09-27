import { describe, expect, it } from 'vitest';
import {
  defaultListaEventoId,
  listFiltersForListaEvento,
  notificacaoVisivelNaLista,
  splitListaEventos,
} from './listaEventoSelecao';

const saire = { idtipo_evento: 6, descricao: 'Festival do Sairé 2026', ativo: 'N' };
const cirio = { idtipo_evento: 1, descricao: 'Círio de Nazaré', ativo: 'S' };
const cop = { idtipo_evento: 2, descricao: 'COP 30', ativo: 'S' };

describe('splitListaEventos', () => {
  it('separa ativo e histórico', () => {
    expect(splitListaEventos([saire, cirio, { idtipo_evento: 0, descricao: 'inválido', ativo: 'S' }])).toEqual({
      ativos: [cirio],
      historico: [saire],
    });
  });
});

describe('defaultListaEventoId', () => {
  it('escolhe o único evento ativo', () => {
    expect(defaultListaEventoId([cirio])).toBe(1);
  });

  it('deixa todos os ativos quando há mais de um', () => {
    expect(defaultListaEventoId([cirio, cop])).toBeNull();
  });

  it('não escolhe histórico quando não há ativo', () => {
    expect(defaultListaEventoId([])).toBeNull();
  });
});

describe('listFiltersForListaEvento', () => {
  it('pede o evento escolhido mesmo desativado', () => {
    expect(listFiltersForListaEvento(6, [])).toEqual({ eventoId: 6 });
  });

  it('sem escolha continua só nos ativos', () => {
    expect(listFiltersForListaEvento(null, [1, 2])).toEqual({
      somenteEventosAtivos: true,
    });
    expect(listFiltersForListaEvento(null, [])).toBeNull();
  });
});

describe('notificacaoVisivelNaLista', () => {
  const ativos = new Set([1]);

  it('no recorte ativo esconde evento desativado', () => {
    expect(notificacaoVisivelNaLista({
      eventId: 6,
      isPending: false,
      selectedEventId: null,
      activeEventIds: ativos,
    })).toBe(false);
  });

  it('no histórico mostra o evento desativado', () => {
    expect(notificacaoVisivelNaLista({
      eventId: 6,
      isPending: false,
      selectedEventId: 6,
      activeEventIds: new Set(),
    })).toBe(true);
  });

  it('pendente sem evento fica só no recorte ativo', () => {
    expect(notificacaoVisivelNaLista({
      eventId: null,
      isPending: true,
      selectedEventId: null,
      activeEventIds: ativos,
    })).toBe(true);
    expect(notificacaoVisivelNaLista({
      eventId: null,
      isPending: true,
      selectedEventId: 6,
      activeEventIds: new Set(),
    })).toBe(false);
  });
});
