import { SAIRE_EVENT_NAME_RE } from '@/theme/palette';

type EventoLike = {
  idtipo_evento: number;
  descricao?: string | null;
};

/**
 * Resolve o evento a pré-selecionar a partir de `?eventoId=` na URL.
 * Só aplica se o campo ainda estiver vazio e o ID existir nas opções ativas.
 */
export function resolvePrefillEventoId(
  searchEventoId: string | null | undefined,
  eventoOptions: EventoLike[],
  currentEvento: string,
): string | null {
  if (currentEvento) {
    return null;
  }

  if (!searchEventoId) {
    return null;
  }

  const id = Number(searchEventoId);
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }

  const exists = eventoOptions.some((evento) => evento.idtipo_evento === id);
  return exists ? String(id) : null;
}

export function isSaireEventDescription(
  descricao: string | null | undefined,
): boolean {
  return typeof descricao === 'string' && SAIRE_EVENT_NAME_RE.test(descricao);
}

export function buildNovaComunicacaoSairePath(eventoId: number | null): string {
  if (eventoId && Number.isInteger(eventoId) && eventoId > 0) {
    return `/private/comunicacao-de-caso/nova?eventoId=${eventoId}`;
  }
  return '/private/comunicacao-de-caso/nova';
}
