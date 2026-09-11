import type { NotificacaoListFilters } from '@/services/NotificacaoService';

export function listFiltersForActiveEvents(
  activeEventIds: Iterable<number>,
): NotificacaoListFilters | null {
  const ids = [...new Set(
    [...activeEventIds].filter((id) => Number.isInteger(id) && id > 0),
  )];

  if (ids.length === 0) {
    return null;
  }

  if (ids.length === 1) {
    return { eventoId: ids[0] };
  }

  return { somenteEventosAtivos: true };
}
