import axios from 'axios';
import { getRuntimeApiRoot } from '@/config/runtimeApiBase';
import type { ReferenceLabelMaps } from '../types';

async function loadSelectMap(
  endpoint: string,
  idKey: string,
  labelKey: string,
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const { data } = await axios.get<Array<Record<string, unknown>>>(
      `${getRuntimeApiRoot()}/${endpoint}`,
      { withCredentials: true },
    );
    if (!Array.isArray(data)) return map;
    for (const item of data) {
      const label = String(item[labelKey] ?? item.descricao ?? item.nome ?? '').trim();
      const id = item[idKey] ?? item.id ?? item.codigo ?? item.value;
      if (label && id != null) map[String(id)] = label;
    }
  } catch {
    /* mantém mapa vazio */
  }
  return map;
}

export async function loadReferenceLabelMaps(): Promise<ReferenceLabelMaps> {
  const [raca, escolaridade] = await Promise.all([
    loadSelectMap('tipo-raca/select', 'idtipo_raca', 'descricao'),
    loadSelectMap('tipo-escolaridade/select', 'idtipo_escolaridade', 'descricao'),
  ]);
  return { raca, escolaridade };
}

export function resolveReferenceLabel(
  code: string,
  map: Record<string, string>,
  fallback = 'Não informado',
): string {
  const key = String(code ?? '').trim();
  if (!key) return fallback;
  return map[key] ?? `Cód. ${key}`;
}
