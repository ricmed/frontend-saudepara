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
  label: string;
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
  return data.map((item: any) => ({
    value: String(item.value),
    label: String(item.label),
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

