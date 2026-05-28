import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';

const API_ROOT = getRuntimeApiRoot();

export interface SyndromicAgravoOption {
  value: string;
  label: string;
  cid10Lista: string[];
}

export interface SyndromicSintomaOption {
  value: string;
  /** Termo oficial da ficha (valor exibido e persistido via id). */
  label: string;
  termoOficial?: string;
  /** Aliases apenas para busca. */
  aliases?: string[];
  /** @deprecated use aliases */
  sinonimos?: string[];
  observacao?: string;
}

function mapSintomaOption(item: Record<string, unknown>): SyndromicSintomaOption {
  const termoOficial = String(item.termoOficial ?? item.label ?? '');
  const aliasesRaw = item.aliases ?? item.sinonimos;
  const aliases = Array.isArray(aliasesRaw)
    ? aliasesRaw.map((v) => String(v)).filter(Boolean)
    : undefined;
  return {
    value: String(item.value),
    label: termoOficial,
    termoOficial,
    aliases,
    sinonimos: aliases,
    observacao: item.observacao != null ? String(item.observacao) : undefined,
  };
}

export interface SyndromicAgravoRanking {
  value: string;
  label: string;
  score: number;
  compatibility: number;
  matchedSymptomsCount: number;
  matchedSymptoms: string[];
}

export async function fetchSyndromicAgravos(): Promise<SyndromicAgravoOption[]> {
  const response = await axios.get(`${API_ROOT}/syndromic-matrix/agravos/select`, {
    withCredentials: true,
  });
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map((item: any) => ({
    value: String(item.value),
    label: String(item.label),
    cid10Lista: Array.isArray(item.cid10Lista)
      ? item.cid10Lista.map((v: any) => String(v)).filter(Boolean)
      : [],
  }));
}

export async function fetchSyndromicSintomas(agravoIds: string[]): Promise<SyndromicSintomaOption[]> {
  const params =
    agravoIds.length > 0
      ? { agravoIds: agravoIds.join(',') }
      : undefined;
  const response = await axios.get(`${API_ROOT}/syndromic-matrix/sintomas/select`, {
    params,
    withCredentials: true,
  });
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map((item: any) => mapSintomaOption(item));
}

export interface SyndromicSintomaDetail {
  value: string;
  label: string;
  sinonimos?: string[];
  categoria: string;
  sinalAlarme: boolean;
  sinalGravidade: boolean;
}

export async function fetchSyndromicSintomasByAgravo(agravoId: string): Promise<SyndromicSintomaDetail[]> {
  const response = await axios.get(`${API_ROOT}/syndromic-matrix/sintomas/by-agravo`, {
    params: { agravoId },
    withCredentials: true,
  });
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map((item: any) => ({
    ...mapSintomaOption(item),
    categoria: String(item.categoria ?? ''),
    sinalAlarme: Boolean(item.sinalAlarme),
    sinalGravidade: Boolean(item.sinalGravidade),
  }));
}

export async function fetchSyndromicAgravosRanking(
  sintomaIds: string[],
): Promise<SyndromicAgravoRanking[]> {
  const params =
    sintomaIds.length > 0
      ? { sintomaIds: sintomaIds.join(',') }
      : undefined;
  const response = await axios.get(`${API_ROOT}/syndromic-matrix/agravos/ranking`, {
    params,
    withCredentials: true,
  });
  const data = Array.isArray(response.data) ? response.data : [];
  return data.map((item: any) => ({
    value: String(item.value),
    label: String(item.label),
    score: Number(item.score) || 0,
    compatibility: Number(item.compatibility) || 0,
    matchedSymptomsCount: Number(item.matchedSymptomsCount) || 0,
    matchedSymptoms: Array.isArray(item.matchedSymptoms)
      ? item.matchedSymptoms.map((v: any) => String(v))
      : [],
  }));
}

