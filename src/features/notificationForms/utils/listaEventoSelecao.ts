import type { NotificacaoListFilters } from '@/services/NotificacaoService';
import { isEventoAtivo, type EventoOffline } from './offlineEventoScope';
import { listFiltersForActiveEvents } from './listFiltersForActiveEvents';

export type ListaEvento = EventoOffline & {
  descricao: string;
};

export function splitListaEventos<T extends EventoOffline>(eventos: T[]): {
  ativos: T[];
  historico: T[];
} {
  const validos = eventos.filter((evento) => (
    Number.isInteger(evento.idtipo_evento) && evento.idtipo_evento > 0
  ));
  return {
    ativos: validos.filter((evento) => isEventoAtivo(evento)),
    historico: validos.filter((evento) => !isEventoAtivo(evento)),
  };
}

/** Um ativo vem escolhido. Vários ou nenhum: a lista abre nos ativos. */
export function defaultListaEventoId(
  ativos: Array<Pick<EventoOffline, 'idtipo_evento'>>,
): number | null {
  if (ativos.length === 1) {
    return ativos[0].idtipo_evento;
  }
  return null;
}

export function listFiltersForListaEvento(
  selectedEventId: number | null,
  activeEventIds: Iterable<number>,
): NotificacaoListFilters | null {
  if (
    selectedEventId !== null
    && Number.isInteger(selectedEventId)
    && selectedEventId > 0
  ) {
    return { eventoId: selectedEventId };
  }
  return listFiltersForActiveEvents(activeEventIds);
}

export function notificacaoVisivelNaLista(params: {
  eventId: number | null;
  isPending: boolean;
  selectedEventId: number | null;
  activeEventIds: ReadonlySet<number>;
}): boolean {
  const { eventId, isPending, selectedEventId, activeEventIds } = params;

  if (selectedEventId !== null) {
    if (eventId === selectedEventId) {
      return true;
    }
    return eventId == null
      && isPending
      && activeEventIds.has(selectedEventId);
  }

  if (eventId == null) {
    return isPending;
  }
  return activeEventIds.has(eventId);
}
