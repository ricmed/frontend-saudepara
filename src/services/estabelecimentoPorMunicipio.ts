import axios from '@/utils/axiosRetry';

/** Opções da listagem por município. Padrão: somente estabelecimentos ativos. */
export type EstabelecimentosPorMunicipioOptions = {
  incluirInativos?: boolean;
};

export type EstabelecimentoMunicipioItem = {
  id: number;
  nome: string;
  cnes?: string;
};

/**
 * Lista CNES do município. Comportamento padrão (sem opções): apenas ativos.
 * Passe `{ incluirInativos: true }` quando o fluxo precisar de CNES inativos também.
 */
export type HospitalNascimentoSinascItem = EstabelecimentoMunicipioItem;

/**
 * Hospitais de nascimento (lista SINASC × banco) por município — dados ao vivo.
 */
export async function listarHospitaisNascimentoSinasc(
  municipioId: number,
): Promise<HospitalNascimentoSinascItem[]> {
  const response = await axios.get('/api/estabelecimentos/nascimento-sinasc', {
    params: { municipioId },
    headers: { Accept: 'application/json' },
  });

  return (response.data ?? []).map(
    (est: { idestabelecimento: number; nome?: string; cnes?: string }) => ({
      id: est.idestabelecimento,
      nome: est.nome || `Estabelecimento ${est.cnes ?? est.idestabelecimento}`,
      cnes: est.cnes || undefined,
    }),
  );
}

export async function listarEstabelecimentosPorMunicipio(
  municipioId: number,
  options?: EstabelecimentosPorMunicipioOptions,
): Promise<EstabelecimentoMunicipioItem[]> {
  const params: Record<string, string> = {};
  if (options?.incluirInativos) {
    params.incluirInativos = 'true';
  }

  const response = await axios.get(`/api/estabelecimentos/municipio/${municipioId}`, {
    params: Object.keys(params).length ? params : undefined,
    headers: { Accept: 'application/json' },
  });

  return (response.data ?? []).map(
    (est: { idestabelecimento: number; nome?: string; cnes?: string }) => ({
      id: est.idestabelecimento,
      nome: est.nome || `Estabelecimento ${est.cnes ?? est.idestabelecimento}`,
      cnes: est.cnes || undefined,
    }),
  );
}
