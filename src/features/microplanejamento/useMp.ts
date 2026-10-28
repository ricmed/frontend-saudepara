import { useQuery } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import axios from '@/utils/axiosRetry';

export function useMpFiltro() {
  const [params, setParams] = useSearchParams();
  const cicloId = Number(params.get('cicloId')) || undefined;
  const estabelecimentoId = Number(params.get('estabelecimentoId')) || undefined;
  const municipioId = Number(params.get('municipioId')) || undefined;

  function setFiltro(chave: 'cicloId' | 'estabelecimentoId' | 'municipioId', valor: string) {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    if (chave === 'municipioId') {
      next.delete('estabelecimentoId');
      next.delete('cicloId');
    }
    setParams(next, { replace: true });
  }

  return { cicloId, estabelecimentoId, municipioId, setFiltro };
}

export type MunicipioOption = { idtipo_municipio: number; descricao: string };
export type EstabelecimentoOption = { idestabelecimento: number; nome: string; cnes?: string | null };

function comoLista<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object' && Array.isArray((data as { data?: unknown }).data)) {
    return (data as { data: T[] }).data;
  }
  return [];
}

export function useMunicipios() {
  return useQuery({
    queryKey: ['mp-municipios'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      const { data } = await axios.get('/api/tipo-municipio/select', { withCredentials: true });
      return comoLista<MunicipioOption>(data);
    },
  });
}

export async function buscarEstabelecimentos(municipioId: number, q: string) {
  const { data } = await axios.get(`/api/estabelecimentos/municipio/${municipioId}`, {
    params: { q, limit: 20 },
    withCredentials: true,
  });
  return comoLista<EstabelecimentoOption>(data);
}

export function useEstabelecimentoSelecionado(id?: number) {
  return useQuery({
    queryKey: ['mp-estabelecimento', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data } = await axios.get<EstabelecimentoOption>(`/api/estabelecimentos/${id}`, { withCredentials: true });
      return data;
    },
  });
}

export function numero(valor: FormDataEntryValue | null, fallback = 0) {
  const n = Number(valor);
  return Number.isFinite(n) ? n : fallback;
}

export function texto(valor: FormDataEntryValue | null) {
  const s = String(valor ?? '').trim();
  return s || null;
}
