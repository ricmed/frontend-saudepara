import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from '@/utils/axiosRetry';
import { microplanejamentoApi } from './api';

export function searchSemCiclo(search: string) {
  const next = new URLSearchParams(search);
  next.delete('cicloId');
  const qs = next.toString();
  return qs ? `?${qs}` : '';
}

export function useMpFiltro() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const cicloId = Number(params.get('cicloId')) || undefined;
  const estabelecimentoId = Number(params.get('estabelecimentoId')) || undefined;
  const localidadeId = Number(params.get('localidadeId')) || undefined;
  const municipioId = Number(params.get('municipioId')) || undefined;
  const status = params.get('status') || undefined;

  const setFiltro = useCallback((chave: 'cicloId' | 'estabelecimentoId' | 'localidadeId' | 'municipioId' | 'status', valor: string) => {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    if (chave === 'municipioId') {
      next.delete('estabelecimentoId');
      next.delete('localidadeId');
      next.delete('cicloId');
    }
    if (chave === 'estabelecimentoId') next.delete('localidadeId');
    setParams(next, { replace: true });
  }, [params, setParams]);

  function irParaCiclo(ciclo: { id: number; tipo_municipio_id: number }, destino = 'localidades') {
    const next = new URLSearchParams(params);
    next.set('cicloId', String(ciclo.id));
    if (Number(next.get('municipioId')) !== ciclo.tipo_municipio_id) {
      next.delete('estabelecimentoId');
      next.delete('localidadeId');
    }
    next.set('municipioId', String(ciclo.tipo_municipio_id));
    const qs = next.toString();
    navigate({ pathname: `/private/microplanejamento/${destino}`, search: qs ? `?${qs}` : '' });
  }

  return { cicloId, estabelecimentoId, localidadeId, municipioId, status, setFiltro, irParaCiclo };
}

export type MunicipioOption = { idtipo_municipio: number; descricao: string };
export type EstabelecimentoOption = { idestabelecimento: number; nome: string; cnes?: string | null };
export type UbsDoCiclo = EstabelecimentoOption & { localidades: number };

export function useUbsDoCiclo(cicloId?: number) {
  const query = useQuery({
    queryKey: ['mp-ubs-ciclo', cicloId],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.ubsDoCiclo(cicloId!),
  });
  return { ...query, ubs: query.data?.data ?? [] };
}

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
