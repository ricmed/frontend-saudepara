import { usaLocalidadeEvento } from './procedenciaResidencia';
import type { ModoLocalidadeEvento } from '../types/index2';

export type EventoOffline = {
  idtipo_evento: number;
  ativo?: string | boolean | number;
  modo_localidade_evento?: ModoLocalidadeEvento | null;
};

export type EstabelecimentoOfflineDTO = {
  idestabelecimento: number;
  nome: string;
  cnes?: string | null;
  cidade?: string | null;
  ativo?: string;
};

export type VinculoEstabelecimentosEvento = {
  vincula_estabelecimentos: boolean;
  data?: EstabelecimentoOfflineDTO[];
  encaminhamentos?: EstabelecimentoOfflineDTO[];
  obitos?: EstabelecimentoOfflineDTO[];
};

export function isEventoAtivo(
  evento: Pick<EventoOffline, 'ativo'>,
): boolean {
  return evento.ativo === 'S' || evento.ativo === '1' || evento.ativo === true;
}

export function eventosAtivos<T extends EventoOffline>(eventos: T[]): T[] {
  return eventos.filter((evento) => (
    isEventoAtivo(evento)
    && Number.isInteger(evento.idtipo_evento)
    && evento.idtipo_evento > 0
  ));
}

export function eventosAtivosComLocalidade<T extends EventoOffline>(
  eventos: T[],
): T[] {
  return eventosAtivos(eventos).filter((evento) => (
    usaLocalidadeEvento(evento.modo_localidade_evento)
  ));
}

export function deveRestringirEstabelecimentosAoEvento(
  vinculos: Array<Pick<VinculoEstabelecimentosEvento, 'vincula_estabelecimentos'>>,
): boolean {
  return vinculos.length > 0
    && vinculos.every((item) => item.vincula_estabelecimentos);
}

export function unirEstabelecimentosDoEvento(
  vinculos: VinculoEstabelecimentosEvento[],
): EstabelecimentoOfflineDTO[] {
  const byId = new Map<number, EstabelecimentoOfflineDTO>();
  for (const vinculo of vinculos) {
    const rows = [
      ...(vinculo.data ?? []),
      ...(vinculo.encaminhamentos ?? []),
      ...(vinculo.obitos ?? []),
    ];
    for (const row of rows) {
      if (Number.isInteger(row.idestabelecimento) && row.idestabelecimento > 0) {
        byId.set(row.idestabelecimento, row);
      }
    }
  }
  return [...byId.values()];
}
