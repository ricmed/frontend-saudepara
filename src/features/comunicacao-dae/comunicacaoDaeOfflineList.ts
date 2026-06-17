import type { ComunicacaoDae } from '@/services/ComunicacaoDaeService';

type DaeOption = { id_dae: number; nome: string; codigo?: string };

function offlineIdToDisplayId(offlineId: string): number {
  let hash = 0;
  for (let i = 0; i < offlineId.length; i++) {
    hash = (hash << 5) - hash + offlineId.charCodeAt(i);
    hash |= 0;
  }
  return -Math.abs(hash || 1);
}

type PendingComunicacaoDae = {
  offlineId: string;
  id?: number;
  formData: {
    data_comunicacao?: string;
    nome_paciente?: string;
    id_dae?: number;
    id_daes?: number[];
    id_municipio_ocorrencia?: number;
    id_municipio_residencia?: number;
    origem_tipo?: ComunicacaoDae['origem_tipo'];
    origem_id?: number;
    digitador?: string;
    telefone_digitador?: string;
    observacao_descricao?: string;
  };
  timestamp?: number;
};

export function mapPendingComunicacaoDaeToListItem(
  item: PendingComunicacaoDae,
  daesCache: DaeOption[] = [],
): ComunicacaoDae & { _isPending?: boolean; offlineId?: string } {
  const fd = item.formData || {};
  const agravoIds = fd.id_daes?.length
    ? [...new Set(fd.id_daes)]
    : fd.id_dae
      ? [fd.id_dae]
      : [];

  const daes = agravoIds
    .map((id) => daesCache.find((d) => d.id_dae === id))
    .filter(Boolean)
    .map((d) => ({
      id_dae: d!.id_dae,
      nome: d!.nome,
      codigo: d!.codigo,
    }));

  const primaryDae = daes[0];

  return {
    id_comunicacao: item.id ?? offlineIdToDisplayId(item.offlineId),
    data_comunicacao: fd.data_comunicacao || new Date(item.timestamp || Date.now()).toISOString(),
    nome_paciente: fd.nome_paciente || 'Paciente (offline)',
    observacao_descricao: fd.observacao_descricao,
    digitador: fd.digitador,
    telefone_digitador: fd.telefone_digitador,
    id_municipio_ocorrencia: fd.id_municipio_ocorrencia || 0,
    id_municipio_residencia: fd.id_municipio_residencia || 0,
    origem_tipo: fd.origem_tipo || 'NHE',
    origem_id: fd.origem_id || 0,
    id_dae: agravoIds[0] || 0,
    id_daes: agravoIds,
    daes,
    dae: primaryDae
      ? { id_dae: primaryDae.id_dae, nome: primaryDae.nome, codigo: primaryDae.codigo }
      : undefined,
    created_at: new Date(item.timestamp || Date.now()).toISOString(),
    updated_at: new Date(item.timestamp || Date.now()).toISOString(),
    lida: true,
    _isPending: true,
    offlineId: item.offlineId,
  };
}

export function mergeComunicacoesDaeForOfflineList(
  cached: ComunicacaoDae[],
  pending: ComunicacaoDae[],
): ComunicacaoDae[] {
  const pendingOfflineIds = new Set(
    pending.map((p) => (p as ComunicacaoDae & { offlineId?: string }).offlineId).filter(Boolean),
  );

  const withoutStalePending = cached.filter((c) => {
    const offlineId = (c as ComunicacaoDae & { offlineId?: string }).offlineId;
    return !offlineId || !pendingOfflineIds.has(offlineId);
  });

  const merged = [...pending, ...withoutStalePending];
  merged.sort((a, b) => {
    const ta = new Date(a.data_comunicacao).getTime();
    const tb = new Date(b.data_comunicacao).getTime();
    return tb - ta;
  });

  return merged;
}
