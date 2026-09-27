export const CIRIO_EVENT_NAME = 'Círio de Nazaré 2026';

function normalizarNomeEvento(valor: string): string {
  return valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

export function isCirioEventDescription(
  descricao: string | null | undefined,
): boolean {
  return (
    typeof descricao === 'string' &&
    normalizarNomeEvento(descricao) === normalizarNomeEvento(CIRIO_EVENT_NAME)
  );
}

/** Notificador, município ou unidade de uma cidade da lista, CRS dessas cidades, estado ou admin. */
export function podeVerBotaoCirio(input: {
  interruptorLigado: boolean;
  eventoEncontrado: boolean;
  isNotificador: boolean;
  isUnidade: boolean;
  isMunicipio: boolean;
  isCrs: boolean;
  cidadeNaLista: boolean;
  isEstado: boolean;
  isAdmin: boolean;
}): boolean {
  if (!input.interruptorLigado || !input.eventoEncontrado) {
    return false;
  }
  if (input.isEstado || input.isAdmin) {
    return true;
  }
  if (!input.cidadeNaLista) {
    return false;
  }
  return (
    input.isNotificador || input.isUnidade || input.isMunicipio || input.isCrs
  );
}
