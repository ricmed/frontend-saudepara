import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
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
  const municipioId = Number(params.get('municipioId')) || undefined;
  const status = params.get('status') || undefined;

  function setFiltro(chave: 'cicloId' | 'estabelecimentoId' | 'municipioId' | 'status', valor: string) {
    const next = new URLSearchParams(params);
    if (valor) next.set(chave, valor);
    else next.delete(chave);
    if (chave === 'municipioId') {
      next.delete('estabelecimentoId');
      next.delete('cicloId');
    }
    setParams(next, { replace: true });
  }

  function irParaCiclo(ciclo: { id: number; tipo_municipio_id: number }, destino = 'localidades') {
    const next = new URLSearchParams(params);
    next.set('cicloId', String(ciclo.id));
    if (Number(next.get('municipioId')) !== ciclo.tipo_municipio_id) {
      next.delete('estabelecimentoId');
    }
    next.set('municipioId', String(ciclo.tipo_municipio_id));
    const qs = next.toString();
    navigate({ pathname: `/private/microplanejamento/${destino}`, search: qs ? `?${qs}` : '' });
  }

  return { cicloId, estabelecimentoId, municipioId, status, setFiltro, irParaCiclo };
}

export type MunicipioOption = { idtipo_municipio: number; descricao: string };
export type EstabelecimentoOption = { idestabelecimento: number; nome: string; cnes?: string | null };
export type UbsDoCiclo = EstabelecimentoOption & { localidades: number };

export function useUbsDoCiclo(cicloId?: number) {
  const query = useQuery({
    queryKey: ['mp-localidades-ciclo', cicloId, 'todas'],
    enabled: Boolean(cicloId),
    queryFn: () => microplanejamentoApi.localidadesCiclo(cicloId!),
  });
  const ubs = useMemo(() => {
    const mapa = new Map<number, UbsDoCiclo>();
    for (const row of query.data?.data ?? []) {
      const est = row.localidade.estabelecimento;
      const id = est?.idestabelecimento ?? row.localidade.estabelecimento_id;
      const atual = mapa.get(id) ?? {
        idestabelecimento: id,
        nome: est?.nome ?? 'UBS',
        cnes: est?.cnes,
        localidades: 0,
      };
      atual.localidades += 1;
      mapa.set(id, atual);
    }
    return [...mapa.values()];
  }, [query.data]);
  return { ...query, ubs };
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
